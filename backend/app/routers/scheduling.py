import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Candidate, Campaign, CallLog
from app.services.twilio_service import twilio_service

router = APIRouter()

templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)
logger = logging.getLogger(__name__)


@router.get("/schedule/{candidate_id}", response_class=HTMLResponse)
def render_candidate_schedule_page(candidate_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Step 3: Renders candidate self-service scheduling webpage.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate link not found or expired.")

    campaign = db.query(Campaign).filter(Campaign.id == candidate.campaign_id).first()
    role_title = campaign.title if campaign else "Technical Interview"

    context = {
        "request": request,
        "candidate_id": candidate.id,
        "candidate_name": f"{candidate.first_name} {candidate.last_name}".strip(),
        "role_title": role_title,
        "phone_number": candidate.phone_number,
        "status": candidate.status
    }
    return templates.TemplateResponse("schedule.html", context)


@router.post("/api/schedule/{candidate_id}/call-now")
def trigger_immediate_call(candidate_id: str, db: Session = Depends(get_db)):
    """
    Step 3 Action: Candidate clicks 'Call Me Now'. Initiates Twilio outbound voice call.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate record not found.")

    # Initiate Twilio outbound voice call
    try:
        call_sid = twilio_service.trigger_outbound_voice_call(
            candidate_id=candidate.id,
            phone=candidate.phone_number
        )

        # Create CallLog record
        call_log = CallLog(
            candidate_id=candidate.id,
            twilio_call_sid=call_sid,
            status="queued",
            raw_transcript=""
        )
        db.add(call_log)

        candidate.status = "scheduled"
        candidate.call_attempts += 1
        db.commit()

        return {
            "success": True,
            "call_sid": call_sid,
            "message": "Outbound call initiated! Expect a call on your phone shortly."
        }
    except Exception as e:
        logger.error(f"Failed to initiate call: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate outbound call: {str(e)}")
