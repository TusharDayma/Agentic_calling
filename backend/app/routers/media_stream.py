import json
import logging
import asyncio
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Candidate, Campaign, CallLog, CallEvaluation
from app.services.stt_service import stt_service, AudioVADBuffer
from app.services.tts_service import tts_service
from app.services.ollama_service import ollama_service

router = APIRouter()
logger = logging.getLogger(__name__)


@dataclass
class CallState:
    """Call State Machine tracking question index, re-asks, and transcript."""
    candidate_id: str
    candidate_name: str
    questions: List[Dict[str, str]]
    current_index: int = 0
    reask_count: int = 0
    stream_sid: Optional[str] = None
    transcript_history: List[str] = field(default_factory=list)
    is_finished: bool = False


async def send_tts_audio_to_twilio(websocket: WebSocket, stream_sid: str, text: str):
    """Synthesizes text response and streams base64 μ-law chunks back to Twilio via WebSocket."""
    if not stream_sid or not text:
        return

    # Synthesize audio into 20ms base64 μ-law chunks
    base64_chunks = tts_service.text_to_speech_mulaw_chunks(text)

    for chunk in base64_chunks:
        media_message = {
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": chunk
            }
        }
        await websocket.send_text(json.dumps(media_message))
        # Yield briefly to maintain smooth 20ms streaming cadence
        await asyncio.sleep(0.015)


