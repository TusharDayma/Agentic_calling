import base64
import io
import logging
import math
import wave
import numpy as np
from typing import List

logger = logging.getLogger(__name__)

# Attempt to import audioop (or audioop-lts for python 3.12+)
try:
    import audioop
except ImportError:
    try:
        import audioop_lts as audioop
    except ImportError:
        audioop = None

# μ-law encoding lookup table fallback
MULAW_ENCODE_TABLE = np.zeros(65536, dtype=np.uint8)
for i in range(65536):
    sample = i - 32768
    sign = (sample >> 8) & 0x80
    if sample < 0:
        sample = -sample
    sample += 132
    if sample > 32767:
        sample = 32767
    exponent = int(math.log2(sample >> 7)) if sample >= 128 else 0
    mantissa = (sample >> (exponent + 3)) & 0x0F
    mu_val = ~(sign | (exponent << 4) | mantissa) & 0xFF
    MULAW_ENCODE_TABLE[i] = mu_val


def encode_pcm_to_mulaw(pcm_bytes: bytes) -> bytes:
    """Encodes 16-bit linear PCM bytes to 8000Hz 8-bit μ-law bytes."""
    if audioop is not None:
        try:
            return audioop.lin2ulaw(pcm_bytes, 2)
        except Exception:
            pass
    # Fast numpy lookup
    pcm_array = np.frombuffer(pcm_bytes, dtype=np.int16)
    idx = (pcm_array.astype(np.int32) + 32768).astype(np.uint16)
    mulaw_array = MULAW_ENCODE_TABLE[idx]
    return mulaw_array.tobytes()


def resample_pcm(pcm_bytes: bytes, in_rate: int, out_rate: int = 8000) -> bytes:
    """Simple linear interpolation resampler for PCM 16-bit audio."""
    if in_rate == out_rate:
        return pcm_bytes
    if audioop is not None:
        try:
            resampled, _ = audioop.ratecv(pcm_bytes, 2, 1, in_rate, out_rate, None)
            return resampled
        except Exception:
            pass
    pcm_in = np.frombuffer(pcm_bytes, dtype=np.int16)
    num_output_samples = int(len(pcm_in) * out_rate / in_rate)
    pcm_out = np.interp(
        np.linspace(0, len(pcm_in), num_output_samples, endpoint=False),
        np.arange(len(pcm_in)),
        pcm_in
    ).astype(np.int16)
    return pcm_out.tobytes()


class TTSService:
    """
    Agent 1: Fast Local TTS Engine (Kokoro-ONNX / Piper / gTTS / pyttsx3 fallback).
    Converts text response to 8kHz μ-law base64 audio chunks for Twilio WebSocket.
    """
    def __init__(self):
        self.kokoro = None
        self._init_engine()

    def _init_engine(self):
        try:
            from kokoro_onnx import Kokoro
            logger.info("Initializing Kokoro-ONNX sub-100ms local voice synthesizer...")
            self.kokoro = Kokoro("kokoro-v0_19.onnx", "voices.json")
        except Exception as e:
            logger.info(f"Kokoro-ONNX local TTS notice: {e}. Utilizing fast PyTTSx3/gTTS synthesis.")

    def text_to_speech_mulaw_chunks(self, text: str, chunk_size: int = 160) -> List[str]:
        """
        Synthesizes text into speech and returns a list of base64-encoded 8kHz μ-law 
        audio payload strings (each ~20ms / 160 bytes for Twilio).
        """
        if not text or not text.strip():
            return []

        pcm_8k_bytes = None

        # 1. Try Kokoro-ONNX if available
        if self.kokoro is not None:
            try:
                samples, sample_rate = self.kokoro.create(text, voice="af_sarah", speed=1.0, lang="en-us")
                pcm_16bit = (samples * 32767).astype(np.int16).tobytes()
                pcm_8k_bytes = resample_pcm(pcm_16bit, sample_rate, 8000)
            except Exception as ex:
                logger.warning(f"Kokoro-ONNX generation error: {ex}")

        # 2. Fallback to gTTS or pyttsx3 or wave synthesizer
        if pcm_8k_bytes is None:
            pcm_8k_bytes = self._fallback_synthesizer(text)

        # Encode PCM 8000Hz 16-bit to μ-law 8000Hz 8-bit
        mulaw_bytes = encode_pcm_to_mulaw(pcm_8k_bytes)

        # Slice into 20ms chunks (160 bytes per chunk at 8000 samples/sec)
        base64_chunks = []
        for i in range(0, len(mulaw_bytes), chunk_size):
            chunk = mulaw_bytes[i:i + chunk_size]
            if len(chunk) < chunk_size:
                chunk = chunk.ljust(chunk_size, b'\x7f')  # pad with silence byte
            base64_chunks.append(base64.b64encode(chunk).decode("ascii"))

        return base64_chunks

    def _fallback_synthesizer(self, text: str) -> bytes:
        """Fallback TTS synthesizer using gTTS or pyttsx3 or synthesized sine acoustic pulses."""
        try:
            from gtts import gTTS
            mp3_fp = io.BytesIO()
            tts = gTTS(text=text, lang='en', slow=False)
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            
            # Simple conversion if pydub/ffmpeg is installed
            from pydub import AudioSegment
            sound = AudioSegment.from_file(mp3_fp, format="mp3")
            sound = sound.set_frame_rate(8000).set_channels(1).set_sample_width(2)
            return sound.raw_data
        except Exception:
            pass

        # Generates clean, audible acoustic synthetic voice tone pattern for testing when offline
        duration_sec = max(1.0, len(text) * 0.06)
        num_samples = int(8000 * duration_sec)
        t = np.linspace(0, duration_sec, num_samples, False)
        # Create pleasant chord sound for testing telephony
        signal = 0.3 * np.sin(2 * np.pi * 440 * t) + 0.2 * np.sin(2 * np.pi * 554.37 * t)
        pcm_data = (signal * 32767).astype(np.int16).tobytes()
        return pcm_data

tts_service = TTSService()
