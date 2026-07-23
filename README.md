# AntiTalk — V1 End-to-End AI Interview & Screening Platform

Local, end-to-end automated technical screening platform powered by **Twilio**, **Local Ollama (Llama 3)**, **Local STT (faster-whisper)**, and **Local Speech Synthesis**.

The platform orchestrates a complete 5-step recruitment funnel:
$$\text{Landing Page Leaderboard (`/`)} \longrightarrow \text{WhatsApp Outreach} \longrightarrow \text{Web Scheduling (`/schedule/{id}`)} \longrightarrow \text{Twilio Voice Call (`/media-stream`)} \longrightarrow \text{Post-Call Ollama Ranking}$$

---

## 🚀 Key Features

1. **Live Landing Page Candidate Rankings (`/`)**:
   - Displays real-time **Candidate Intelligence Scores (0–100)**, target roles, contact info, and AI justification cards directly on the homepage, pulling live data from the SQLite database.
2. **Role-Based Access Control (RBAC) & Secure Authentication**:
   - Secure JWT-based login interface (`/login`). `Admin` users can manage system settings and job roles, while `HR` users handle campaigns and candidate screening.
3. **Unified Navigation Layout (`/hr`)**:
   - Combined sidebar layout covering **Overview Dashboard**, **V1 AI Screener**, **Create Campaign**, **My Campaigns**, **Candidate Dossiers**, **Analytics & Leaderboard**, **Job Roles & Question Sets**, and **Team Settings**.
4. **V1 Admin & Call Trigger Dashboard (`/dashboard`)**:
   - Submit candidate profiles, target roles, and custom interview questions with expected answer criteria.
5. **Twilio WhatsApp Outreach**:
   - Automatically sends shortlisting invites via Twilio WhatsApp API and processes candidate `"YES"` confirmation webhooks.
6. **Candidate Web Scheduling (`/schedule/{candidate_id}`)**:
   - Self-service scheduling page with an interactive **"Call Me Now"** outbound call trigger.
7. **Real-Time WebSocket Audio Engine (`/media-stream/{candidate_id}`)**:
   - Bidirectional 8000Hz 8-bit μ-law audio stream over WebSockets.
   - **Agent 2 (Local STT)**: Decodes μ-law audio and transcribes candidate responses using `faster-whisper` + Voice Activity Detection (VAD).
   - **Agent 3 (Interviewer LLM via Ollama Llama 3)**: Evaluates answer accuracy against expected criteria, probes for clarification if vague/incorrect, and manages call state.
   - **Agent 1 (Local TTS)**: Synthesizes responses into 20ms base64 μ-law chunks streamed back over WebSocket.
8. **Post-Call Ranking & AI Scorecard (Agent 4)**:
   - Ollama Llama 3 Ranker agent analyzes the full transcript, calculates a 0–100 score, and writes a detailed technical & communication justification to the database.

---

## 🛠️ Stack & Architecture

- **Backend Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL / SQLite (via SQLAlchemy ORM)
- **AI / LLM Engine**: Local **Ollama** (`llama3`) — *100% offline local LLM execution*
- **Speech & Telephony**:
  - STT: `faster-whisper` + RMS Energy VAD
  - TTS: `kokoro-onnx` / `piper-tts` / Local fallback synthesizer
  - Audio Codec: `audioop` / `audioop-lts` (μ-law 8kHz <-> PCM linear)
- **Telephony & Messaging**: Twilio Voice REST API, TwiML, & WhatsApp Webhooks
- **Frontend Dashboard**: React 18 / TypeScript + Tailwind CSS + Framer Motion

---

## 📁 Directory Structure

```
AntiTalk/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point & router registration
│   │   ├── configuration.py   # Centralized Settings loading from .env via dotenv
│   │   ├── config.py          # Proxy settings module for backward compatibility
│   │   ├── auth.py            # JWT authentication & password hashing
│   │   ├── models.py          # SQLAlchemy DB Schema (Candidate, Campaign, CallLog, CallEvaluation)
│   │   ├── database.py        # Database engine & session setup
│   │   ├── routers/
│   │   │   ├── dashboard.py    # Admin Dashboard HTML & /api/dashboard/start-interview API
│   │   │   ├── webhooks.py     # Twilio WhatsApp reply & Voice TwiML webhooks
│   │   │   ├── scheduling.py   # Candidate portal & /call-now trigger API
│   │   │   └── media_stream.py # Bidirectional WebSocket handler & CallState machine
│   │   ├── services/
│   │   │   ├── ollama_service.py # Agent 3 (Interviewer) & Agent 4 (Ranker) via local Ollama
│   │   │   ├── stt_service.py    # Agent 2: μ-law audio decoding & faster-whisper STT + VAD
  │   │   ├── tts_service.py    # Agent 1: Local speech synthesis & μ-law audio encoding
│   │   │   └── twilio_service.py # Twilio WhatsApp & outbound voice call dispatchers
│   │   └── templates/
│   │       ├── dashboard.html # Admin data input & live ranking score dashboard
│   │       └── schedule.html  # Candidate scheduling & "Call Me Now" portal
│   ├── run.py                 # Server launcher (`python run.py`) & dry-run player (`--dry-run`)
│   ├── requirements.txt       # Backend Python dependencies
│   └── .env                   # Environment variables & API configuration
└── frontend/
    ├── src/                   # React frontend dashboard components
    │   ├── pages/
    │   │   ├── LandingPage.tsx# Homepage with live candidate rankings leaderboard
    │   │   ├── LoginPage.tsx  # Single unified login page
    │   │   └── hr/            # Unified platform pages & layout
    └── .env                   # Frontend environment settings (VITE_API_BASE_URL)
```

