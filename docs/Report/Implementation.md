# Chapter 5: Implementation

---

## 5.1 Introduction

This chapter details the implementation of PALM's structured module-based architecture described in Chapter 4. It covers the development environment, technologies, code organization, and how each system component was built and integrated into the working system.

The implementation follows a client–server architecture: a **React frontend** handles perception capture and user interaction, while a **FastAPI backend** runs the 13-step agent pipeline and manages all data persistence through PostgreSQL.

---

## 5.2 Implementation Environment

| Component | Specification |
|-----------|--------------|
| Operating System | Windows 11 / Linux (deployment) |
| Language (Backend) | Python 3.11+ |
| Language (Frontend) | JavaScript (ES2022+, JSX) |
| Package Manager | pip (backend), npm (frontend) |
| Database Host | NeonDB (Serverless PostgreSQL) |
| LLM API Gateway | FastRouter (OpenAI-compatible endpoint) |
| Version Control | Git + GitHub |
| IDE | VS Code |

**Environment Configuration:** All secrets (database URL, API keys, JWT secret) are loaded from a `.env` file via Pydantic Settings (`app/core/config.py`). The `Settings` class validates required variables at startup and provides typed access throughout the application.

---

## 5.3 Technologies Used

### 5.3.1 Backend Technologies

| Technology | Version | Role in PALM |
|-----------|---------|-------------|
| **FastAPI** | 0.115+ | Async web framework — REST endpoints + WebSocket handlers |
| **SQLAlchemy** | 2.0+ (async) | ORM for all database models and queries |
| **asyncpg** | 0.30+ | PostgreSQL async driver (connection pooling) |
| **Pydantic** | 2.0+ | Data validation for API schemas, TurnState, and config |
| **OpenAI SDK** | 1.0+ | LLM API client (pointed at FastRouter base URL) |
| **PyJWT** | 2.0+ | JWT token creation and verification |
| **bcrypt** | 4.0+ | Password hashing for student authentication |
| **Alembic** | 1.13+ | Database schema migrations |
| **uvicorn** | 0.34+ | ASGI server for running FastAPI |

### 5.3.2 Frontend Technologies

| Technology | Version | Role in PALM |
|-----------|---------|-------------|
| **React** | 19 | UI component framework |
| **Vite** | 8 | Build tool and dev server |
| **React Router** | 7 | Client-side routing (Landing, Dashboard, Session, Progress) |
| **Zustand** | 5+ | Global state management with localStorage persistence |
| **Tailwind CSS** | 4 | Utility-first styling |
| **shadcn/ui (Radix)** | — | Accessible UI component primitives |
| **Framer Motion** | — | Page transitions and micro-animations |
| **Recharts** | — | Progress visualization charts on Dashboard/Progress pages |
| **Lucide React** | — | Icon library |
| **Sonner** | — | Toast notifications |
| **MediaPipe FaceLandmarker** | WASM | Client-side face mesh + blendshape extraction |
| **Web Speech API** | Native | Browser-native STT and TTS |
| **KaTeX** | — | Mathematical expression rendering in chat |

### 5.3.3 External Services

| Service | Purpose |
|---------|---------|
| **NeonDB** | Serverless PostgreSQL hosting (auto-suspend, branching) |
| **FastRouter** | LLM API gateway routing to GPT-4o and Gemini Flash Lite |

---

## 5.4 System Modules Implementation

The codebase is organized into clearly separated modules:

```
server/app/
├── agents/              # 8 specialized LLM/rule-based agents
├── api/v1/
│   ├── routes/          # REST endpoints (auth, sessions, mastery, topics, students)
│   └── websockets/      # 3 WebSocket handlers (tutor, video, audio)
├── core/                # Config, auth (JWT), constants
├── db/                  # Database session factory, connection pool
├── evaluation/          # Turn logger, metrics engine, LLM judge, personas
├── integrations/
│   └── fastrouter/      # LLM, STT, TTS API wrappers
├── models/              # SQLAlchemy ORM models
├── pipeline/            # 13-step runner, TurnState, orchestrator, guardrails
├── schemas/             # Pydantic request/response schemas
└── services/            # Business logic (session context, STT worker, change detector)

client/src/
├── components/          # Reusable UI (PerceptionHUD, SubtitleOverlay, AppShell)
├── hooks/               # Custom hooks (useFaceMesh, usePerceptionStream, useSpeechRecognition, useTextToSpeech)
├── pages/               # Route pages (Landing, Dashboard, Session, ProgressPage)
└── store/               # Zustand store (usePalmStore)
```

