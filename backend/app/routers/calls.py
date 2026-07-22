import datetime
from fastapi import APIRouter, Depends, HTTPException, Form, Response, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Candidate, Campaign, CallLog
from app.tasks import process_post_call_analysis

# We will import the Dialogue manager from voice_agent module
# For now, we will create a placeholder connection; we implement dialogue state machine next!
from app.voice_agent.graph import dialogue_manager

router = APIRouter(prefix="/calls", tags=["Twilio Webhooks"])

@router.post("/voice")
def initial_voice_handler(
    candidate_id: str,
    campaign_id: str,
    CallSid: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Initial landing webhook when Twilio handles our outbound call.
    Greets the candidate and sets up Recording Consent.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not candidate or not campaign:
        # Fallback TwiML
        xml_fallback = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            "<Say>We apologize, but this campaign is no longer active. Goodbye.</Say>"
            "<Hangup/>"
            "</Response>"
        )
        return Response(content=xml_fallback, media_type="application/xml")

    # Open/Create a CallLog
    call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == CallSid).first()
    if not call_log:
        call_log = CallLog(
            candidate_id=candidate_id,
            twilio_call_sid=CallSid,
            status="in-progress",
            start_time=datetime.datetime.utcnow()
        )
        db.add(call_log)
        candidate.status = "calling"
        db.commit()

    # Begin LangGraph session dialogue
    twiml_response = dialogue_manager.start_dialogue(candidate_id, campaign_id, CallSid, db)
    return Response(content=twiml_response, media_type="application/xml")

@router.post("/respond")
def dialogue_response_handler(
    candidate_id: str,
    CallSid: str = Form(...),
    SpeechResult: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Main webhook receiver for Twilio <Gather> speech inputs.
    Feeds speech transcript into LangGraph dialogue manager and returns next TwiML.
    """
    # If transcript is empty or silent, handle silence
    candidate_speech = SpeechResult or ""
    
    # Process speech using Dialog Manager (LangGraph pipeline)
    twiml_response = dialogue_manager.process_step(candidate_id, CallSid, candidate_speech, db)
    return Response(content=twiml_response, media_type="application/xml")

@router.post("/twilio-callback")
def twilio_callback_handler(
    candidate_id: str,
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Tracks state machine callbacks from Twilio.
    Manages retry increments for failed calls or launches post-call evaluation.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        return {"status": "ignored_no_candidate"}

    call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == CallSid).first()
    if not call_log:
        call_log = CallLog(
            candidate_id=candidate_id,
            twilio_call_sid=CallSid,
            status=CallStatus,
            start_time=datetime.datetime.utcnow()
        )
        db.add(call_log)
    else:
        call_log.status = CallStatus

    # Check Twilio call final states
    if CallStatus in ["busy", "no-answer", "failed"]:
        candidate.call_attempts += 1
        campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
        max_ret = campaign.max_retries if campaign else 3
        delay_min = campaign.retry_delay_minutes if campaign else 120

        if candidate.call_attempts >= max_ret:
            candidate.status = "failed"
            call_log.failure_reason = f"Exceeded max retries in state {CallStatus}"
        else:
            candidate.status = "scheduled" # queue for retries
            # Set allowed call window
            candidate.next_allowed_call = datetime.datetime.utcnow() + datetime.timedelta(minutes=delay_min)
            call_log.failure_reason = f"Temporary failure: {CallStatus}. Retry scheduled."
            
        call_log.end_time = datetime.datetime.utcnow()

    elif CallStatus in ["completed"]:
        call_log.end_time = datetime.datetime.utcnow()
        # If candidate completed dialog successfully, mark as completed
        # Note: LangGraph state will specify if user refused consent or became completed,
        # but if we get completed call status from Twilio, we dispatch background post-call scoring.
        if candidate.status == "calling": 
            # If candidate was in calling state and Twilio completes call, mark completed
            candidate.status = "completed"
            
        db.commit() # Commit to DB before sending to Celery async
        
        # Trigger Celery asynchronous post-call intelligence evaluator
        process_post_call_analysis.delay(call_log.id)

    db.commit()
    return {"status": "processed", "call_log_id": call_log.id}
