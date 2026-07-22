import io
import csv
try:
    import phonenumbers
except ImportError:
    phonenumbers = None

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models import Campaign, Candidate
from app.schemas import CandidateResponse

router = APIRouter(prefix="/campaigns", tags=["Candidates"])

def validate_and_format_phone(phone_str: str) -> str:
    """
    Validates phone number using Google phonenumbers library.
    Converts national format to internationally compliant E.164.
    """
    cleaned = phone_str.strip()
    if phonenumbers is None:
        if not cleaned.startswith("+"):
            return f"+1{cleaned}"
        return cleaned

        # Let's assume standard country code (e.g. US +1 or IN +91) if not provided.
        # Enforce international prefix requirement in real-world systems, or default to generic US code '+1' for testing.
        if cleaned.startswith("0") or len(cleaned) == 10:
            cleaned = "+1" + cleaned # standard fallback
        else:
            cleaned = "+" + cleaned

    try:
        parsed = phonenumbers.parse(cleaned, None)
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("Invalid phone number digits")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        raise ValueError(f"Unable to parse phone number: {phone_str}")

@router.post("/{campaign_id}/upload-csv", status_code=status.HTTP_201_CREATED)
def upload_candidates_csv(
    campaign_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Ensure campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    # Read file content
    contents = file.file.read()
    buffer = io.StringIO(contents.decode("utf-8"))
    
    # Parse CSV
    reader = csv.DictReader(buffer)
    
    # Validate CSV Headers: need first_name, last_name, email, phone_number
    headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []
    required_headers = {"first_name", "last_name", "email", "phone_number"}
    
    if not required_headers.issubset(set(headers)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV must contain headers: first_name, last_name, email, phone_number. Received: {reader.fieldnames}"
        )

    # Map database schemas columns from headers (handles case insensitive/messy casing)
    field_mapping = {}
    for actual_header in reader.fieldnames:
        cleaned = actual_header.strip().lower()
        if cleaned == "first_name":
            field_mapping["first_name"] = actual_header
        elif cleaned == "last_name":
            field_mapping["last_name"] = actual_header
        elif cleaned == "email":
            field_mapping["email"] = actual_header
        elif cleaned == "phone_number":
            field_mapping["phone_number"] = actual_header

    successful_inserts = 0
    skipped_duplicates = 0
    failed_rows: List[Dict[str, Any]] = []

    for row_idx, row in enumerate(reader, start=1):
        try:
            fname = row.get(field_mapping["first_name"], "").strip()
            lname = row.get(field_mapping["last_name"], "").strip()
            email = row.get(field_mapping["email"], "").strip()
            raw_phone = row.get(field_mapping["phone_number"], "").strip()

            # Row completeness check
            if not fname or not email or not raw_phone:
                failed_rows.append({
                    "row": row_idx,
                    "reason": "Missing required fields (first_name, email, and phone_number must be populated)"
                })
                continue

            # Phone processing
            try:
                formatted_phone = validate_and_format_phone(raw_phone)
            except ValueError as e:
                failed_rows.append({
                    "row": row_idx,
                    "reason": str(e)
                })
                continue

            # Duplicate candidate checks (within current campaign ID)
            duplicate = db.query(Candidate).filter(
                Candidate.campaign_id == campaign_id,
                (Candidate.email == email) | (Candidate.phone_number == formatted_phone)
            ).first()

            if duplicate:
                skipped_duplicates += 1
                continue

            # Create Database log
            db_candidate = Candidate(
                campaign_id=campaign_id,
                first_name=fname,
                last_name=lname,
                email=email,
                phone_number=formatted_phone,
                status="pending"
            )
            db.add(db_candidate)
            successful_inserts += 1

        except Exception as e:
            failed_rows.append({
                "row": row_idx,
                "reason": f"System error processing row: {str(e)}"
            })

    db.commit()

    return {
        "campaign_id": campaign_id,
        "total_processed": successful_inserts + skipped_duplicates + len(failed_rows),
        "successful_records": successful_inserts,
        "duplicate_skipped": skipped_duplicates,
        "failed_records": len(failed_rows),
        "errors": failed_rows
    }

@router.get("/{campaign_id}/candidates", response_model=List[CandidateResponse])
def get_campaign_candidates(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    return db.query(Candidate).filter(Candidate.campaign_id == campaign_id).all()
