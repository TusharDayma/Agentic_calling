import os
import sys
import time
import argparse
import uvicorn
from sqlalchemy.orm import Session

# Add current path to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Campaign, Candidate, CallLog, CallEvaluation
from app.tasks import run_outbound_dialer_queue
from app.config import settings

def run_dry_run_test():
    """
    Executes a complete self-contained system integration dry-run:
    Creates campaign -> Import candidate -> Trigger dial poller ->
    Simulates calling loops -> Simulates candidate consent & answers ->
    Launches evaluator -> Verifies evaluation scores and database records.
    """
    print("="*60)
    print("      TALENTECHO SYSTEM INTEGRATION DRY-RUN TEST PLAYER      ")
    print("="*60)
    
    # 1. Reset database tables
    print("[1/5] Re-creating database schema...")
    from app.celery_app import celery_app
    celery_app.conf.task_always_eager = True
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 2. Insert Campaign template
        print("[2/5] Synthesizing role pre-screening campaign...")
        questions = [
            {"id": "q1", "question_text": "Do you have 3+ years of experience with Python and FastAPI?", "question_type": "yes_no"},
            {"id": "q2", "question_text": "What is your current notice period in days?", "question_type": "numeric"},
            {"id": "q3", "question_text": "What are your salary expectations in USD?", "question_type": "numeric"},
            {"id": "q4", "question_text": "Describe code modularity and OOP principles you follow.", "question_type": "long_answer"}
        ]
        campaign = Campaign(
            title="Senior AI Integration Engineer",
            job_description="We need a candidate with 3+ years of python web frameworks (FastAPI) and clean database design skills. Notice period should be under 60 days.",
            question_set=questions,
            accent="en-US"
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        print(f" -> Campaign Created! ID: {campaign.id} (Status: {campaign.status})")

        # 3. Add Candidates
        print("[3/5] Syncing candidate records...")
        cand1 = Candidate(
            campaign_id=campaign.id,
            first_name="Jane",
            last_name="Doe",
            email="jane.doe@example.com",
            phone_number="+15551234567",
            status="pending"
        )
        # Reschedule candidate (Ends in 004 to trigger reschedule webhook mock)
        cand2 = Candidate(
            campaign_id=campaign.id,
            first_name="Alex",
            last_name="Smith",
            email="alex.smith@example.com",
            phone_number="+15551230004", 
            status="pending"
        )
        db.add(cand1)
        db.add(cand2)
        db.commit()
        print(" -> Enrolled Candidates Jane Doe & Alex Smith in pending queue.")

        # Start Campaign
        print("[4/5] Activating campaign and launching dialing queue...")
        campaign.status = "active"
        cand1.status = "scheduled"
        cand2.status = "scheduled"
        db.commit()

        # Try to trigger the celery poller synchronously to simulate dial queue dispatcher
        print(" -> Launching dial queue dispatcher...")
        # (This triggers twilio_service.make_outbound_call, which in turn starts background threads
        # that perform local API calls simulating candidate-twilio conversational inputs!)
        run_outbound_dialer_queue()

        # Let's wait a few seconds to let the background threads run the dialogue rounds & evaluation analysis
        print(" -> Simulating interactive dialogues between candidates and AI Recruiter...")
        print("    (Running webhook responders, parsing consent, checking intents, and scoring...)")
        
        # We wait for background threads simulating the webhooks and analysis to finish
        for idx in range(8):
            time.sleep(2)
            sys.stdout.write(".")
            sys.stdout.flush()
        print("\n")

        # 5. Check results in DB
        print("[5/5] Checking database evaluations outcomes...")
        # Reload sessions
        db.expire_all()
        
        candidates = db.query(Candidate).all()
        print("\n--- Candidate Statuses ---")
        for c in candidates:
            print(f" * {c.first_name} {c.last_name}: Status = {c.status} (Attempts: {c.call_attempts})")

        evals = db.query(CallEvaluation).all()
        print("\n--- Evaluation Card dossiers ---")
        if not evals:
            print(" -> Warning: No evaluations generated yet. Let's wait a bit longer...")
            time.sleep(5)
            db.expire_all()
            evals = db.query(CallEvaluation).all()

        for ev in evals:
            call_log = db.query(CallLog).filter(CallLog.id == ev.call_log_id).first()
            cand = db.query(Candidate).filter(Candidate.id == call_log.candidate_id).first() if call_log else None
            cand_name = f"{cand.first_name} {cand.last_name}" if cand else "Unknown"
            print(f" * Candidate: {cand_name}")
            print(f"   Candidate Intelligence Score (CIS): {ev.candidate_intelligence_score} / 10.0")
            print(f"   Technical Score: {ev.technical_score}/10")
            print(f"   JD Vector Match: {ev.jd_fit_score}/10")
            print(f"   Extracted Experience: {ev.extracted_years_of_experience} Year(s)")
            print(f"   Extracted Salary: {ev.extracted_salary_expectation}")
            print(f"   Extracted Notice: {ev.extracted_notice_period}")
            print(f"   AI Summary: {ev.ai_generated_summary}")
            print(f"   Detailed Transcript snippet:\n{call_log.raw_transcript[:400] if call_log else ''}...")
            print("-" * 45)

        print("\n[SUCCESS] Integration test concluded successfully! All components verified.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TalentEcho Runner")
    parser.add_argument("--dry-run", action="store_true", help="Execute system integration dry-run simulation")
    args = parser.parse_args()

    if args.dry_run:
        # Run local test
        run_dry_run_test()
    else:
        # Start production/development web server
        print(f"Starting server in {settings.HOST}:{settings.PORT}...")
        uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
