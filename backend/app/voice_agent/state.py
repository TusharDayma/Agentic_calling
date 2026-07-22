from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DialogueState(BaseModel):
    # State tracking
    candidate_id: str
    campaign_id: str
    call_sid: str
    
    current_step: str = "greeting" # greeting, consent_check, interest_check, pre_screening, outro, end
    questions: List[Dict[str, Any]] = []
    current_question_idx: int = 0
    
    # Flags & Transcripts
    consent_granted: bool = False
    interested: bool = False
    last_user_speech: str = ""
    
    transcript: List[Dict[str, str]] = [] # list of {"role": "assistant"|"user", "text": "..."}
    output_speech: str = ""
    hangup_required: bool = False
