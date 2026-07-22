import base64
import logging
import struct
import numpy as np
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Attempt to import audioop (or audioop-lts for python 3.12+)
try:
    import audioop
except ImportError:
    try:
        import audioop_lts as audioop
    except ImportError:
        audioop = None

# μ-law decoding fallback table in case audioop module is not present
MULAW_DECODE_TABLE = np.zeros(256, dtype=np.int16)
for i in range(256):
    mu_val = ~i & 0xFF
    sign = -1 if (mu_val & 0x80) else 1
    exponent = (mu_val >> 4) & 0x07
    mantissa = mu_val & 0x0F
    sample = sign * ((mantissa << (exponent + 3)) + (132 << exponent) - 132)
    MULAW_DECODE_TABLE[i] = np.clip(sample, -32768, 32767)


def decode_mulaw_to_pcm(mulaw_bytes: bytes) -> bytes:
    """Decodes 8000Hz 8-bit μ-law bytes from Twilio into 16-bit linear PCM bytes."""
    if audioop is not None:
        try:
            return audioop.ulaw2lin(mulaw_bytes, 2)
        except Exception:
            pass
    # Numpy lookup table fallback
    mulaw_array = np.frombuffer(mulaw_bytes, dtype=np.uint8)
    pcm_array = MULAW_DECODE_TABLE[mulaw_array]
    return pcm_array.tobytes()


class AudioVADBuffer:
    """
    VAD & Audio Buffer for Twilio Stream.
    Buffers incoming 20ms μ-law audio frames, detects silence/speech pauses (e.g. 500ms),
    and returns accumulated PCM audio when candidate stops speaking.
    """
    def __init__(self, silence_threshold_ms: int = 500, rms_energy_threshold: float = 300.0):
        self.silence_threshold_ms = silence_threshold_ms
        self.rms_energy_threshold = rms_energy_threshold
        self.buffer_pcm = bytearray()
        self.speech_frames_count = 0
        self.silence_ms_count = 0
        self.is_speaking = False

    def process_chunk(self, base64_payload: str) -> Tuple[bool, Optional[bytes]]:
        """
        Receives a base64 μ-law chunk from Twilio WebSocket (typically 160 bytes = 20ms).
        Returns (is_utterance_complete, pcm_data_or_None).
        """
        try:
            mulaw_bytes = base64.b64decode(base64_payload)
            pcm_bytes = decode_mulaw_to_pcm(mulaw_bytes)
        except Exception as e:
            logger.error(f"Error decoding Twilio audio chunk: {e}")
            return False, None

        # Calculate Root Mean Square (RMS) energy for simple VAD
        samples = np.frombuffer(pcm_bytes, dtype=np.int16)
        if len(samples) == 0:
            return False, None
            
        rms = float(np.sqrt(np.mean(samples.astype(np.float32) ** 2)))

        if rms > self.rms_energy_threshold:
            self.buffer_pcm.extend(pcm_bytes)
            self.speech_frames_count += 1
            self.silence_ms_count = 0
            self.is_speaking = True
        else:
            if self.is_speaking:
                self.buffer_pcm.extend(pcm_bytes)
                self.silence_ms_count += 20  # Each Twilio frame is ~20ms
                if self.silence_ms_count >= self.silence_threshold_ms:
                    # Candidate stopped speaking! Trigger transcription.
                    audio_data = bytes(self.buffer_pcm)
                    self.reset()
                    return True, audio_data

        return False, None

    def reset(self):
        self.buffer_pcm.clear()
        self.speech_frames_count = 0
        self.silence_ms_count = 0
        self.is_speaking = False


class STTService:
    """Agent 2: Local STT Engine using faster-whisper (with fallback)."""
    def __init__(self):
        self.whisper_model = None
        self._init_model()

    def _init_model(self):
        try:
            from faster_whisper import WhisperModel
            logger.info("Initializing faster-whisper model (tiny.en / base.en)...")
            self.whisper_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
        except Exception as e:
            logger.warning(f"faster-whisper load notice: {e}. Will use light speech recognition fallback.")

    def transcribe_pcm(self, pcm_bytes: bytes, sample_rate: int = 8000) -> str:
        """Transcribes PCM audio bytes into text string."""
        if not pcm_bytes or len(pcm_bytes) < 3200:  # < 0.2s of audio
            return ""

        if self.whisper_model is not None:
            try:
                # Convert PCM int16 buffer to float32 array normalized between -1.0 and 1.0
                pcm_data = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                
                # Resample 8000Hz to 16000Hz for Whisper if needed
                if sample_rate == 8000:
                    pcm_data = np.repeat(pcm_data, 2)
                    
                segments, info = self.whisper_model.transcribe(pcm_data, beam_size=1, language="en")
                text = " ".join([segment.text for segment in segments]).strip()
                return text
            except Exception as ex:
                logger.warning(f"faster-whisper transcription error: {ex}")

        # Fallback dummy heuristic or speech_recognition if installed
        try:
            import speech_recognition as sr
            r = sr.Recognizer()
            audio = sr.AudioData(pcm_bytes, sample_rate, 2)
            return r.recognize_google(audio)
        except Exception:
            pass

        return ""

stt_service = STTService()