### 5.4.1 Agent Module (`server/app/agents/`)

Each agent is implemented as a single Python module with an async entry function:

- **`dialogue_agent.py`** — Receives orchestrator intent + all agent outputs, calls GPT-4o with a system prompt enforcing warm, grade-appropriate prose. Only agent that writes `final_message`.
- **`hint_agent.py`** — Non-LLM. Indexes into `current_section.hint_progression[hint_count]`. Returns pre-authored hint string and increments counter.
- **`quiz_agent.py`** — Non-LLM. Selects next unasked question from `current_section.quiz_questions`, tracking asked questions in `session.asked_questions`.
- **`mastery_agent.py`** — LLM-based. Evaluates understanding from conversation context. Updates `student_progress` in DB. On mastery, advances `current_section_id`, resets counters, recomputes `completion_percent`.
- **`answer_checker.py`** — LLM-based. Compares student message against expected quiz answer. Handles ambiguous child responses ("i think its 4?").
- **`correction_agent.py`** — LLM-based. Uses `common_misconceptions` to identify the student's specific error and generate targeted correction.
- **`engagement_agent.py`** — LLM-based. Generates attention-recovery prompts when gaze is off-screen or emotion is bored.
- **`encouragement_agent.py`** — LLM-based. Provides emotional support when student is frustrated. Identifies something the student did correctly.
- **`summary_agent.py`** — LLM-based. Compresses session history into an 80-word summary every 5 turns or on section change.

### 5.4.2 Pipeline Module (`server/app/pipeline/`)

- **`state.py`** — Defines `TurnState` as a Pydantic model (the shared blackboard). Contains all fields needed across the pipeline: student info, perception signals, curriculum context, orchestrator intent, agent outputs, and pipeline metadata.
- **`runner.py`** — Implements `run_turn_pipeline()` — the 13-step entry point. Assembles state from DB, runs all steps sequentially, persists results, and returns `final_message`.
- **`orchestrator.py`** — LLM call that outputs structured `OrchestratorIntent` JSON (`primary_agent`, `supporting_agents`, `goal`, `reasoning`).
- **`guardrails.py`** — Hard-coded rule overrides applied after the orchestrator. Forces engagement agent when `consecutive_gaze_away >= 2`.

---

## 5.5 User Interface Implementation

### 5.5.1 Landing Page (`Landing.jsx`)

Implements login and registration forms with email/password validation. On successful authentication, the JWT token and student profile are stored in Zustand's persisted store (`usePalmStore`). The store uses `zustand/middleware/persist` with `localStorage` to maintain auth state across browser sessions.

### 5.5.2 Dashboard (`Dashboard.jsx`)

Fetches available chapters via `GET /api/v1/topics?grade={grade}` and renders them as interactive cards. Each card shows chapter name, section count, and a progress bar. Clicking a card calls `POST /api/v1/sessions` to create a new session, then navigates to `/session/{sessionId}`.

### 5.5.3 Session Page (`Session.jsx`, ~51KB)

The largest and most complex component. It manages:

1. **Three WebSocket connections** — Tutor WS (pipeline triggers + streamed responses), Video WS (perception updates at 1Hz), Audio WS (audio chunks for server-side STT).
2. **Perception hooks** — `useFaceMesh()` initializes MediaPipe FaceLandmarker and runs inference on each video frame, extracting 52 blendshapes and iris landmarks. `usePerceptionStream()` throttles updates to 1Hz and sends `{emotion, gaze}` JSON over the Video WS.
3. **Speech hooks** — `useSpeechRecognition()` wraps the Web Speech API for voice input. `useTextToSpeech()` reads tutor responses aloud with subtitle synchronization.
4. **Token streaming** — Tutor responses arrive word-by-word via `{type: "token", payload: {token, done}}` messages. The UI appends each token to the displayed message, creating a typing effect.
5. **KaTeX rendering** — Mathematical expressions in tutor responses (delimited by `$$` or `\(`) are rendered using KaTeX/react-katex.
6. **Response timing** — Measures milliseconds between tutor response completion and next student message, sent as `response_time_ms` in the trigger payload for pipeline analytics.

### 5.5.4 Progress Page (`ProgressPage.jsx`)

Fetches mastery data via `GET /api/v1/mastery/{studentId}` and renders per-chapter progress with Recharts bar/pie charts. Shows section-level status breakdown and supports section reset for review practice.