@router.websocket("/media-stream/{candidate_id}")
async def twilio_media_stream_websocket(websocket: WebSocket, candidate_id: str):
    """
    Step 4: Real-time bidirectional WebSocket handler for Twilio Media Streams.
    Orchestrates:
    - Decoding Twilio μ-law audio stream
    - VAD & audio buffering
    - Agent 2 (Local STT)
    - Agent 3 (Interviewer LLM state machine via Ollama)
    - Agent 1 (Local TTS)
    - Agent 4 (Post-call Ranker LLM)
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for candidate {candidate_id}")

    db: Session = SessionLocal()
    state: Optional[CallState] = None
    vad_buffer = AudioVADBuffer()

    try:
        # Load Candidate and Campaign details
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.error(f"Candidate {candidate_id} not found in DB.")
            await websocket.close()
            return

        campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
        questions = campaign.question_set if (campaign and campaign.question_set) else [
            {"id": "q1", "question_text": "Tell me about your relevant technical experience.", "expected_answer": "Experience in software engineering, APIs, and databases."}
        ]

        cand_name = f"{candidate.first_name} {candidate.last_name}".strip()
        state = CallState(
            candidate_id=candidate_id,
            candidate_name=cand_name,
            questions=questions
        )

        candidate.status = "in_call"
        db.commit()

        # Listen for Twilio events
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event_type = data.get("event")

            if event_type == "start":
                state.stream_sid = data.get("start", {}).get("streamSid")
                logger.info(f"Twilio Media Stream started: StreamSid={state.stream_sid}")

                # Agent 3: Send initial greeting and first question
                first_q = state.questions[0]["question_text"]
                greeting = f"Hello {candidate.first_name}! Welcome to your screening interview. Let's begin. {first_q}"
                
                state.transcript_history.append(f"AI Recruiter: {greeting}")
                await send_tts_audio_to_twilio(websocket, state.stream_sid, greeting)

            elif event_type == "media" and state and state.stream_sid and not state.is_finished:
                payload = data.get("media", {}).get("payload", "")
                
                # Process audio chunk with VAD
                is_utterance_complete, pcm_audio = vad_buffer.process_chunk(payload)

                if is_utterance_complete and pcm_audio:
                    # Agent 2: Transcribe candidate's answer using STT
                    candidate_text = stt_service.transcribe_pcm(pcm_audio)
                    
                    if len(candidate_text.strip()) > 3:
                        logger.info(f"Candidate Utterance: '{candidate_text}'")
                        state.transcript_history.append(f"Candidate ({state.candidate_name}): {candidate_text}")

                        curr_q = state.questions[state.current_index]
                        q_text = curr_q.get("question_text", "")
                        exp_ans = curr_q.get("expected_answer", "")

                        # Agent 3: Interviewer LLM evaluation
                        eval_res = ollama_service.evaluate_and_respond(
                            candidate_name=state.candidate_name,
                            question_text=q_text,
                            expected_answer=exp_ans,
                            candidate_answer=candidate_text,
                            reask_count=state.reask_count
                        )

                        is_correct = eval_res.get("is_correct", True)
                        next_speech = eval_res.get("next_speech", "")

                        if is_correct or state.reask_count >= 2:
                            # Advance to next question
                            state.current_index += 1
                            state.reask_count = 0

                            if state.current_index < len(state.questions):
                                next_q = state.questions[state.current_index]["question_text"]
                                full_speech = f"{next_speech} Next question: {next_q}"
                            else:
                                # Interview completed!
                                full_speech = f"{next_speech} Thank you very much for your time! That concludes our technical screening interview. Have a wonderful day."
                                state.is_finished = True
                        else:
                            # Answer vague/incorrect: increment reask count and prompt for clarification
                            state.reask_count += 1
                            full_speech = next_speech

                        state.transcript_history.append(f"AI Recruiter: {full_speech}")
                        await send_tts_audio_to_twilio(websocket, state.stream_sid, full_speech)

                        if state.is_finished:
                            break

            elif event_type == "stop":
                logger.info("Twilio Media Stream stopped.")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for candidate {candidate_id}")
    except Exception as e:
        logger.error(f"Error in media stream WebSocket loop: {e}", exc_info=True)
    finally:
        db.close()
        
        # Trigger Post-Call Ranking (Agent 4)
        if state and state.transcript_history:
            asyncio.create_task(finalize_call_and_rank(candidate_id, state))


async def finalize_call_and_rank(candidate_id: str, state: CallState):
    """Saves transcript to DB and runs Agent 4 (Ranker LLM via Ollama) to compute score out of 100."""
    db: Session = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            return

        candidate.status = "completed"
        full_transcript = "\n".join(state.transcript_history)

        # Create or update CallLog
        call_log = db.query(CallLog).filter(CallLog.candidate_id == candidate_id).order_by(CallLog.created_at.desc()).first()
        if not call_log:
            call_log = CallLog(candidate_id=candidate_id, status="completed")
            db.add(call_log)
        
        call_log.raw_transcript = full_transcript
        call_log.status = "completed"
        db.commit()

        # Agent 4: Post-Call Ranker LLM via Ollama
        campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
        role_title = campaign.title if campaign else "Technical Role"

        rank_res = ollama_service.rank_candidate_interview(
            candidate_name=state.candidate_name,
            role_title=role_title,
            transcript=full_transcript,
            questions_and_expected=state.questions
        )

        score_val = rank_res.get("score", 80.0)
        justification_val = rank_res.get("justification", "Completed technical screening interview.")
        tech_score = rank_res.get("technical_fit", 8.0)
        comm_score = rank_res.get("communication_fit", 8.0)

        # Save Evaluation
        evaluation = db.query(CallEvaluation).filter(CallEvaluation.call_log_id == call_log.id).first()
        if not evaluation:
            evaluation = CallEvaluation(
                call_log_id=call_log.id,
                candidate_intelligence_score=score_val,
                technical_score=tech_score,
                communication_score=comm_score,
                ai_generated_summary=justification_val
            )
            db.add(evaluation)
        else:
            evaluation.candidate_intelligence_score = score_val
            evaluation.technical_score = tech_score
            evaluation.communication_score = comm_score
            evaluation.ai_generated_summary = justification_val

        db.commit()
        logger.info(f"Successfully ranked candidate {candidate_id}: Score={score_val}/100")
    except Exception as ex:
        logger.error(f"Error finalizing call and ranking candidate: {ex}", exc_info=True)
    finally:
        db.close()
