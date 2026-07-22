import time
import threading
from twilio.rest import Client
from app.config import settings

class TwilioService:
    def __init__(self):
        self.is_mock = settings.TWILIO_ACCOUNT_SID.startswith("ACmock")
        if not self.is_mock:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        else:
            self.client = None

    def make_outbound_call(self, to_phone: str, candidate_id: str, campaign_id: str) -> str:
        """
        Triggers an outbound call using Twilio.
        If in mock mode, simulates the call states asynchronously.
        """
        to_url = f"{settings.BASE_URL}/api/calls/voice?candidate_id={candidate_id}&campaign_id={campaign_id}"
        status_callback = f"{settings.BASE_URL}/api/calls/twilio-callback?candidate_id={candidate_id}"

        if self.is_mock:
            # Append first 4 hex components of candidate_id to prevent collision in fast iterations
            mock_sid = f"CA{int(time.time())}{candidate_id[:8]}mock"
            print(f"[MOCK TWILIO] Initiating call to {to_phone}")
            print(f"[MOCK TWILIO] TwiML Url: {to_url}")
            print(f"[MOCK TWILIO] Status Callback: {status_callback}")
            
            # Start a background thread to simulate the Twilio webhooks
            # This triggers status callbacks and voice interactions locally using FastAPI's TestClient
            # preventing WinError 10061 (port connection refused) during offline dry runs!
            threading.Thread(
                target=self._simulate_mock_call,
                args=(mock_sid, candidate_id, campaign_id, to_phone),
                daemon=True
            ).start()
            return mock_sid

        try:
            call = self.client.calls.create(
                to=to_phone,
                from_=settings.TWILIO_PHONE_NUMBER,
                url=to_url,
                status_callback=status_callback,
                status_callback_event=["initiated", "ringing", "answered", "completed"]
            )
            return call.sid
        except Exception as e:
            print(f"[TWILIO ERROR] Outbound call failed: {str(e)}")
            raise e

    def send_whatsapp_outreach(self, candidate_id: str, candidate_name: str, phone: str, role_title: str) -> bool:
        """Sends WhatsApp invitation to candidate asking to reply YES."""
        msg_body = f"Hi {candidate_name}, you are shortlisted for {role_title}. Are you interested in a quick automated interview? Reply YES."
        
        if self.is_mock:
            print(f"[MOCK TWILIO WHATSAPP] Outreach sent to {phone} for candidate {candidate_id}")
            print(f" -> Message Body: '{msg_body}'")
            return True

        try:
            formatted_to = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
            self.client.messages.create(
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=formatted_to,
                body=msg_body
            )
            return True
        except Exception as e:
            print(f"[TWILIO WHATSAPP ERROR] Failed to send outreach: {e}")
            return False

    def trigger_outbound_voice_call(self, candidate_id: str, phone: str) -> str:
        """Initiates an outbound voice call pointing to our TwiML WebSocket endpoint."""
        voice_url = f"{settings.NGROK_URL.rstrip('/')}/webhook/voice/{candidate_id}"
        status_url = f"{settings.NGROK_URL.rstrip('/')}/webhook/call-status?candidate_id={candidate_id}"

        if self.is_mock:
            mock_sid = f"CA_VOICE_{int(time.time())}_{candidate_id[:6]}"
            print(f"[MOCK TWILIO VOICE] Triggering outbound call for candidate {candidate_id} to {phone}")
            print(f" -> TwiML URL: {voice_url}")
            return mock_sid

        try:
            call = self.client.calls.create(
                to=phone,
                from_=settings.TWILIO_PHONE_NUMBER,
                url=voice_url,
                status_callback=status_url,
                status_callback_event=["completed"]
            )
            return call.sid
        except Exception as e:
            print(f"[TWILIO VOICE ERROR] Failed to place outbound call: {e}")
            raise e


    def _simulate_mock_call(self, call_sid: str, candidate_id: str, campaign_id: str, phone: str):
        """
        Background simulation worker for Twilio status callbacks and conversations.
        Simulates: Ringing -> Answered -> Script Dialog -> Completed
        """
        from fastapi.testclient import TestClient
        try:
            import app.main as main_module
            app_instance = getattr(main_module, "app", None)
            if app_instance is None:
                return
            client = TestClient(app_instance)
        except Exception as err:
            print(f"[MOCK TWILIO] Client setup notice: {err}")
            return

        
        # Helper to post status to callback
        def post_status(status_val: str):
            try:
                client.post(
                    "/api/calls/twilio-callback",
                    params={"candidate_id": candidate_id},
                    data={"CallSid": call_sid, "CallStatus": status_val}
                )
            except Exception as e:
                print(f"[MOCK TWILIO INTERNALS] Webhook failure for status {status_val}: {e}")

        time.sleep(1)
        post_status("ringing")
        time.sleep(1)
        post_status("in-progress")

        # Simulate candidate answering yes to recording and answering questions
        # This will trigger the FastAPI voice endpoint under the hood via TestClient
        try:
            # 1. AI Greets. We make the initial request to fetch the greeting TwiML.
            client.post(
                "/api/calls/voice",
                params={"candidate_id": candidate_id, "campaign_id": campaign_id},
                data={"CallSid": call_sid, "CallStatus": "in-progress"}
            )
            
            # If candidate phone number contains "busy" (e.g. ends in "001"), simulate busy state
            if "busy" in phone or phone.endswith("001"):
                time.sleep(1)
                post_status("busy")
                return
            # If candidate phone number contains "noanswer" (e.g. ends in "002"), simulate no-answer
            if "noanswer" in phone or phone.endswith("002"):
                time.sleep(1)
                post_status("no-answer")
                return
            
            simulate_refusal = phone.endswith("003")
            simulate_callback = phone.endswith("004")

            # 2. Simulate dialogue rounds.
            # First round: Greeting and Recording Consent
            time.sleep(1)
            user_input = "No, I do not want to be recorded." if simulate_refusal else "Sure, I consent to the recording."
            client.post(
                "/api/calls/respond",
                params={"candidate_id": candidate_id},
                data={"CallSid": call_sid, "SpeechResult": user_input}
            )

            # If user consented, process next steps
            if not simulate_refusal:
                # Second round: Interest check
                time.sleep(1)
                user_input = "Actually, could we reschedule this call to tomorrow at 3 PM?" if simulate_callback else "Yes, I am interested in this role."
                client.post(
                    "/api/calls/respond",
                    params={"candidate_id": candidate_id},
                    data={"CallSid": call_sid, "SpeechResult": user_input}
                )

                # Third round: Job specific screening questions (Simulate mock answers)
                if not simulate_callback:
                    questions_to_answer = [
                        "Yes, I have five years of experience in Python and FastAPI.",
                        "My notice period is thirty days.",
                        "My salary expectations are eighty thousand dollars per year.",
                        "Mostly SQL databases like Postgres, and coding clean modular architectures."
                    ]
                    for ans in questions_to_answer:
                        time.sleep(1)
                        client.post(
                            "/api/calls/respond",
                            params={"candidate_id": candidate_id},
                            data={"CallSid": call_sid, "SpeechResult": ans}
                        )

            # Simulate hangup
            time.sleep(1)
            post_status("completed")
        except Exception as e:
            print(f"[MOCK TWILIO INTERNALS] Dialogue simulation error: {e}")
            post_status("failed")

twilio_service = TwilioService()
