import json
import time
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import CallLog, Candidate, Campaign, CallEvaluation
from app.services.llm_service import llm_service

@celery_app.task(name="app.tasks.run_outbound_dialer_queue")
def run_outbound_dialer_queue():
    """
    Periodic task: Check scheduled candidates and queue Twilio outbound calls.
    We will fully implement the polling dialer logic in Phase 8.
    """
    print("[Dialer Worker] Polling candidates queue for outbound calling window...")
    # Celery dialer worker execution loop
    from app.services.twilio_service import twilio_service
    db = SessionLocal()
    try:
        # Resolve pending calls according to rules
        candidates = db.query(Candidate).filter(
            Candidate.status == "scheduled"
        ).all()
        for cand in candidates:
            # We trigger the call
            print(f"[Dialer Worker] Triggering outbound call task for candidate: {cand.first_name} ({cand.phone_number})")
            # Set state to calling to prevent double-dialing
            cand.status = "calling"
            db.commit()
            
            try:
                twilio_service.make_outbound_call(
                    to_phone=cand.phone_number,
                    candidate_id=cand.id,
                    campaign_id=cand.campaign_id
                )
            except Exception as e:
                print(f"[Dialer Worker Error] Outbound call trigger failed for {cand.id}: {e}")
                cand.status = "scheduled"
                db.commit()
    finally:
        db.close()
    return "Polled"

@celery_app.task(name="app.tasks.process_post_call_analysis")
def process_post_call_analysis(call_log_id: str):
    """
    Task to execute asynchronous multi-dimensional AI scoring after a call ends.
    """
    print(f"[Analysis Worker] Commencing post-call AI analysis for call log {call_log_id}...")
    db = SessionLocal()
    try:
        # Load CallLog
        call_log = db.query(CallLog).filter(CallLog.id == call_log_id).first()
        if not call_log or not call_log.raw_transcript:
            print(f"[Analysis Worker Error] Call log {call_log_id} not found or has no transcript.")
            return f"Failed: No transcript for {call_log_id}"

        # Load Campaign & Candidate
        candidate = db.query(Candidate).filter(Candidate.id == call_log.candidate_id).first()
        if not candidate:
            print(f"[Analysis Worker Error] Candidate not found for call log {call_log_id}")
            return f"Failed: No candidate for {call_log_id}"

        campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
        if not campaign:
            print(f"[Analysis Worker Error] Campaign not found for candidate {candidate.id}")
            return f"Failed: No campaign for {call_log_id}"

        # Reconstruct dialog transcript history from dialogue JSON state
        try:
            state_data = json.loads(call_log.raw_transcript)
            transcript_list = state_data.get("transcript", [])
            
            formatted_lines = []
            for entry in transcript_list:
                role = "AI Recruiter" if entry["role"] == "assistant" else "Candidate"
                formatted_lines.append(f"{role}: {entry['text']}")
            
            compiled_transcript = "\n".join(formatted_lines)
            # Save compiled human-readable text back to CallLog
            call_log.raw_transcript = compiled_transcript
        except Exception as err:
            print(f"[Analysis Worker Warning] Reconstructing transcript failed: {err}")
            compiled_transcript = call_log.raw_transcript # Fallback to whatever is inside

        # Call the LLM Evaluation pipeline
        eval_result = llm_service.evaluate_call_transcript(
            transcript_txt=compiled_transcript,
            job_description=campaign.job_description
        )

        # Create or update evaluation record
        evaluation = db.query(CallEvaluation).filter(CallEvaluation.call_log_id == call_log_id).first()
        if not evaluation:
            evaluation = CallEvaluation(call_log_id=call_log_id)
            db.add(evaluation)

        # Map results columns
        evaluation.jd_fit_score = eval_result.get("jd_fit_score", 0.0)
        evaluation.technical_score = eval_result.get("technical_score", 0.0)
        evaluation.confidence_score = eval_result.get("confidence_score", 0.0)
        evaluation.fluency_score = eval_result.get("fluency_score", 0.0)
        evaluation.grammar_score = eval_result.get("grammar_score", 0.0)
        evaluation.vocabulary_score = eval_result.get("vocabulary_score", 0.0)
        evaluation.extracted_salary_expectation = eval_result.get("extracted_salary_expectation")
        evaluation.extracted_notice_period = eval_result.get("extracted_notice_period")
        evaluation.extracted_years_of_experience = eval_result.get("extracted_years_of_experience")
        evaluation.candidate_intelligence_score = eval_result.get("candidate_intelligence_score", 0.0)
        evaluation.ai_generated_summary = eval_result.get("ai_generated_summary")

        # Map recommendation based on flowchart threshold
        cis = evaluation.candidate_intelligence_score
        if cis >= 80:
            evaluation.recommendation = "strongly_recommended"
        elif cis >= 65:
            evaluation.recommendation = "recommended"
        elif cis >= 50:
            evaluation.recommendation = "average"
        else:
            evaluation.recommendation = "not_recommended"

        # Pack custom feedback parameters into details JSON
        feedback = eval_result.get("feedback_details") or {}
        if not isinstance(feedback, dict):
            feedback = {"details": str(feedback)}
        
        feedback["salary_within_range"] = eval_result.get("salary_within_range", False)
        feedback["willing_to_relocate"] = eval_result.get("willing_to_relocate", False)
        evaluation.feedback_details = feedback


        print(f"[Analysis Worker] Saved evaluation score (CIS: {evaluation.candidate_intelligence_score}) for {candidate.first_name}")
        db.commit()

    except Exception as e:
        print(f"[Analysis Worker Error] Error running pipeline: {str(e)}")
        db.rollback()
    finally:
        db.close()

    return f"Evaluation completed for call log {call_log_id}"
