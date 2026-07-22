from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- CAMPAIGN SCHEMAS ---

class QuestionItem(BaseModel):
    id: Optional[str] = "q1"
    question_text: Optional[str] = ""
    question_type: Optional[str] = "long_answer"
    expected_answer: Optional[str] = ""
    category: Optional[str] = "General"
    text: Optional[str] = None
    type: Optional[str] = None

class CampaignBase(BaseModel):
    title: str
    job_description: Optional[str] = ""
    calling_window_start: Optional[str] = "09:00"
    calling_window_end: Optional[str] = "18:00"
    max_retries: Optional[int] = 3
    retry_delay_minutes: Optional[int] = 120
    question_set: List[Dict[str, Any]] = []
    accent: Optional[str] = "en-US"
    voice_speed: Optional[str] = "1.0"
    department: Optional[str] = None
    hiring_manager: Optional[str] = None
    hiring_location: Optional[str] = None
    experience_required: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignResponse(CampaignBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- CANDIDATE SCHEMAS ---

class CandidateBase(BaseModel):
    first_name: str
    last_name: Optional[str] = ""
    email: Optional[str] = ""
    phone_number: str
    city: Optional[str] = None
    experience_years: Optional[str] = None
    current_company: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateResponse(CandidateBase):
    id: str
    campaign_id: str
    status: str
    call_attempts: Optional[int] = 0
    next_allowed_call: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- CALL LOG SCHEMAS ---

class CallLogResponse(BaseModel):
    id: str
    candidate_id: str
    twilio_call_sid: Optional[str] = None
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    raw_transcript: Optional[str] = None
    recording_url: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- CALL EVALUATION SCHEMAS ---

class CallEvaluationResponse(BaseModel):
    id: str
    call_log_id: str
    jd_fit_score: float
    technical_score: float
    confidence_score: float
    fluency_score: float
    grammar_score: float
    vocabulary_score: float
    extracted_salary_expectation: Optional[str] = None
    extracted_notice_period: Optional[str] = None
    extracted_years_of_experience: Optional[int] = None
    candidate_intelligence_score: float
    ai_generated_summary: Optional[str] = None
    feedback_details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
