from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os

from app.database import get_db
from app.models import Candidate, Campaign, CallLog, CallEvaluation
from app.services.twilio_service import twilio_service

router = APIRouter()

templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
templates = Jinja2Templates(directory=templates_dir)


class QuestionItem(BaseModel):
    question_text: str
    expected_answer: str


class StartInterviewRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = "candidate@example.com"
    role_title: str
    questions: List[QuestionItem]


@router.get("/dashboard", response_class=HTMLResponse)
def render_admin_dashboard(request: Request):
    """Renders the V1 Admin Dashboard HTML page."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@router.get("/api/dashboard/candidates")
def list_dashboard_candidates(db: Session = Depends(get_db)):
    """Returns candidate list with their rankings, scores out of 100, and justifications."""
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    results = []

    for cand in candidates:
        campaign = db.query(Campaign).filter(Campaign.id == cand.campaign_id).first()

        # Find latest evaluation
        call_log = db.query(CallLog).filter(CallLog.candidate_id == cand.id).order_by(CallLog.created_at.desc()).first()
        evaluation = db.query(CallEvaluation).filter(CallEvaluation.call_log_id == call_log.id).first() if call_log else None

        score = evaluation.candidate_intelligence_score if evaluation else None
        justification = evaluation.ai_generated_summary if evaluation else "Pending evaluation"
        transcript = call_log.raw_transcript if call_log else ""

        results.append({
            "id": cand.id,
            "name": f"{cand.first_name} {cand.last_name}".strip(),
            "phone": cand.phone_number,
            "role": campaign.title if campaign else "N/A",
            "status": cand.status,
            "whatsapp_status": cand.whatsapp_status,
            "score": round(score, 1) if score is not None else "N/A",
            "justification": justification,
            "transcript": transcript,
            "created_at": cand.created_at.strftime("%Y-%m-%d %H:%M") if cand.created_at else ""
        })

    return {"candidates": results}


@router.post("/api/dashboard/start-interview")
def start_interview_process(payload: StartInterviewRequest, db: Session = Depends(get_db)):
    """
    Step 1: Admin inputs Candidate details & Custom Questions with Expected Answers.
    Creates Campaign and Candidate, then triggers WhatsApp outreach via Twilio.
    """
    if not payload.name or not payload.phone or not payload.role_title:
        raise HTTPException(status_code=400, detail="Name, Phone Number, and Job Role are required.")

    if not payload.questions:
        raise HTTPException(status_code=400, detail="At least one interview question with an expected answer is required.")

    # Split full name
    name_parts = payload.name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Form Question Set JSON
    formatted_questions = [
        {"id": f"q{idx+1}", "question_text": q.question_text, "expected_answer": q.expected_answer}
        for idx, q in enumerate(payload.questions)
    ]

    # Create Campaign
    campaign = Campaign(
        title=payload.role_title,
        job_description=f"Pre-screening interview campaign for {payload.role_title}",
        question_set=formatted_questions,
        status="active"
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Create Candidate
    candidate = Candidate(
        campaign_id=campaign.id,
        first_name=first_name,
        last_name=last_name,
        email=payload.email,
        phone_number=payload.phone.strip(),
        status="pending",
        whatsapp_status="not_sent"
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # Trigger WhatsApp Outreach via Twilio
    outreach_success = twilio_service.send_whatsapp_outreach(
        candidate_id=candidate.id,
        candidate_name=candidate.first_name,
        phone=candidate.phone_number,
        role_title=payload.role_title
    )

    if outreach_success:
        candidate.whatsapp_status = "sent"
        candidate.status = "whatsapp_sent"
    else:
        candidate.whatsapp_status = "failed"

    db.commit()

    return {
        "success": True,
        "candidate_id": candidate.id,
        "campaign_id": campaign.id,
        "whatsapp_sent": outreach_success,
        "message": f"Candidate '{candidate.first_name}' added. WhatsApp outreach initiated."
    }
