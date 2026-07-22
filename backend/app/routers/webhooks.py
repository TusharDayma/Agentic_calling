import re
import logging
from fastapi import APIRouter, Depends, Form, Request, Response, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate, Campaign, CallLog, CallEvaluation
from app.config import settings
from app.services.ollama_service import ollama_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook/whatsapp")
async def handle_whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(""),
    db: Session = Depends(get_db)
):
    """
    Step 2: Handles Twilio WhatsApp reply webhook.
    If candidate replies 'YES', responds with link: http://{ngrok-url}/schedule/{candidate_id}
    """
    clean_phone = From.replace("whatsapp:", "").strip()
    msg_body = Body.strip()
    logger.info(f"Received WhatsApp webhook from {clean_phone}: '{msg_body}'")

    # Find candidate by phone number
    candidate = db.query(Candidate).filter(
        (Candidate.phone_number == clean_phone) | (Candidate.phone_number == From)
    ).order_by(Candidate.created_at.desc()).first()

    if not candidate:
        # Fallback to latest candidate if testing locally
        candidate = db.query(Candidate).order_by(Candidate.created_at.desc()).first()

    response_msg = "Thank you for your response."

    if candidate:
        if re.search(r'\byes\b', msg_body.lower()):
            candidate.whatsapp_status = "confirmed"
            candidate.status = "whatsapp_confirmed"
            db.commit()

            schedule_url = f"{settings.NGROK_URL.rstrip('/')}/schedule/{candidate.id}"
            response_msg = f"Great! Click here to start your automated interview: {schedule_url}"
        else:
            response_msg = "Thanks! Reply YES whenever you are ready to start your interview."

    twiml_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{response_msg}</Message>
</Response>"""
    return Response(content=twiml_xml, media_type="text/xml")


@router.api_route("/webhook/voice/{candidate_id}", methods=["GET", "POST"])
async def handle_voice_twiml_webhook(candidate_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Step 3: TwiML response pointing outbound voice call to WebSocket media stream endpoint.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate:
        candidate.status = "in_call"
        db.commit()

    # Convert http(s) ngrok URL to ws(s) ngrok URL
    ngrok_clean = settings.NGROK_URL.replace("http://", "").replace("https://", "").rstrip('/')
    ws_scheme = "wss" if "https" in settings.NGROK_URL else "ws"
    ws_url = f"{ws_scheme}://{ngrok_clean}/media-stream/{candidate_id}"

    twiml_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Connecting to your automated interview session. Please hold on.</Say>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml_xml, media_type="text/xml")


@router.post("/webhook/call-status")
async def handle_call_status(
    candidate_id: str = None,
    CallSid: str = Form(None),
    CallStatus: str = Form(None),
    db: Session = Depends(get_db)
):
    """Handles Twilio post-call status webhook and triggers Agent 4 ranking if call ended."""
    logger.info(f"Call status update for candidate {candidate_id}: CallSid={CallSid}, Status={CallStatus}")
    
    if candidate_id and CallStatus in ["completed", "no-answer", "busy", "failed"]:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if candidate and candidate.status == "in_call":
            candidate.status = "completed" if CallStatus == "completed" else "failed"
            db.commit()

            # Trigger Agent 4 Ranker LLM if transcript exists
            call_log = db.query(CallLog).filter(CallLog.candidate_id == candidate_id).order_by(CallLog.created_at.desc()).first()
            if call_log and call_log.raw_transcript and not call_log.evaluation:
                campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
                role_title = campaign.title if campaign else "Candidate Role"
                questions = campaign.question_set if campaign else []

                evaluation_data = ollama_service.rank_candidate_interview(
                    candidate_name=f"{candidate.first_name} {candidate.last_name}",
                    role_title=role_title,
                    transcript=call_log.raw_transcript,
                    questions_and_expected=questions
                )

                eval_record = CallEvaluation(
                    call_log_id=call_log.id,
                    candidate_intelligence_score=evaluation_data.get("score", 75.0),
                    technical_score=evaluation_data.get("technical_fit", 7.5),
                    communication_score=evaluation_data.get("communication_fit", 7.5),
                    ai_generated_summary=evaluation_data.get("justification", "Evaluated call transcript.")
                )
                db.add(eval_record)
                db.commit()

    return {"status": "ok"}
