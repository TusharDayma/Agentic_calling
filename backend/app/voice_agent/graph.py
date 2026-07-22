import json
from sqlalchemy.orm import Session
from app.models import CallLog, Campaign, Candidate
from app.voice_agent.state import DialogueState
from app.voice_agent.nodes import (
    handle_greeting_state,
    handle_consent_check_state,
    handle_interest_check_state,
    handle_pre_screening_state
)
from app.config import settings

class DialogueManager:
    def _get_or_create_state(self, candidate_id: str, campaign_id: str, call_sid: str, db: Session) -> DialogueState:
        """
        Loads the serialized DialogueState from the DB CallLog's raw_transcript string,
        or creates a new state instance if none exists.
        """
        call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == call_sid).first()
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        
        # Load questions list from Campaign
        questions = campaign.question_set if campaign else []

        if call_log and call_log.raw_transcript:
            try:
                # Try to deserialize existing state
                state_data = json.loads(call_log.raw_transcript)
                # Ensure questions are up to date
                state_data["questions"] = questions
                return DialogueState(**state_data)
            except Exception:
                pass
        
        # Build fresh state
        return DialogueState(
            candidate_id=candidate_id,
            campaign_id=campaign_id,
            call_sid=call_sid,
            current_step="greeting",
            questions=questions
        )

    def _save_state(self, state: DialogueState, db: Session):
        """Serializes the DialogueState back into the database CallLog."""
        call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == state.call_sid).first()
        if call_log:
            # We save the state fields in raw_transcript
            # Also, write the clean dialog text into Candidate's transcript field if available
            call_log.raw_transcript = json.dumps(state.dict())
            
            # Sync candidate status if call completed/rescheduled
            candidate = db.query(Candidate).filter(Candidate.id == state.candidate_id).first()
            if candidate:
                if state.current_step == "end" or state.hangup_required:
                    # Update status
                    if not state.consent_granted:
                        candidate.status = "refused"
                    elif state.interested == False:
                        candidate.status = "declined"
                    elif state.current_step == "end" and state.interested:
                        # Reschedule detection (if ended in end state but interest check passed, it's either reschedule or finish)
                        if "reschedule" in state.output_speech.lower() or "call back" in state.output_speech.lower():
                            candidate.status = "scheduled" # rescheduled retry
                        else:
                            candidate.status = "completed"
            db.commit()

    def start_dialogue(self, candidate_id: str, campaign_id: str, call_sid: str, db: Session) -> str:
        """Kicks off the call dialogue by executing the greeting node."""
        state = self._get_or_create_state(candidate_id, campaign_id, call_sid, db)
        
        # Run greeting node
        state = handle_greeting_state(state)
        
        # Save state
        self._save_state(state, db)
        
        # Generate TwiML response
        return self._generate_twiml(state)

    def process_step(self, candidate_id: str, call_sid: str, user_speech: str, db: Session) -> str:
        """Processes candidate answer and advances dialogue state machine."""
        call_log = db.query(CallLog).filter(CallLog.twilio_call_sid == call_sid).first()
        if not call_log:
            return self._generate_fallback_twiml()
            
        state = self._get_or_create_state(candidate_id, call_log.candidate_id, call_sid, db)
        state.last_user_speech = user_speech

        # Dialogue State Routing (Simple compilation of the LangGraph flow)
        if state.current_step == "consent_check":
            state = handle_consent_check_state(state)
        elif state.current_step == "interest_check":
            state = handle_interest_check_state(state)
        elif state.current_step == "pre_screening":
            state = handle_pre_screening_state(state)
        else:
            # Fallback outro if we get request in unknown steps
            state.output_speech = "Thank you. This call has concluded. Have a nice day."
            state.hangup_required = True
            state.current_step = "end"
            
        self._save_state(state, db)
        return self._generate_twiml(state)

    def _generate_twiml(self, state: DialogueState) -> str:
        """Compiles DialogueState output speech into Twilio XML instructions."""
        action_url = f"{settings.BASE_URL}/api/calls/respond?candidate_id={state.candidate_id}"
        
        if state.hangup_required:
            twiml = (
                f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<Response>\n'
                f'    <Say voice="alice">{state.output_speech}</Say>\n'
                f'    <Hangup/>\n'
                f'</Response>'
            )
        else:
            twiml = (
                f'<?xml version="1.0" encoding="UTF-8"?>\n'
                f'<Response>\n'
                f'    <Gather action="{action_url}" method="POST" input="speech" timeout="6" speechTimeout="auto">\n'
                f'        <Say voice="alice">{state.output_speech}</Say>\n'
                f'    </Gather>\n'
                # Fallback if candidate remains silent: redirect back to respond with empty speech
                f'    <Redirect method="POST">{action_url}</Redirect>\n'
                f'</Response>'
            )
        return twiml

    def _generate_fallback_twiml(self) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<Response>\n'
            '    <Say voice="alice">An error occurred in our system. Goodbye.</Say>\n'
            '    <Hangup/>\n'
            '</Response>'
        )

dialogue_manager = DialogueManager()