### 5.5.5 Perception HUD (`PerceptionHUD.jsx`)

A floating overlay component that displays the current detected emotion (with emoji) and gaze state. Provides transparency to the student about what the system perceives, building trust in the adaptive behavior.

---

## 5.6 Backend / Server-Side Implementation

### 5.6.1 Application Entry Point (`main.py`)

The FastAPI application uses a **lifespan context manager** for startup/shutdown:

- **Startup** — Loads `.env` via `dotenv`, logs configuration, verifies database connectivity.
- **Shutdown** — Disposes the SQLAlchemy async engine, closing all connection pool connections.

**Middleware:** CORS middleware allows all origins during development. Routes are mounted under `/api/v1` for REST and at the root for WebSocket endpoints.

### 5.6.2 WebSocket Handlers

**Tutor WebSocket (`tutor_ws.py`):**
1. Accepts connection and creates/loads session context.
2. Waits for `{type: "trigger", payload: {student_id, query, response_time_ms}}` messages.
3. Ensures session and student records exist in DB (auto-creates if needed).
4. Calls `run_turn_pipeline()` with the student message.
5. Streams the response word-by-word with 25ms inter-token delay.
6. Sends `{type: "response_complete"}` with full text, completion percentage, and metadata.

**Video WebSocket (`video_ws.py`):**
1. Receives `{type: "perception_update", emotion, gaze}` at ~1Hz.
2. Updates `SessionContext` (in-memory per-session state).
3. Runs `ChangeDetector` — only propagates meaningful changes (emotion label changed or confidence delta > 0.2).
4. Logs significant changes via `EventLogger`.

**Audio WebSocket (`audio_ws.py`):**
1. Receives base64-encoded audio chunks from the frontend.
2. Decodes and pushes into a bounded async queue (`maxsize=20`).
3. A background `STTWorker` consumer task pulls chunks and transcribes via Gemini Flash Lite.
4. Transcripts are stored in `SessionContext` and acknowledged back to the client.

