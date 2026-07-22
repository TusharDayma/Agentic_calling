from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.database import get_db
from app.models import User, JobRole, QuestionSet, AuditLog, Campaign, Candidate, CallEvaluation, CallLog
from app.auth import get_password_hash, require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---- HR USER MANAGEMENT ----

class HRUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: Optional[str] = None
    role: str = "hr"

class HRUserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class HRUserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    department: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


@router.get("/users", response_model=List[HRUserResponse])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    return db.query(User).all()


@router.post("/users", response_model=HRUserResponse, status_code=201)
def create_user(req: HRUserCreate, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        department=req.department,
        role=req.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=HRUserResponse)
def update_user(user_id: str, req: HRUserUpdate, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.department is not None:
        user.department = req.department
    if req.is_active is not None:
        user.is_active = req.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


# ---- JOB ROLES ----

class JobRoleCreate(BaseModel):
    title: str
    department: Optional[str] = None
    description: Optional[str] = None
    skills_required: Optional[List[str]] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None

class JobRoleResponse(BaseModel):
    id: str
    title: str
    department: Optional[str]
    description: Optional[str]
    skills_required: Optional[List[str]]
    experience_min: Optional[int]
    experience_max: Optional[int]
    is_active: bool
    class Config:
        from_attributes = True


@router.get("/job-roles", response_model=List[JobRoleResponse])
def list_job_roles(db: Session = Depends(get_db)):
    return db.query(JobRole).filter(JobRole.is_active == True).all()


@router.post("/job-roles", response_model=JobRoleResponse, status_code=201)
def create_job_role(req: JobRoleCreate, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    jr = JobRole(**req.dict())
    db.add(jr)
    db.commit()
    db.refresh(jr)
    return jr


@router.delete("/job-roles/{role_id}")
def delete_job_role(role_id: str, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    jr = db.query(JobRole).filter(JobRole.id == role_id).first()
    if not jr:
        raise HTTPException(status_code=404, detail="Job role not found")
    jr.is_active = False
    db.commit()
    return {"status": "deactivated"}


# ---- QUESTION SETS ----

class QuestionSetCreate(BaseModel):
    name: str
    role_id: Optional[str] = None
    questions: List[dict]

class QuestionSetResponse(BaseModel):
    id: str
    name: str
    role_id: Optional[str]
    questions: List[dict]
    is_active: bool
    class Config:
        from_attributes = True


@router.get("/question-sets", response_model=List[QuestionSetResponse])
def list_question_sets(db: Session = Depends(get_db)):
    return db.query(QuestionSet).filter(QuestionSet.is_active == True).all()


@router.post("/question-sets", response_model=QuestionSetResponse, status_code=201)
def create_question_set(req: QuestionSetCreate, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    qs = QuestionSet(**req.dict())
    db.add(qs)
    db.commit()
    db.refresh(qs)
    return qs


# ---- AUDIT LOGS ----

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    resource: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(limit: int = 50, db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()


# ---- SYSTEM STATS ----

@router.get("/system-stats")
def get_system_stats(db: Session = Depends(get_db), current_user=Depends(require_role(["admin"]))):
    total_users = db.query(User).count()
    total_hr = db.query(User).filter(User.role == "hr").count()
    total_campaigns = db.query(Campaign).count()
    active_campaigns = db.query(Campaign).filter(Campaign.status == "active").count()
    total_candidates = db.query(Candidate).count()
    completed_calls = db.query(Candidate).filter(Candidate.status == "completed").count()
    call_success_rate = round((completed_calls / total_candidates * 100), 1) if total_candidates > 0 else 0

    evaluations = db.query(CallEvaluation.candidate_intelligence_score).all()
    avg_score = 0.0
    if evaluations:
        scores = [e[0] for e in evaluations if e[0] is not None]
        if scores:
            avg_score = round(sum(scores) / len(scores), 1)

    top_campaign = db.query(Campaign).filter(Campaign.status == "completed").first()

    return {
        "total_users": total_users,
        "total_hr_users": total_hr,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_candidates": total_candidates,
        "completed_calls": completed_calls,
        "call_success_rate": call_success_rate,
        "avg_intelligence_score": avg_score,
        "top_campaign": top_campaign.title if top_campaign else None,
    }


# ---- AI CONFIG (mock) ----

_ai_config = {
    "default_accent": "en-IN",
    "max_parallel_calls": 10,
    "default_retry_count": 3,
    "default_retry_interval_hours": 2,
    "call_window_start": "09:00",
    "call_window_end": "18:00",
    "speech_timeout": 5,
    "interdigit_timeout": 3,
    "gather_timeout": 10,
}

@router.get("/ai-config")
def get_ai_config(current_user=Depends(require_role(["admin"]))):
    return _ai_config

@router.put("/ai-config")
def update_ai_config(config: dict, current_user=Depends(require_role(["admin"]))):
    _ai_config.update(config)
    return _ai_config
