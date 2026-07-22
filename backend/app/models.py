import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="hr")  # admin, hr
    full_name = Column(String(255), nullable=True)
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class JobRole(Base):
    __tablename__ = "job_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    skills_required = Column(JSON, nullable=True)
    experience_min = Column(Integer, nullable=True)
    experience_max = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    question_sets = relationship("QuestionSet", back_populates="job_role")
    campaigns = relationship("Campaign", back_populates="job_role")


class QuestionSet(Base):
    __tablename__ = "question_sets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    role_id = Column(String(36), ForeignKey("job_roles.id", ondelete="SET NULL"), nullable=True)
    questions = Column(JSON, nullable=False)  # [{text, category, type}]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_role = relationship("JobRole", back_populates="question_sets")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=False)
    job_role_id = Column(String(36), ForeignKey("job_roles.id", ondelete="SET NULL"), nullable=True)
    department = Column(String(100), nullable=True)
    hiring_manager = Column(String(255), nullable=True)
    hiring_location = Column(String(255), nullable=True)
    experience_required = Column(String(50), nullable=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    calling_window_start = Column(String(5), nullable=False, default="09:00")
    calling_window_end = Column(String(5), nullable=False, default="18:00")
    max_retries = Column(Integer, nullable=False, default=3)
    retry_delay_minutes = Column(Integer, nullable=False, default=120)
    question_set = Column(JSON, nullable=False)
    accent = Column(String(50), nullable=False, default="en-US")
    voice_speed = Column(String(10), nullable=False, default="1.0")
    parallel_calls = Column(Integer, nullable=False, default=5)
    status = Column(String(50), nullable=False, default="draft")  # draft, active, completed, paused
    created_at = Column(DateTime, default=datetime.utcnow)

    job_role = relationship("JobRole", back_populates="campaigns")
    candidates = relationship("Candidate", back_populates="campaign", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=False)
    city = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    current_company = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    whatsapp_status = Column(String(50), nullable=True, default="not_sent")
    call_attempts = Column(Integer, nullable=False, default=0)
    next_allowed_call = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="candidates")
    call_logs = relationship("CallLog", back_populates="candidate", cascade="all, delete-orphan")


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    candidate_id = Column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    twilio_call_sid = Column(String(100), nullable=True, unique=True)
    status = Column(String(50), nullable=False, default="queued")
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    raw_transcript = Column(Text, nullable=True)
    recording_url = Column(Text, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="call_logs")
    evaluation = relationship("CallEvaluation", back_populates="call_log", uselist=False, cascade="all, delete-orphan")


class CallEvaluation(Base):
    __tablename__ = "call_evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    call_log_id = Column(String(36), ForeignKey("call_logs.id", ondelete="CASCADE"), nullable=False)
    jd_fit_score = Column(Float, nullable=False, default=0.0)
    technical_score = Column(Float, nullable=False, default=0.0)
    confidence_score = Column(Float, nullable=False, default=0.0)
    fluency_score = Column(Float, nullable=False, default=0.0)
    grammar_score = Column(Float, nullable=False, default=0.0)
    vocabulary_score = Column(Float, nullable=False, default=0.0)
    communication_score = Column(Float, nullable=False, default=0.0)
    extracted_salary_expectation = Column(String(255), nullable=True)
    extracted_notice_period = Column(String(255), nullable=True)
    extracted_years_of_experience = Column(Integer, nullable=True)
    candidate_intelligence_score = Column(Float, nullable=False, default=0.0)
    recommendation = Column(String(50), nullable=True)  # strongly_recommended, recommended, average, not_recommended
    ai_generated_summary = Column(Text, nullable=True)
    feedback_details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    call_log = relationship("CallLog", back_populates="evaluation")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