### 5.6.3 REST API Routes

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/api/v1/auth/register` | POST | `auth.register` | Create student account, return JWT |
| `/api/v1/auth/login` | POST | `auth.login` | Authenticate, update login streak, return JWT |
| `/api/v1/sessions/` | POST | `sessions.create_session` | Start new learning session |
| `/api/v1/sessions/{id}` | GET | `sessions.get_session` | Get session details |
| `/api/v1/sessions/{id}/events` | GET | `sessions.get_session_events` | Paginated chat history |
| `/api/v1/sessions/{id}/end` | PATCH | `sessions.end_session` | End session, compute duration, trigger evaluation |
| `/api/v1/sessions/student/{id}` | GET | `sessions.list_student_sessions` | All sessions for a student |
| `/api/v1/mastery/{student_id}` | GET | `mastery.get_mastery` | Full progress breakdown |
| `/api/v1/mastery/{sid}/{cid}/reset-section` | POST | `mastery.reset_section` | Reset a section for review |
| `/api/v1/topics?grade=N` | GET | `topics.get_topics` | Chapters for a grade |
| `/api/v1/topics/{id}/sections` | GET | `topics.get_chapter_sections` | Sections for a chapter |

### 5.6.4 Services Layer

- **`session_context.py`** — `SessionContext` class: per-session in-memory state holding perception snapshots, transcript entries, and gaze duration tracking. `SessionContextManager` singleton manages all active contexts with auto-eviction of stale sessions (>10 min idle).
- **`change_detector.py`** — Stateful delta tracker that compares incoming perception against last-seen values. Prevents noisy frame-by-frame triggering.
- **`stt_worker.py`** — Per-session async worker with bounded queue. Transcribes audio via Gemini Flash Lite, stores results in SessionContext, sends transcript acks to client.
- **`student_service.py`** — CRUD operations with bcrypt password hashing, login streak tracking (consecutive daily logins).
- **`event_logger.py`** — Lightweight console-level logging for perception events (emotion changes, gaze changes, queries, responses).

### 5.6.5 LLM Integration (`integrations/fastrouter/`)

- **`llm.py`** — Wraps OpenAI SDK's `AsyncOpenAI` client pointed at FastRouter's base URL. Provides `generate_response()` with retry logic (rate limits, transient 5xx errors), token usage tracking, and configurable temperature/max_tokens. Default model: `gpt-4o`.
- **`stt.py`** — Speech-to-text via Gemini Flash Lite. Sends base64-encoded WebM/Opus audio as multimodal content through the chat completions API. Includes minimum audio size check (1KB), retry with backoff, and custom `STTError` exception class.
- **`tts.py`** — Server-side TTS stub (not yet implemented; client-side Web Speech API is used instead).

---

## 5.7 Database Implementation

### 5.7.1 Connection Management (`db/session.py`)

Uses SQLAlchemy's `create_async_engine` with `asyncpg` driver. Key configuration:

- **`pool_recycle=300`** — Recycles connections every 5 minutes to handle NeonDB's idle timeout.
- **`pool_pre_ping=True`** — Validates connections before use.
- **`async_session_factory`** — Returns `AsyncSession` instances via `async_sessionmaker` with `expire_on_commit=False`.

### 5.7.2 ORM Models (`models/`)

**`student.py` — Student model:**
- UUID primary key (server-generated), `name`, `email` (unique), `password_hash`, `grade`, `age`, `streak`, `last_login_date`, timestamps.

**`session.py` — StudentSession model:**
- UUID primary key, foreign keys to `students` and `chapters`. Stores `turn_count`, `session_summary`, `last_10_messages` (JSONB array), `all_messages` (JSONB), `asked_questions` (JSONB), `started_at`, `ended_at`, `duration_seconds`.

**`curriculum.py` — Chapter and ChapterSection models:**
- `Chapter`: integer PK, `chapter_name`, `grade`, `subject`, `section_ids` (JSONB array).
- `ChapterSection`: string PK (`section_id`), FK to chapters, `order`, `concept`, `title`, `difficulty`, `explanation`, `examples` (JSONB), `hint_progression` (JSONB), `quiz_questions` (JSONB), `common_misconceptions` (JSONB), `prerequisite_concepts` (JSONB).

**`mastery.py` — StudentProgress model:**
- Composite PK (`student_id` + `chapter_id`). `current_section_id`, `section_statuses` (JSONB map), `completion_percent`, `was_completed` (boolean flag preventing progress regression).

---

## 5.8 Algorithm and Logic Implementation

### 5.8.1 The 13-Step Pipeline Algorithm

```python
async def run_turn_pipeline(student_id, session_id, student_message, db):
    # Step 1: State Assembly — Load student, session, progress from DB
    state = assemble_turn_state(student_id, session_id, db)

    # Step 2: Message Append — Add student message, trim to 10
    state.last_10_messages.append({"role": "student", "content": student_message})
    trim_to_last_10(state.last_10_messages)

    # Step 3: Section Loader — DB read for current section content
    state.current_section = load_section(state.chapter_progress.current_section_id, db)

    # Step 4: Summary Check — Regenerate if turn % 5 == 0 or section changed
    if needs_summary_regen(state):
        state.session_summary = await summary_agent.run(state)

    # Step 5: Answer Checker — Evaluate if quiz question was pending
    if has_pending_question(state):
        state.last_answer_correct = await answer_checker.run(state)

    # Step 6: Orchestrator — LLM decides which agents to activate
    state.orchestrator_intent = await orchestrator.run(state)

    # Step 7: Guardrails — Hard overrides (e.g., force engagement if gaze away)
    apply_guardrails(state)

    # Step 8: Agent Execution — Run selected agents in order
    for agent_name in get_agents_to_run(state.orchestrator_intent):
        await run_agent(agent_name, state)

    # Step 9: Mastery Agent — Unconditional; updates DB, never writes final_message
    await mastery_agent.run(state, db)

    # Step 10: Dialogue Agent — Synthesize all outputs into final_message
    state.final_message = await dialogue_agent.run(state)

    # Step 11: Message Persist — Save tutor message, update turn count
    state.last_10_messages.append({"role": "tutor", "content": state.final_message})
    persist_session(state, db)

    # Step 12: Cleanup — Clear agent_outputs
    state.agent_outputs = empty_outputs()

    # Step 13: Return
    return state.final_message
