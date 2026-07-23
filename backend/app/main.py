import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from app.config import settings
from app.database import engine, Base, get_db
from app.models import Campaign, Candidate, CallLog, CallEvaluation, User, JobRole, QuestionSet, AuditLog, UserRole
from app.routers import campaigns, candidates, calls, auth_routes

# Create all tables
Base.metadata.create_all(bind=engine)


def seed_default_accounts():
    """Seed demo users and rich mock data for presentation."""
    from app.database import SessionLocal
    from app.auth import get_password_hash
    import uuid
    import random
    from datetime import timedelta

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[DB SEED] Seeding default accounts and demo data...")

            # --- USERS ---
            admin = User(
                username="admin@company.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.ADMIN,
                full_name="Alex Morgan",
                department="Administration",
                is_active=True
            )
            hr1 = User(
                username="hr@company.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.HR,
                full_name="Sarah Johnson",
                department="Human Resources",
                is_active=True
            )
            hr2 = User(
                username="hr2@company.com",
                hashed_password=get_password_hash("password123"),
                role=UserRole.HR,
                full_name="Raj Patel",
                department="Engineering Recruitment",
                is_active=True
            )
            db.add_all([admin, hr1, hr2])
            db.flush()

            # --- JOB ROLES ---
            roles_data = [
                {"title": "Senior Software Engineer", "department": "Engineering", "skills_required": ["Python", "React", "AWS", "SQL"], "experience_min": 4, "experience_max": 8},
                {"title": "Data Scientist", "department": "Analytics", "skills_required": ["Python", "ML", "TensorFlow", "Statistics"], "experience_min": 2, "experience_max": 6},
                {"title": "Product Manager", "department": "Product", "skills_required": ["Agile", "Roadmap", "Stakeholder Management", "Analytics"], "experience_min": 3, "experience_max": 7},
                {"title": "DevOps Engineer", "department": "Engineering", "skills_required": ["Docker", "Kubernetes", "CI/CD", "AWS"], "experience_min": 3, "experience_max": 6},
                {"title": "UI/UX Designer", "department": "Design", "skills_required": ["Figma", "User Research", "Prototyping", "CSS"], "experience_min": 2, "experience_max": 5},
            ]
            job_roles = []
            for rd in roles_data:
                jr = JobRole(title=rd["title"], department=rd["department"],
                             skills_required=rd["skills_required"],
                             experience_min=rd["experience_min"],
                             experience_max=rd["experience_max"])
                db.add(jr)
                job_roles.append(jr)
            db.flush()

            # --- QUESTION SETS ---
            base_questions = [
                {"text": "Can you briefly introduce yourself and walk me through your professional background?", "category": "Introduction", "type": "long_answer"},
                {"text": "Why are you interested in this role and our company?", "category": "Behavioral", "type": "long_answer"},
                {"text": "What is your current notice period?", "category": "Logistics", "type": "short_answer"},
                {"text": "What are your salary expectations?", "category": "Logistics", "type": "short_answer"},
                {"text": "Are you open to relocation if required?", "category": "Logistics", "type": "yes_no"},
                {"text": "Can you describe a challenging project you worked on and how you handled it?", "category": "Behavioral", "type": "long_answer"},
                {"text": "What are your strongest technical skills?", "category": "Technical", "type": "long_answer"},
                {"text": "Do you have experience working in Agile teams?", "category": "Technical", "type": "yes_no"},
            ]

            qs1 = QuestionSet(name="Software Engineer Pre-Screening", role_id=job_roles[0].id, questions=base_questions)
            qs2 = QuestionSet(name="Data Science Screening", role_id=job_roles[1].id, questions=[
                *base_questions[:5],
                {"text": "Describe your experience with machine learning frameworks.", "category": "Technical", "type": "long_answer"},
                {"text": "Have you worked with large datasets (>1M rows)?", "category": "Technical", "type": "yes_no"},
            ])
            db.add_all([qs1, qs2])
            db.flush()

            # --- CAMPAIGNS with CANDIDATES and EVALUATIONS ---
            campaigns_data = [
                {
                    "title": "Senior SWE Batch - July 2026",
                    "status": "completed",
                    "total": 120,
                    "job_role": job_roles[0],
                    "department": "Engineering",
                },
                {
                    "title": "Data Science Hiring Drive Q2",
                    "status": "active",
                    "total": 85,
                    "job_role": job_roles[1],
                    "department": "Analytics",
                },
                {
                    "title": "Product Manager Expansion 2026",
                    "status": "active",
                    "total": 60,
                    "job_role": job_roles[2],
                    "department": "Product",
                },
                {
                    "title": "DevOps Cloud Hire - Bangalore",
                    "status": "draft",
                    "total": 40,
                    "job_role": job_roles[3],
                    "department": "Engineering",
                },
            ]

            first_names = ["Aarav", "Priya", "Rahul", "Swati", "Vikram", "Neha", "Arjun", "Deepika", "Karan", "Ananya",
                           "Rohan", "Shreya", "Aditya", "Kavya", "Siddharth", "Riya", "Nikhil", "Pooja", "Amit", "Divya",
                           "James", "Emily", "Michael", "Sarah", "David", "Jessica", "Chris", "Ashley", "Matthew", "Amanda",
                           "Daniel", "Jennifer", "John", "Lisa", "Robert", "Mary", "William", "Nancy", "Richard", "Karen"]
            last_names = ["Sharma", "Patel", "Singh", "Kumar", "Mehta", "Gupta", "Reddy", "Nair", "Joshi", "Verma",
                          "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor"]
            cities = ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Noida", "Gurugram"]
            companies = ["Infosys", "TCS", "Wipro", "HCL", "Accenture", "Cognizant", "Tech Mahindra", "Capgemini", "IBM", "Microsoft"]

            recommendations = ["strongly_recommended", "recommended", "average", "not_recommended"]

            transcripts = [
                "AI: Hello! This is Talent.AI calling on behalf of the recruitment team. Is this a good time to speak for a 10-minute pre-screening interview?\nCandidate: Yes, sure!\nAI: Great! Could you please confirm your consent to record this call for quality purposes?\nCandidate: Yes, I consent.\nAI: Wonderful! Could you briefly introduce yourself?\nCandidate: I have 6 years of experience in backend development, primarily using Python and Django. I've worked at TCS and recently joined a startup.\nAI: Excellent! What is your current notice period?\nCandidate: It's 30 days.\nAI: And what are your salary expectations?\nCandidate: I'm looking for around 18 to 22 LPA.\nAI: Thank you! Can you describe a challenging project you've recently worked on?\nCandidate: We built a real-time data pipeline handling 5 million events per day using Kafka and Spark. It was challenging but rewarding.\nAI: Impressive! Thank you for your time. We will get back to you shortly. Have a great day!",

                "AI: Hello! This is Talent.AI calling for a short pre-screening. Is this a good time?\nCandidate: Yes, go ahead.\nAI: Do you consent to recording this call?\nCandidate: Yes.\nAI: Great! Tell me about yourself.\nCandidate: I'm a data scientist with 4 years of experience in ML and NLP. I've worked on recommendation systems and fraud detection models.\nAI: What are your salary expectations?\nCandidate: Around 15 to 18 LPA.\nAI: What is your notice period?\nCandidate: 60 days but it's negotiable.\nAI: Are you open to relocation?\nCandidate: Yes, absolutely.\nAI: Thank you so much! We'll be in touch soon."
            ]

            ai_summaries = [
                "Strong candidate with extensive backend development experience. Demonstrated clear technical depth with large-scale data pipeline work. Confident communicator. Salary expectations within budget. Recommended for technical round.",
                "Data science professional with solid ML background. Good communication skills and reasonable expectations. Notice period slightly long but negotiable. Suitable for further evaluation.",
                "Candidate showed enthusiasm but struggled to articulate technical details clearly. Limited experience with required tech stack. Consider for junior roles.",
                "Excellent communicator with strong resume-JD fit. Well-versed in Agile practices and modern cloud tooling. Strongly recommend for next round."
            ]

            for camp_data in campaigns_data:
                campaign = Campaign(
                    title=camp_data["title"],
                    job_description=f"We are looking for a talented {camp_data['job_role'].title} to join our {camp_data['department']} team. The ideal candidate should have strong technical skills, excellent communication, and the ability to work in a fast-paced environment.",
                    job_role_id=camp_data["job_role"].id,
                    department=camp_data["department"],
                    hiring_manager="Alex Morgan",
                    hiring_location="Bangalore, India",
                    experience_required="3-7 years",
                    calling_window_start="09:00",
                    calling_window_end="18:00",
                    max_retries=3,
                    retry_delay_minutes=120,
                    question_set=base_questions,
                    accent="en-IN",
                    voice_speed="1.0",
                    parallel_calls=10,
                    status=camp_data["status"],
                    created_by=hr1.id
                )
                db.add(campaign)
                db.flush()

                # Add candidates to campaign
                statuses = ["completed", "completed", "completed", "failed", "pending"] if camp_data["status"] != "draft" else ["pending"]
                for i in range(camp_data["total"]):
                    fn = random.choice(first_names)
                    ln = random.choice(last_names)
                    city = random.choice(cities)
                    company = random.choice(companies)
                    exp = random.randint(2, 10)
                    cand_status = random.choice(statuses)

                    candidate = Candidate(
                        campaign_id=campaign.id,
                        first_name=fn,
                        last_name=ln,
                        email=f"{fn.lower()}.{ln.lower()}{i}@email.com",
                        phone_number=f"+9198765{random.randint(10000, 99999)}",
                        city=city,
                        experience_years=exp,
                        current_company=company,
                        status=cand_status,
                        call_attempts=1 if cand_status in ["completed", "failed"] else 0
                    )
                    db.add(candidate)
                    db.flush()

                    # Add call logs and evaluations for completed candidates
                    if cand_status == "completed":
                        call_start = datetime.utcnow() - timedelta(days=random.randint(1, 14), hours=random.randint(0, 8))
                        call_log = CallLog(
                            candidate_id=candidate.id,
                            twilio_call_sid=f"CA{uuid.uuid4().hex[:32]}",
                            status="completed",
                            start_time=call_start,
                            end_time=call_start + timedelta(minutes=random.randint(6, 15)),
                            raw_transcript=random.choice(transcripts),
                            recording_url=f"https://api.twilio.com/recordings/RE{uuid.uuid4().hex[:30]}",
                            duration_seconds=random.randint(360, 900)
                        )
                        db.add(call_log)
                        db.flush()

                        cis = round(random.uniform(45, 95), 1)
                        tech = round(random.uniform(40, 95), 1)
                        jd_fit = round(random.uniform(50, 95), 1)
                        conf = round(random.uniform(55, 95), 1)
                        fluency = round(random.uniform(60, 95), 1)
                        grammar = round(random.uniform(55, 95), 1)

                        if cis >= 80:
                            rec = "strongly_recommended"
                        elif cis >= 65:
                            rec = "recommended"
                        elif cis >= 50:
                            rec = "average"
                        else:
                            rec = "not_recommended"

                        evaluation = CallEvaluation(
                            call_log_id=call_log.id,
                            jd_fit_score=jd_fit,
                            technical_score=tech,
                            confidence_score=conf,
                            fluency_score=fluency,
                            grammar_score=grammar,
                            vocabulary_score=round(random.uniform(60, 90), 1),
                            communication_score=round((fluency + grammar + conf) / 3, 1),
                            extracted_salary_expectation=f"{random.randint(12, 30)} LPA",
                            extracted_notice_period=f"{random.choice([0, 15, 30, 60, 90])} days",
                            extracted_years_of_experience=exp,
                            candidate_intelligence_score=cis,
                            recommendation=rec,
                            ai_generated_summary=random.choice(ai_summaries),
                            feedback_details={
                                "strengths": random.sample(["Clear communication", "Technical depth", "Positive attitude", "Problem-solving skills", "Team player", "Leadership potential"], 2),
                                "weaknesses": random.sample(["Notice period too long", "Salary slightly high", "Limited cloud experience", "Needs more system design exposure"], 1),
                                "questions_answered": len(base_questions),
                                "consent_given": True
                            }
                        )
                        db.add(evaluation)

            # --- AUDIT LOGS ---
            audit_actions = [
                {"action": "user_login", "resource": "auth"},
                {"action": "campaign_created", "resource": "campaign"},
                {"action": "csv_uploaded", "resource": "candidate"},
                {"action": "campaign_started", "resource": "campaign"},
                {"action": "user_created", "resource": "user"},
            ]
            for i in range(20):
                al = AuditLog(
                    user_id=random.choice([admin.id, hr1.id, hr2.id]),
                    action=random.choice(audit_actions)["action"],
                    resource=random.choice(audit_actions)["resource"],
                    ip_address=f"192.168.1.{random.randint(1, 254)}",
                    created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))
                )
                db.add(al)

            db.commit()
            print("[DB SEED] Successfully seeded demo data.")
    except Exception as e:
        print(f"[DB SEED ERROR] {e}")
        db.rollback()
    finally:
        db.close()