---

## ⚙️ Step-by-Step Setup & Execution Guide

### Step 1: Environment Configuration (`.env`)

1. Navigate to the `backend/` directory and verify `.env`:
   ```env
   APP_NAME="Enterprise AI Pre-Screening Platform"
   DEBUG=True
   PORT=8000
   HOST=0.0.0.0

   SECRET_KEY="super-secret-key-make-sure-to-override-in-production"
   ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Use PostgreSQL (Requires: pip install psycopg2-binary)
   DATABASE_URL="postgresql://postgres:password@localhost/recruitment_db"
   # Or use SQLite: DATABASE_URL="sqlite:///./recruitment.db"

   TWILIO_ACCOUNT_SID="YOUR_TWILIO_ACCOUNT_SID_HERE"
   TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN_HERE"
   TWILIO_PHONE_NUMBER="+1234567890" # Replace with your Twilio Voice Number
   TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886" # Standard Twilio WhatsApp Sandbox Number

   BASE_URL="http://localhost:8000"
   NGROK_URL="https://your-ngrok-url.ngrok-free.app" # Replace with your active Ngrok URL

   OLLAMA_BASE_URL="http://localhost:11434"
   OLLAMA_MODEL="llama3"

   STT_ENGINE="faster-whisper"
   TTS_ENGINE="kokoro-onnx"
   ```

2. Verify `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

---

### Step 2: Install Dependencies

**Backend Setup:**
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
# Ensure FastAPI and Pydantic are up to date:
pip install --upgrade fastapi pydantic
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

---

### Step 3: Database Setup

This platform uses PostgreSQL for robust RBAC and user data. 

1. Ensure PostgreSQL is installed and running on your machine (or use Docker).
2. Create a database named `recruitment_db` (or update `.env` to match your DB name).
3. Update `DATABASE_URL` in `backend/.env` with your Postgres credentials:
   `DATABASE_URL="postgresql://username:password@localhost/recruitment_db"`
4. When you first launch the backend, SQLAlchemy will automatically create all required tables and seed a default Admin user.

---

### Step 3: Run Local Ollama Model

Make sure Ollama is installed and active:
```bash
ollama run llama3
```

---

### Step 4: Expose Backend via Ngrok (Required for Twilio)

Since Twilio needs to send webhooks to your platform, expose your local backend server to the internet:
```bash
ngrok http 8000
```
*Copy the `https://...ngrok-free.app` URL and update the `NGROK_URL` in your `backend/.env` file.*

---

### Step 5: Run System Self-Test (Dry-Run)

Validate the full end-to-end pipeline:
```bash
cd backend
python run.py --dry-run
```

---

### Step 6: Start the Live Server & Frontend

**1. Run Backend Server & API:**
```bash
cd backend
python run.py
```
- **Landing Page (Live Rankings)**: `http://localhost:8000/` or `http://localhost:5173/`
- **V1 AI Call Screener**: `http://localhost:8000/dashboard`
- **Interactive API Docs**: `http://localhost:8000/docs`

**2. Run React Frontend (Optional Dev Server):**
```bash
cd frontend
npm run dev
```
- **React Frontend**: `http://localhost:5173`

---

## 🎯 How to Test the End-to-End Interview Flow

1. Open **`http://localhost:5173/`** to view the live Candidate Leaderboard on the landing page.
2. Click **Launch Platform** / **Sign In** to log into the unified recruitment dashboard.
3. Open **`http://localhost:8000/dashboard`** to input custom questions with expected answers and click **Start Process (Send WhatsApp)**.
4. Open the generated candidate scheduling link **`http://localhost:8000/schedule/{candidate_id}`**.
5. Click **Call Me Now** to launch the real-time AI voice interview call and post-call 0–100 Ollama evaluation.
