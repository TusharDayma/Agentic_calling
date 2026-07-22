import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Automatically load environment variables from .env file
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_file_path):
    load_dotenv(env_file_path)
else:
    load_dotenv()


class Settings(BaseModel):
    # App Settings
    APP_NAME: str = os.getenv("APP_NAME", "Enterprise AI Pre-Screening Platform")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-make-sure-to-override-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # Database Connection
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recruitment.db")

    # Redis & Celery Background Queue
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

    # Twilio Telephony & WhatsApp Configuration
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "ACmockaccountsid0000000000000000")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "mockauthtoken000000000000000000")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "+15017122661")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    NGROK_URL: str = os.getenv("NGROK_URL", "http://localhost:8000")

    # Local Ollama AI Engine Settings (100% Ollama Driven)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # Local Speech Synthesizer & Recognizer Settings
    STT_ENGINE: str = os.getenv("STT_ENGINE", "faster-whisper")
    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "kokoro-onnx")


settings = Settings()