seed_default_accounts()

app = FastAPI(
    title="TalentAI — AI Recruitment Platform",
    description="Enterprise AI Pre-Screening and Candidate Evaluation Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router, prefix="/api")
app.include_router(candidates.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(auth_routes.router, prefix="/api")

# V1 End-to-End Platform Routers
from app.routers import dashboard, webhooks, scheduling, media_stream
app.include_router(dashboard.router)
app.include_router(webhooks.router)
app.include_router(scheduling.router)
app.include_router(media_stream.router)

# Try to import optional routers
try:
    from app.routers import admin as admin_router
    app.include_router(admin_router.router, prefix="/api")
except ImportError:
    pass

try:
    from app.routers import analytics as analytics_router
    app.include_router(analytics_router.router, prefix="/api")
except ImportError:
    pass



@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/api/dashboard/live-queue")
def get_live_queue_metrics(db: Session = Depends(get_db)):
    active_campaigns = db.query(Campaign).filter(Campaign.status == "active").count()
    total_candidates = db.query(Candidate).count()
    completed_calls = db.query(Candidate).filter(Candidate.status == "completed").count()
    failed_calls = db.query(Candidate).filter(Candidate.status == "failed").count()
    pending_calls = db.query(Candidate).filter(Candidate.status.in_(["pending", "scheduled"])).count()

    evals = db.query(CallEvaluation.candidate_intelligence_score).all()
    avg_cis = 0.0
    if evals:
        scores = [e[0] for e in evals if e[0] is not None]
        if scores:
            avg_cis = round(sum(scores) / len(scores), 1)

    total_campaigns = db.query(Campaign).count()
    completed_campaigns = db.query(Campaign).filter(Campaign.status == "completed").count()

    return {
        "active_campaigns": active_campaigns,
        "total_campaigns": total_campaigns,
        "completed_campaigns": completed_campaigns,
        "total_candidates": total_candidates,
        "completed_calls": completed_calls,
        "failed_calls": failed_calls,
        "pending_calls": pending_calls,
        "avg_cis": avg_cis,
        "live_queue": []
    }


@app.get("/api/dashboard/evaluations")
def get_evaluations_list(limit: int = 100, db: Session = Depends(get_db)):
    results = db.query(
        Candidate.id,
        Candidate.first_name,
        Candidate.last_name,
        Candidate.email,
        Candidate.city,
        Candidate.experience_years,
        Candidate.current_company,
        Candidate.campaign_id,
        CallEvaluation.id,
        CallEvaluation.candidate_intelligence_score,
        CallEvaluation.technical_score,
        CallEvaluation.jd_fit_score,
        CallEvaluation.fluency_score,
        CallEvaluation.confidence_score,
        CallEvaluation.communication_score,
        CallEvaluation.recommendation,
        CallEvaluation.extracted_years_of_experience,
        CallEvaluation.extracted_notice_period,
        CallEvaluation.extracted_salary_expectation,
        Campaign.title,
        Candidate.status,
        Candidate.created_at
    ).outerjoin(
        CallLog, CallLog.candidate_id == Candidate.id
    ).outerjoin(
        CallEvaluation, CallEvaluation.call_log_id == CallLog.id
    ).join(
        Campaign, Campaign.id == Candidate.campaign_id
    ).order_by(Candidate.created_at.desc()).limit(limit).all()

    return [{
        "candidate_id": r[0],
        "first_name": r[1],
        "last_name": r[2],
        "email": r[3],
        "city": r[4],
        "experience_years": r[5],
        "current_company": r[6],
        "campaign_id": r[7],
        "evaluation_id": r[8],
        "candidate_intelligence_score": r[9] if r[9] is not None else 0.0,
        "technical_score": r[10] if r[10] is not None else 0.0,
        "jd_fit_score": r[11] if r[11] is not None else 0.0,
        "fluency_score": r[12] if r[12] is not None else 0.0,
        "confidence_score": r[13] if r[13] is not None else 0.0,
        "communication_score": r[14] if r[14] is not None else 0.0,
        "recommendation": r[15] if r[15] is not None else "average",
        "extracted_years_of_experience": r[16] if r[16] is not None else r[5],
        "extracted_notice_period": r[17] if r[17] is not None else "N/A",
        "extracted_salary_expectation": r[18] if r[18] is not None else "N/A",
        "campaign_title": r[19],
        "status": r[20],
        "created_at": r[21].isoformat() if r[21] else None
    } for r in results]



@app.get("/api/dashboard/candidate-detail/{evaluation_id}")
def get_candidate_evaluation_detail(evaluation_id: str, db: Session = Depends(get_db)):
    evaluation = db.query(CallEvaluation).filter(CallEvaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    call_log = db.query(CallLog).filter(CallLog.id == evaluation.call_log_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == call_log.candidate_id).first()

    return {
        "candidate": {
            "id": candidate.id,
            "first_name": candidate.first_name,
            "last_name": candidate.last_name,
            "email": candidate.email,
            "phone_number": candidate.phone_number,
            "city": candidate.city,
            "experience_years": candidate.experience_years,
            "current_company": candidate.current_company,
        },
        "call_log": {
            "status": call_log.status,
            "start_time": call_log.start_time.isoformat() if call_log.start_time else None,
            "end_time": call_log.end_time.isoformat() if call_log.end_time else None,
            "raw_transcript": call_log.raw_transcript,
            "recording_url": call_log.recording_url,
            "duration_seconds": call_log.duration_seconds,
        },
        "evaluation": {
            "candidate_intelligence_score": evaluation.candidate_intelligence_score,
            "jd_fit_score": evaluation.jd_fit_score,
            "technical_score": evaluation.technical_score,
            "confidence_score": evaluation.confidence_score,
            "fluency_score": evaluation.fluency_score,
            "grammar_score": evaluation.grammar_score,
            "vocabulary_score": evaluation.vocabulary_score,
            "communication_score": evaluation.communication_score,
            "recommendation": evaluation.recommendation,
            "ai_generated_summary": evaluation.ai_generated_summary,
            "feedback_details": evaluation.feedback_details,
            "extracted_salary_expectation": evaluation.extracted_salary_expectation,
            "extracted_notice_period": evaluation.extracted_notice_period,
            "extracted_years_of_experience": evaluation.extracted_years_of_experience,
        }
    }
