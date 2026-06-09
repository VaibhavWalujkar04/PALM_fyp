# 🧠 PALM — Personalized Adaptive Learning Mentor

**PALM** is a multimodal, multi-agent AI tutoring system designed for primary school students (Grade 5) in core mathematics. It combines real-time computer-vision-based affective state recognition (emotion + gaze tracking), a multi-agent cognitive engine, and curriculum-grounded instruction to deliver truly adaptive, one-on-one learning experiences.

---

## ✨ Key Features

- **Real-Time Emotion & Gaze Detection** — Client-side MediaPipe FaceLandmarker classifies student emotions (confident, confused, bored, frustrated, neutral) and gaze state (focused, looking away) directly in the browser. No video frames leave the device.
- **Multi-Agent Orchestration** — A blackboard-architecture pipeline routes each student interaction through specialized agents (Dialogue, Mastery, Hint, Quiz, Engagement, Encouragement, Correction) orchestrated by an LLM-based router.
- **Curriculum-Grounded Content** — All instructional content is served from structured chapter notes stored in PostgreSQL — not hallucinated. A RAG pipeline with Pinecone provides supplementary retrieval.
- **Adaptive Feedback Loops** — Three non-linear feedback loops (Struggle, Boredom, Mastery) dynamically adjust lesson difficulty, pacing, and engagement strategies in real time.
- **Speech I/O** — Browser-native speech recognition for student input and text-to-speech for tutor responses, creating a natural conversational experience.
- **Progress Tracking & Mastery** — Per-concept mastery scores, section-level status tracking, and visual progress dashboards give students and educators clear learning insights.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                         │
│   Webcam ──► MediaPipe FaceLandmarker (in-browser)          │
│              Emotion + Gaze → JSON (~100 bytes/sec)         │
│   Microphone ──► Speech Recognition                         │
│   UI: Dashboard · Session · Progress                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ WebSocket + REST
┌───────────────────────▼─────────────────────────────────────┐
│                   SERVER (FastAPI)                           │
│   Perception Receiver → State Builder → Orchestrator        │
│   ├── Dialogue Agent    ├── Hint Agent                      │
│   ├── Mastery Agent     ├── Quiz Agent                      │
│   ├── Engagement Agent  ├── Correction Agent                │
│   └── Encouragement Agent                                   │
│   RAG Pipeline (Pinecone) · Response Validators             │
│   LLM via FastRouter · TTS via FastRouter                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              NeonDB (Serverless PostgreSQL)                  │
│   Students · Sessions · Mastery Scores · Curriculum         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts, Zustand |
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy (async), Alembic, Pydantic |
| **Database** | NeonDB (serverless PostgreSQL) via asyncpg |
| **Vector DB** | Pinecone (RAG retrieval for curriculum embeddings) |
| **LLM / AI** | FastRouter (unified LLM, embeddings, STT, TTS routing) |
| **Perception** | MediaPipe FaceLandmarker (client-side emotion + gaze) |
| **Auth** | JWT (PyJWT) |
| **Observability** | LangSmith tracing |

---

## 📁 Project Structure

```
PALM_fyp/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # UI components (shadcn/ui, PerceptionHUD, etc.)
│   │   ├── hooks/           # Custom hooks (FaceMesh, Perception, TTS, STT)
│   │   ├── pages/           # Landing, Dashboard, Session, Progress
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # API client & utilities
│   └── package.json
├── server/                  # FastAPI backend
│   ├── app/
│   │   ├── agents/          # Multi-agent system (8 specialized agents)
│   │   ├── api/v1/          # REST routes & WebSocket endpoints
│   │   ├── core/            # Config, constants, logging
│   │   ├── db/              # Database session & init
│   │   ├── integrations/    # FastRouter (LLM, STT, TTS, embeddings)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── orchestrator/    # LangGraph orchestration & state
│   │   ├── pipeline/        # Agent execution pipeline
│   │   ├── rag/             # Pinecone retrieval pipeline
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic services
│   │   ├── state/           # Session context & state management
│   │   ├── validators/      # Response correctness & tone validators
│   │   └── main.py          # FastAPI entrypoint
│   ├── alembic/             # Database migrations
│   └── requirements.txt
├── docs/jsons/              # Structured chapter tutoring notes (curriculum data)
├── scripts/                 # Pinecone seeding & data utilities
├── .env.example             # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.11
- A **NeonDB** PostgreSQL database
- **Pinecone** account (for vector search)
- **FastRouter** API key (for LLM, TTS, STT)

### 1. Clone the Repository

```bash
git clone https://github.com/tanmaymene21/PALM_fyp.git
cd PALM_fyp
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### 3. Start the Backend

```bash
cd server
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API docs will be available at `http://localhost:8000/docs`.

### 4. Start the Frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Overview

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new student |
| `POST` | `/api/v1/auth/login` | Student login |
| `POST` | `/api/v1/sessions` | Start a learning session |
| `GET` | `/api/v1/sessions/{id}` | Get session details |
| `GET` | `/api/v1/mastery/{student_id}` | Get mastery breakdown |
| `GET` | `/api/v1/topics?grade={n}` | List topics for a grade |
| `GET` | `/health` | Health check |

### WebSocket Endpoints

| Path | Description |
|------|-------------|
| `/ws/tutor/{session_id}` | Main tutoring interaction (bidirectional) |
| `/ws/video/{session_id}` | Perception updates (emotion + gaze JSON) |
| `/ws/audio/{session_id}` | Audio streaming |

---

## 🤖 Multi-Agent System

PALM uses a **blackboard-architecture** where a shared state object flows through a pipeline of specialized agents each turn:

| Agent | Type | Role |
|-------|------|------|
| **Orchestrator** | LLM | Routes to appropriate agents based on emotion, gaze, correctness, and mastery |
| **Dialogue** | LLM | Synthesizes final student-facing response (runs every turn) |
| **Mastery** | LLM | Evaluates understanding and updates mastery scores (runs every turn) |
| **Hint** | Rule-based | Delivers progressive 3-tier hints from curriculum |
| **Quiz** | Rule-based | Generates formative assessment questions |
| **Correction** | LLM | Addresses specific misconceptions without revealing answers |
| **Engagement** | LLM | Re-engages distracted or bored students |
| **Encouragement** | LLM | Provides emotional support for frustrated students |

---

## 👥 Team

| Name |
|------|
| **Tanmay Mene** |
| **Vaibhav Walujkar** |
| **Mithilesh Singh** |
| **Atharva Humane** |

---

## 📄 License

This project was developed as a Final Year Project (FYP) at university. All rights reserved.