```

### 5.8.2 Mastery Advancement Algorithm

The Mastery Agent evaluates section status using this logic:

1. If student answers correctly with ≤1 hint and ≤2 attempts → status = `mastered`
2. If attempt_count ≥ 3 or hint_count ≥ 3 → status = `struggling`
3. If student has attempted questions → status = `in_progress`
4. If section was just loaded → status = `introduced`

On mastery:
- Advance `current_section_id` to next in `chapters.section_ids`
- Set new section status to `introduced`
- Reset `attempt_count` and `hint_count` to 0
- Recompute `completion_percent = mastered_count / total_sections × 100`
- If all sections mastered → set `was_completed = True`

### 5.8.3 Emotion Classification Algorithm

Client-side threshold-based classification on MediaPipe's 52 blendshapes:

```javascript
function classifyEmotion(blendshapes) {
    const smile = (blendshapes.mouthSmileLeft + blendshapes.mouthSmileRight) / 2;
    const frown = (blendshapes.mouthFrownLeft + blendshapes.mouthFrownRight) / 2;
    const browDown = (blendshapes.browDownLeft + blendshapes.browDownRight) / 2;
    const browUp = blendshapes.browInnerUp;
    const eyeWide = (blendshapes.eyeWideLeft + blendshapes.eyeWideRight) / 2;
    const eyeSquint = (blendshapes.eyeSquintLeft + blendshapes.eyeSquintRight) / 2;

    if (smile > 0.5) return browDown > 0.3 ? "confident" : "happy";
    if (frown > 0.4) return browDown > 0.3 ? "frustrated" : "sad";
    if (browUp > 0.4 && eyeWide > 0.3) return "fearful";
    if (browUp > 0.3 && frown > 0.2) return "confused";
    if (eyeSquint > 0.4 && smile < 0.2) return "bored";
    return "neutral";
}
```

### 5.8.4 Gaze Tracking Algorithm

Iris position relative to eye corners determines gaze direction:

```javascript
function classifyGaze(irisLandmarks, eyeCornerLandmarks) {
    const irisX = irisLandmarks.center.x;
    const eyeLeft = eyeCornerLandmarks.left.x;
    const eyeRight = eyeCornerLandmarks.right.x;
    const eyeWidth = eyeRight - eyeLeft;
    const relativePosition = (irisX - eyeLeft) / eyeWidth;

    if (relativePosition < 0.25 || relativePosition > 0.75) return "off_screen";
    if (eyeOpenness < 0.15) return "closed_eyes";
    return "on_screen";
}
```

### 5.8.5 Guardrail Override Logic

```python
def apply_guardrails(state):
    if state.consecutive_gaze_away >= 2:
        if "engagement" not in state.orchestrator_intent.supporting_agents:
            state.orchestrator_intent.supporting_agents.insert(0, "engagement")
```

---

## 5.9 System Integration

### 5.9.1 Frontend ↔ Backend Communication

The frontend establishes three concurrent WebSocket connections per session:

1. **Tutor WS** (`/ws/tutor/{sessionId}?grade=N&topic=T`) — Bidirectional. Client sends trigger messages; server streams token-by-token responses.
2. **Video WS** (`/ws/video/{sessionId}`) — Unidirectional (client → server). Sends `{emotion, gaze}` at 1Hz.
3. **Audio WS** (`/ws/audio/{sessionId}`) — Unidirectional (client → server). Sends base64 audio chunks; receives transcript acknowledgments.

### 5.9.2 Data Flow Integration

```
Client                          Server
──────                          ──────
Camera → MediaPipe → emotion/gaze ──WS──→ SessionContext → TurnState
Microphone → Web Speech API → text ──WS──→ Trigger payload → Pipeline
Microphone → MediaRecorder → audio ──WS──→ STTWorker → SessionContext
                                          Pipeline → final_message
