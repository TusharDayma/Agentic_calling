from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Campaign, Candidate
from app.schemas import CampaignCreate, CampaignResponse
import datetime

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(campaign_in: CampaignCreate, db: Session = Depends(get_db)):
    title = campaign_in.title
    
    # If title exists, make it unique by appending a short timestamp rather than throwing a crash
    existing = db.query(Campaign).filter(Campaign.title == title).first()
    if existing:
        time_str = datetime.datetime.now().strftime("%M%S")
        title = f"{title} ({time_str})"

    # Convert question_set list of dicts to json-compatible object
    questions_json = [q if isinstance(q, dict) else q.dict() for q in campaign_in.question_set]

    # Initialize Campaign DB instance
    db_campaign = Campaign(
        title=title,
        job_description=campaign_in.job_description or f"Pre-screening for {title}",
        calling_window_start=campaign_in.calling_window_start or "09:00",
        calling_window_end=campaign_in.calling_window_end or "18:00",
        max_retries=campaign_in.max_retries or 3,
        retry_delay_minutes=campaign_in.retry_delay_minutes or 120,
        question_set=questions_json,
        accent=campaign_in.accent or "en-US",
        voice_speed=campaign_in.voice_speed or "1.0",
        status="draft"
    )

    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@router.get("/", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).all()

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    return campaign

@router.post("/{campaign_id}/start", response_model=CampaignResponse)
def start_campaign(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    
    if campaign.status == "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campaign already active")

    # Mark campaign status active and schedule calls
    campaign.status = "active"
    
    # Set pending candidates to scheduled
    db.query(Candidate).filter(
        Candidate.campaign_id == campaign_id,
        Candidate.status == "pending"
    ).update({"status": "scheduled"})

    db.commit()
    db.refresh(campaign)
    return campaign
