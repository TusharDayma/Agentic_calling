import json
from app.voice_agent.state import DialogueState

# Using standard rule processing + basic GPT-based parsing for voice dialogues.
# In a production AI voice system, we use an LLM or keyword matcher to clean intent.
# Here we implement parsing logic for: recording consent, callback requests, interest, and pre-screening.

def clean_speech(text: str) -> str:
    return text.strip().lower()

def parse_consent(speech: str) -> bool:
    """Detects if the candidate consents to call recording (DPDP Act)"""
    cleaned = clean_speech(speech)
    negatives = ["no", "don't", "dont", "refuse", "decline", "not agree", "not consent", "stop", "never"]
    for neg in negatives:
        if neg in cleaned:
            return False
    return True

def parse_interest(speech: str) -> bool:
    """Detects if the candidate is interested in proceeding with the screening"""
    cleaned = clean_speech(speech)
    positives = ["yes", "interested", "sure", "ok", "okay", "yeah", "process", "continue", "deal"]
    negatives = ["no", "not interested", "decline", "stop", "bye"]
    for neg in negatives:
        if neg in cleaned and "yes" not in cleaned:
            return False
    return True

def parse_callback_request(speech: str) -> bool:
    """Detects if the candidate wants to reschedule or get a callback later"""
    cleaned = clean_speech(speech)
    triggers = ["later", "busy", "callback", "call back", "tomorrow", "reschedule", "after", "hours", "other time"]
    for trig in triggers:
        if trig in cleaned:
            return True
    return False

# Dialogue State Node Handlers

def handle_greeting_state(state: DialogueState) -> DialogueState:
    """AI introduces itself and requests recording consent"""
    state.current_step = "consent_check"
    state.output_speech = (
        "Hello! I am the AI Recruiter representing our HR solutions team. "
        "I am calling to conduct a very brief pre-screening interview for our open position. "
        "Before we begin, do I have your consent to record this call for compliance and evaluation purposes under the DPDP Act?"
    )
    state.transcript.append({"role": "assistant", "text": state.output_speech})
    return state

def handle_consent_check_state(state: DialogueState) -> DialogueState:
    """Processes user response to the consent question"""
    user_speech = state.last_user_speech
    state.transcript.append({"role": "user", "text": user_speech})
    
    consented = parse_consent(user_speech)
    if consented:
        state.consent_granted = True
        state.current_step = "interest_check"
        state.output_speech = (
            "Thank you. Can you confirm if you are currently interested and open to considering new job opportunities?"
        )
    else:
        state.consent_granted = False
        state.current_step = "end"
        state.output_speech = (
            "We understand. Since recording is required for automated pre-screening, "
            "we cannot proceed via this channel. A human recruiter will follow up if possible. Thank you for your time. Goodbye."
        )
        state.hangup_required = True
        
    state.transcript.append({"role": "assistant", "text": state.output_speech})
    return state

def handle_interest_check_state(state: DialogueState) -> DialogueState:
    """Processes candidate confirmation of job interest or callback requests"""
    user_speech = state.last_user_speech
    state.transcript.append({"role": "user", "text": user_speech})

    # Check rescheduling callback request first
    wants_callback = parse_callback_request(user_speech)
    if wants_callback:
        # Candidate wants a reschedule
        state.current_step = "end"
        state.output_speech = (
            "No problem at all! I will schedule a call back at a later slot. "
            "Our automated scheduling scheduler will update you. Have a great day!"
        )
        state.hangup_required = True
        # We flag the candidate status as rescheduled/scheduled inside routers later
        return state

    is_interested = parse_interest(user_speech)
    if is_interested:
        state.interested = True
        state.current_step = "pre_screening"
        state.current_question_idx = 0
        
        # Check if campaign contains questions
        if state.questions:
            state.output_speech = (
                "Excellent! Let us begin with the pre-screening questions. "
                f"Question 1: {state.questions[0]['question_text']}"
            )
        else:
            state.output_speech = "Excellent! There are no pre-screening questions configured. Thank you. Goodbye."
            state.current_step = "outro"
            state.hangup_required = True
    else:
        state.interested = False
        state.current_step = "end"
        state.output_speech = (
            "Understood, thank you for letting us know. We will mark you as not interested for this campaign. Goodbye."
        )
        state.hangup_required = True

    state.transcript.append({"role": "assistant", "text": state.output_speech})
    return state

def handle_pre_screening_state(state: DialogueState) -> DialogueState:
    """Processes answers to candidate pre-screening questions sequentially"""
    user_speech = state.last_user_speech
    state.transcript.append({"role": "user", "text": user_speech})

    # Move to the next question
    state.current_question_idx += 1
    
    if state.current_question_idx < len(state.questions):
        q = state.questions[state.current_question_idx]
        state.output_speech = f"Question {state.current_question_idx + 1}: {q['question_text']}"
    else:
        # Out of questions: proceed to Outro
        state.current_step = "outro"
        state.output_speech = (
            "Thank you so much. That was the last question in our pre-screening check. "
            "Our evaluation engine is reviewing your details, and our human recruiting team will contact you shortly regarding the next steps. "
            "Have a wonderful day!"
        )
        state.hangup_required = True

    state.transcript.append({"role": "assistant", "text": state.output_speech})
    return state