Text ←──WS── token stream ←──────────────┘
TTS ← text
```

### 5.9.3 Authentication Flow

1. Student registers via `POST /api/v1/auth/register` (name, email, password, grade).
2. Server hashes password with bcrypt, creates student record, returns JWT.
3. Frontend stores JWT in Zustand persisted store.
4. Subsequent API calls include JWT in Authorization header (currently optional for WS connections).

---

## 5.10 Verification of Component Functionality

### 5.10.1 Pipeline Verification

The **Turn Logger** (`evaluation/turn_logger.py`) captures a complete JSON snapshot of every pipeline turn, including all state fields, step-level latencies, agent activations, and token usage. This enables post-hoc verification that:

- The correct agents were activated for each turn.
- The orchestrator's reasoning matches the student's state.
- Section advancement occurs at the correct time.

### 5.10.2 Synthetic Testing

The evaluation framework includes 9 LLM-powered student personas that simulate diverse learning behaviors (frustrated, bored, inquisitive, anxious, distracted, impatient, literal-thinking, silent, adversarial). Each persona is a system prompt that generates realistic student responses with emotion and gaze metadata, enabling automated end-to-end testing.

### 5.10.3 LLM-as-a-Judge Verification

An automated qualitative evaluator scores completed sessions on 12 dimensions (Socratic adherence, empathy, age-appropriateness, curriculum grounding, faithfulness, answer relevance, concept leakage, hint progression, tone consistency, off-topic deflection, prompt injection resilience). This provides continuous quality assurance without manual review.

### 5.10.4 Metrics Engine

The `MetricsEngine` computes 30+ quantitative metrics per session: turns-to-mastery, agent activation distribution, student-tutor talk ratio, vocabulary adoption rate, affective volatility, engagement recovery rate, pipeline latency percentiles, math formatting error rate, section bottleneck detection, hint exhaustion rate, and intervention success rate.

---

## 5.11 Challenges Faced During Implementation

### 5.11.1 Pipeline Latency

**Challenge:** The initial pipeline implementation had average latencies of 34–51 seconds per turn, far exceeding interactive thresholds.

**Root Cause:** Multiple sequential LLM calls (orchestrator, mastery agent, dialogue agent, summary agent) each taking 5–18 seconds.

**Mitigation:** Summary regeneration was made conditional (every 5 turns instead of every turn). The answer checker runs only when a quiz question is pending. Step-level latency logging was added for ongoing profiling.

### 5.11.2 NeonDB Connection Timeouts

**Challenge:** PostgreSQL connections would silently die after NeonDB's auto-suspend kicked in (5 minutes of inactivity), causing `ConnectionResetError` on the next query.

**Mitigation:** Configured `pool_recycle=300` and `pool_pre_ping=True` in SQLAlchemy to proactively recycle and validate connections.

### 5.11.3 Perception Bandwidth

**Challenge:** The initial design streamed raw JPEG video frames (320×240, 5 FPS, ~50KB/s) to the server for server-side emotion classification.

**Mitigation:** Moved all perception processing to the client side using MediaPipe FaceLandmarker (WASM). Now only classified labels are sent (~100 bytes/second at 1Hz) — a 500× bandwidth reduction.

### 5.11.4 Hallucination Despite Structured Content

**Challenge:** Even with section-scoped content, the LLM sometimes introduced examples and concepts not present in the section's `explanation` field.

**Evidence:** LLM Judge scored 2/10 on Faithfulness for two personas — the tutor invented examples about "snowflakes having 6 lines of symmetry" and "3D symmetry" not in the curriculum.

**Mitigation:** Ongoing — requires stronger grounding instructions in the dialogue agent's system prompt and potentially a post-generation grounding check.

### 5.11.5 Socratic Method Adherence

**Challenge:** The tutor consistently gave direct answers instead of guiding students through Socratic questioning (scored 3/10 on Socratic Adherence).

**Mitigation:** Ongoing — requires explicit Socratic scaffolding instructions in the orchestrator and dialogue agent prompts.

### 5.11.6 API Rate Limiting in Evaluation

**Challenge:** During batch evaluation (9 personas × 40 turns), 6 of 9 personas failed due to FastRouter API rate limits.

**Mitigation:** Requires implementing exponential backoff and staggered persona execution in future batch runs.

---

## 5.12 Summary

The implementation of PALM translates the structured module-based architecture (Chapter 4) into a working system comprising:

- **~15,000 lines of Python** across 30+ modules implementing the 13-step pipeline, 8 specialized agents, 6 REST routes, 3 WebSocket handlers, and a comprehensive evaluation framework.
- **~5,000 lines of JavaScript/JSX** across 15+ frontend components implementing real-time perception capture, multi-WebSocket communication, token streaming, and an adaptive tutoring interface.
- **5 PostgreSQL tables** storing student profiles, sessions, curriculum sections, and mastery progress with JSONB fields for flexible structured data.
- **3 concurrent WebSocket channels** per session enabling real-time bidirectional communication for tutoring, perception, and audio.

The system successfully demonstrates that a structured, section-scoped curriculum approach eliminates the cross-chapter contamination and context loss problems that plagued the RAG-based Approach I, while the multimodal perception engine enables adaptive feedback loops that a text-only system cannot achieve. Outstanding challenges include pipeline latency optimization, hallucination reduction, and Socratic method improvement, which are documented for future work.

---

*This chapter details the implementation of the PALM system. Evaluation results and analysis are presented in Chapter 6.*
