# Chapter 4: Approach II — Structured Module-Based Architecture (PALM)

---

## 4.1 Introduction

The limitations of Approach I (Chapter 3) — cross-chapter chunk contamination, loss of pedagogical context, and hallucination-induced off-curriculum drift — demonstrated that Retrieval-Augmented Generation is fundamentally misaligned with the requirements of structured curriculum delivery. The core insight was that **educational tutoring is not an information retrieval problem; it is a structured, stateful delivery problem** where the system must teach a specific concept, in a specific order, at a specific difficulty level, using specific examples — and nothing else.

Approach II redesigns PALM from the ground up around this insight. The vector database (Pinecone) is entirely removed and replaced with a relational PostgreSQL database where the curriculum is pre-structured into self-contained teaching units. The non-deterministic LangGraph orchestration is replaced with a deterministic 13-step linear pipeline. And the system is extended from a text-only chatbot into a **multimodal, perception-aware tutoring system** that adapts its teaching strategy in real time based on the student's emotional state and visual attention.

This chapter describes the methodology and architectural approach of the final PALM system. Implementation details are deferred to Chapter 5.

---

## 4.2 System Overview

PALM (Personalized Adaptive Learning Mentor) is a multimodal AI tutoring system for primary school mathematics (Grades 1–5). It operates as a **perception–action cycle**: the system continuously perceives the student's emotional and attentional state through computer vision, and adapts its pedagogical actions accordingly through a pipeline of specialized LLM agents.

The system comprises four major subsystems:

1. **Perception Engine** — Client-side computer vision (MediaPipe FaceLandmarker) that detects the student's facial expressions and gaze direction in real time, classifying emotion and attention state.

2. **Cognitive Engine** — A server-side pipeline of specialized LLM agents, each responsible for a distinct pedagogical function (explaining, hinting, quizzing, correcting, encouraging, re-engaging). A deterministic orchestrator selects which agents to activate each turn based on the student's state.

3. **Curriculum Store** — A PostgreSQL database containing the entire mathematics curriculum decomposed into chapters and sections, where each section is a self-contained teaching unit with explanations, examples, misconceptions, hint progressions, and quiz questions.

4. **Frontend Interface** — A React-based web application providing the tutoring session UI, including real-time perception visualization, text/voice interaction, progress tracking, and a student dashboard.

The key architectural principle is **section-scoped context**: at any given moment, the LLM agents can only see the content of the student's *current* section. They cannot access content from other sections, other chapters, or other grades. This hard boundary eliminates the cross-contamination problem that plagued Approach I.

---

## 4.3 Architecture Design: The Perception–Action Cycle

PALM's architecture is organized around a continuous **perception–action cycle** that mirrors how a human tutor operates: observe the student, interpret their state, decide on a pedagogical strategy, and deliver an appropriate response.

### 4.3.1 The Cycle

```
┌──────────────────────────────────────────────────────────────┐
│                    PERCEPTION–ACTION CYCLE                    │
│                                                              │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │  PERCEIVE │───▶│  INTERPRET   │───▶│     DECIDE       │  │
│   │          │    │              │    │                  │  │
│   │ • Camera  │    │ • Emotion    │    │ • Orchestrator   │  │
│   │ • Micro-  │    │   classify   │    │ • Guardrails     │  │
│   │   phone   │    │ • Gaze track │    │ • Agent select   │  │
│   └──────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                 │            │
│   ┌──────────┐    ┌──────────────┐    ┌────────▼─────────┐  │
│   │ DELIVER  │◀───│  SYNTHESIZE  │◀───│      ACT         │  │
│   │          │    │              │    │                  │  │
│   │ • Stream  │    │ • Dialogue   │    │ • Hint Agent     │  │
│   │ • TTS     │    │   Agent      │    │ • Quiz Agent     │  │
│   │ • UI      │    │ • Final msg  │    │ • Mastery Agent  │  │
│   └──────────┘    └──────────────┘    └──────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.3.2 Perception Phase

The student's webcam feed is processed entirely on the client side using MediaPipe's FaceLandmarker model (WebAssembly). This extracts:

- **52 facial blendshapes** — used to classify the student's emotional state into one of eight categories: `happy`, `sad`, `neutral`, `confused`, `frustrated`, `confident`, `fearful`, `bored`.
- **Iris landmarks** — used to determine gaze direction: `on_screen` (engaged), `off_screen` (distracted), or `closed_eyes`.

Only the classified labels (not raw video data) are transmitted to the server at a rate of 1 Hz via WebSocket, consuming approximately 100 bytes per second — a 500× bandwidth reduction compared to streaming raw video frames.

### 4.3.3 Action Phase

The server's 13-step pipeline processes each student turn by:

1. Assembling the current state from the database (student profile, session context, curriculum progress).
2. Injecting the latest perception signals (emotion, gaze).
3. Loading the current curriculum section content.
4. Running the LLM orchestrator to decide which agents to activate.
5. Executing the selected agents in sequence.
6. Synthesizing all agent outputs into a single student-facing response via the Dialogue Agent.

The response is streamed back to the client word-by-word for a natural conversational feel, and optionally read aloud via text-to-speech.

---

## 4.4 Important Assumptions and Concept Clarifications

### 4.4.1 Target Audience

PALM is designed for primary school students in Grades 1–5 (ages 6–11) studying mathematics under the NCERT curriculum. The system assumes:

- The student has access to a device with a webcam and microphone.
- The student can read and type at a basic level (voice input is supported as an alternative).
- A parent or teacher has created the student's account and selected the appropriate grade level.

### 4.4.2 Curriculum Scope

The system teaches one chapter at a time. A chapter is selected at the start of each session. The system does not support free-form mathematical tutoring outside the pre-structured curriculum — this is a deliberate design constraint that prevents hallucination.

### 4.4.3 Multimodal Input, Unimodal Output

The system receives multimodal input (text/voice + video perception) but produces unimodal output (text, optionally read aloud via TTS). The system does not generate images, diagrams, or visual mathematical content — it uses KaTeX-formatted mathematical expressions within text responses.

### 4.4.4 Blackboard Architecture

PALM uses a **blackboard architecture** where a shared state object (`TurnState`) is the central communication mechanism. Agents do not communicate with each other directly; instead, each agent reads from and writes to the shared state. This ensures:

- **Isolation** — Agents are independently testable and replaceable.
- **Traceability** — Every decision can be traced through the state object.
- **Determinism** — The pipeline execution order is fixed and predictable.

---

## 4.5 System Components Description

### 4.5.1 Cognitive Engine and Specialized Agents

The Cognitive Engine is the core reasoning subsystem, composed of specialized agents that each handle a distinct pedagogical function. The principle of **single responsibility** ensures that each agent is an expert in one aspect of tutoring.

#### Orchestrator

An LLM-based decision-maker that receives the full TurnState — including emotion, gaze, conversation history, mastery status, and curriculum context — and determines the optimal pedagogical strategy for the current turn. It outputs a structured intent specifying:

- **Primary Agent** — The main agent to activate (e.g., `dialogue`, `hint`, `quiz`).
- **Supporting Agents** — Zero or more supplementary agents (e.g., `encouragement` alongside `hint`).
- **Goal** — A plain-text description of what the response should accomplish.
- **Reasoning** — Why this combination was chosen (for logging and debugging).

The orchestrator reasons jointly over all signals — it does not have independent rules for emotion and gaze. This holistic reasoning allows it to distinguish between, for example, a frustrated student who needs encouragement versus a bored student who needs re-engagement, even though both might exhibit similar gaze-away behavior.

#### Dialogue Agent

The **sole producer of student-facing text**. It runs last in every turn, reads the orchestrator's goal and all other agents' outputs, and synthesizes a single, natural-language response. The response must be warm, conversational, grade-appropriate, and free of bullet points or lists. This agent is the only one authorized to write the `final_message` field.

#### Hint Agent

A non-LLM agent that implements a **three-stage hint progression** from the curriculum's pre-authored hints:

1. **Stage 1** — A vague, conceptual hint that points the student in the right direction.
2. **Stage 2** — A more specific, procedural hint that outlines the steps.
3. **Stage 3** — A near-complete hint that leaves only the final answer step for the student.

This progression is deterministic — it reads from a pre-authored array in the curriculum section, avoiding the inconsistency of LLM-generated hints.

#### Quiz Agent

A non-LLM agent that selects the next unasked question from the current section's pre-authored quiz questions. It tracks which questions have already been asked within the session to avoid repetition. When all questions for a section have been asked, it signals the Mastery Agent to evaluate for advancement.

#### Correction Agent

An LLM-based agent activated when the student answers incorrectly. It uses the section's `common_misconceptions` field to identify the likely source of the student's error and provides a targeted correction that addresses the specific mistake without re-explaining the entire concept or revealing the answer.

#### Engagement Agent

An LLM-based agent activated when the student's gaze indicates sustained distraction (off-screen for multiple consecutive turns) or when the emotion classifier detects boredom. It generates a short re-engagement prompt that references the current concept — its goal is attention recovery, not instruction.

#### Encouragement Agent

An LLM-based agent activated when the student's emotion is classified as frustrated or fearful. It acknowledges the difficulty, identifies something specific the student did correctly, and provides emotional support. It is deliberately separated from the Engagement Agent because frustration and boredom require pedagogically different responses.

#### Mastery Agent

A **side-effect agent** that runs unconditionally on every turn but never produces student-facing output. It evaluates the student's understanding based on conversation history, answer correctness, attempt count, and hint usage, then updates the mastery status in the database. When a section reaches `mastered` status, it automatically advances the student to the next section, resets counters, and recomputes completion percentage.

#### Summary Agent

An LLM-based agent that maintains a compressed session summary (under 80 words) capturing the episodic context of the current session. It is regenerated periodically (every 5 turns or on section change) to ensure the LLM agents have awareness of what has already been taught without needing the full conversation history.

#### Answer Checker

An LLM-based evaluator that determines whether the student's response correctly answers the current quiz question. It handles the inherent ambiguity of natural language answers from children (e.g., "its 4 i think?" should be marked correct if 4 is the answer).

### 4.5.2 Perception Engine (Emotion and Gaze)

The Perception Engine provides the multimodal awareness that distinguishes PALM from a standard chatbot. It operates entirely on the client side, avoiding the latency and bandwidth costs of server-side video processing.

#### Emotion Classification

The emotion classifier uses MediaPipe FaceLandmarker's **52 facial blendshapes** — normalized floating-point values (0.0–1.0) representing the activation of specific facial muscle groups (Action Units). A threshold-based classification system maps combinations of blendshapes to eight emotion categories:

| Emotion | Key Blendshape Indicators |
|---------|--------------------------|
| Happy | `mouthSmileLeft/Right` > threshold |
| Sad | `mouthFrownLeft/Right` > threshold |
| Confused | `browInnerUp` + `mouthPucker` combined |
| Frustrated | `browDownLeft/Right` + `jawOpen` combined |
| Fearful | `browInnerUp` + `eyeWideLeft/Right` combined |
| Bored | `eyeSquintLeft/Right` + low overall activation |
| Confident | `mouthSmileLeft/Right` + `chinRaiser` combined |
| Neutral | Default when no other threshold is met |

This approach avoids the need for a trained neural network classifier while still providing pedagogically useful emotion signals.

#### Gaze Tracking

Gaze direction is determined using MediaPipe's **iris landmark tracking**. The horizontal position of the iris relative to the eye corners determines whether the student is looking at the screen (`on_screen`), looking away (`off_screen`), or has their eyes closed (`closed_eyes`).

A **Gaze Duration Tracker** (server-side) monitors contiguous off-screen gaze duration using monotonic timestamps. When the student has been looking away for more than 3 seconds, a `gaze_away_flag` is set, enabling the pipeline's guardrail system to trigger re-engagement interventions.

#### Change Detection

A **Change Detector** service filters perception updates to avoid triggering downstream systems on every noisy frame. Only meaningful changes are propagated:

- **Emotion change** — The label differs, or the confidence delta exceeds 0.2.
- **Gaze change** — The gaze state string differs.

This prevents the pipeline from reacting to transient facial movements (e.g., a momentary blink being misclassified as `closed_eyes`).

### 4.5.3 Adaptive Feedback Loops (Struggle, Boredom, Mastery)

PALM implements three distinct adaptive feedback loops that respond to different student states:

#### Struggle Loop

When the student repeatedly answers incorrectly (attempt count ≥ 3 or hint count ≥ 3), the section status transitions to `struggling`. The orchestrator detects this and shifts strategy from questioning to direct explanation, using the section's `explanation` field. The Correction Agent addresses specific misconceptions, and the Encouragement Agent provides emotional support. This loop prevents the student from becoming trapped in an unproductive cycle of wrong answers.

#### Boredom/Distraction Loop

When the perception engine detects sustained gaze aversion (≥ 2 consecutive turns) or boredom emotion, a **hard guardrail** overrides the orchestrator's intent and prepends the Engagement Agent to the execution list. This guardrail operates *after* the orchestrator returns, ensuring that re-engagement happens regardless of the orchestrator's decision. The Engagement Agent generates a short, attention-recovering prompt related to the current concept.

#### Mastery Loop

When the student demonstrates understanding — answering quiz questions correctly with minimal hints and few attempts — the Mastery Agent advances the section status to `mastered`. This triggers automatic progression to the next section, counter resets, and a congratulatory acknowledgment from the Dialogue Agent. If all sections in a chapter are mastered, a chapter completion event is triggered.

---

## 4.6 Curriculum Design: Chapter → Section Decomposition

The curriculum design is the foundation of Approach II's solution to the hallucination problem. Instead of storing curriculum content as unstructured text chunks in a vector database, the entire curriculum is decomposed into a strict two-level hierarchy: **Chapters** and **Sections**.

### 4.6.1 Chapter

A chapter represents a thematic unit within a grade (e.g., "Fractions", "Symmetry", "Measurement"). Each chapter record contains:

- **Chapter ID** — Unique integer identifier.
- **Chapter Name** — Human-readable title.
- **Grade** — The grade level (1–5) this chapter belongs to.
- **Subject** — Always "Mathematics" in the current implementation.
- **Section IDs** — An ordered array defining the teaching sequence.

### 4.6.2 Section

A section is a **self-contained teaching unit** — the atomic unit of instruction. Each section contains everything the LLM agents need to teach one concept, and nothing more:

| Field | Purpose | Example |
|-------|---------|---------|
| `section_id` | Unique identifier (e.g., `10-1`) | `10-1` |
| `concept` | Snake_case concept name | `reflection_symmetry_and_lines_of_symmetry` |
| `title` | Human-readable title | "Reflection Symmetry and Lines of Symmetry" |
| `difficulty` | Difficulty tier | `intro` / `intermediate` / `advanced` |
| `prerequisite_concepts` | Concepts that must be mastered first | `["basic_shapes"]` |
| `explanation` | Core teaching content (2–4 sentences) | "A line of symmetry divides a shape into two halves that are mirror images..." |
| `examples` | 3 worked examples | `["A butterfly has one vertical line of symmetry...", ...]` |
| `common_misconceptions` | 2–3 typical student errors | `["Students confuse rotational symmetry with reflection symmetry"]` |
| `hint_progression` | Exactly 3 hints, vague → near-complete | `["Think about folding...", "What happens when you fold along the middle?", "If you fold the shape in half vertically, do both sides match?"]` |
| `quiz_questions` | Array of `{question, answer, explanation}` | `[{"question": "How many lines of symmetry does a square have?", "answer": "4", "explanation": "..."}]` |

### 4.6.3 Why This Structure Eliminates Hallucination

The section-scoped approach solves each of the three RAG failures identified in Chapter 3:

| RAG Problem | Structured Solution |
|-------------|-------------------|
| **Cross-chapter contamination** | The Section Loader loads *only* the current section. Content from other sections, chapters, or grades is never in the LLM's context. |
| **Loss of pedagogical context** | The section's `prerequisite_concepts`, `difficulty`, and `order` fields preserve the curriculum's teaching sequence. |
| **Hallucination from incomplete context** | Each section contains *complete* teaching material (explanation + examples + misconceptions + hints + quizzes). The LLM never needs to fill gaps from parametric knowledge. |

---

## 4.7 Data Flow and the 13-Step Linear Pipeline

Every student interaction is processed through a **deterministic 13-step linear pipeline** that replaces the non-deterministic LangGraph orchestration of Approach I. The pipeline executes in the same order every turn, ensuring full traceability and predictable behavior.

### The 13 Steps

| Step | Name | Type | Description |
|------|------|------|-------------|
| 1 | **State Assembly** | DB Read | Load student, session, and progress records; assemble the TurnState object |
| 2 | **Message Append** | In-Memory | Append student message to `last_10_messages`, trim to 10 |
| 3 | **Section Loader** | DB Read | Load current section's full content into `current_section` |
| 4 | **Summary Check** | LLM (conditional) | Regenerate session summary if turn is a multiple of 5 or section changed |
| 5 | **Answer Checker** | LLM (conditional) | If a quiz question is pending, evaluate the student's answer |
| 6 | **Orchestrator** | LLM | Determine which agents to activate; output structured intent |
| 7 | **Guardrails** | Rule-Based | Apply hard overrides (e.g., force engagement agent if gaze away ≥ 2 turns) |
| 8 | **Agent Execution** | Mixed | Run selected agents in order; each writes to `agent_outputs` |
| 9 | **Mastery Agent** | LLM | Run unconditionally; evaluate and update mastery status in DB |
| 10 | **Dialogue Agent** | LLM | Synthesize all agent outputs into a single student-facing `final_message` |
| 11 | **Message Persist** | DB Write | Append tutor message to history, trim to 10; update turn count |
| 12 | **State Cleanup** | In-Memory | Clear all `agent_outputs` values to null |
| 13 | **Return** | — | Return `final_message` to the WebSocket for streaming |

### Key Design Properties

- **Deterministic** — Steps always execute in the same order. No conditional branching in the pipeline itself (agent selection is handled *within* step 6, not by the pipeline structure).
- **Stateless between turns** — The TurnState is reassembled from the database at step 1 of every turn. No in-memory state persists between turns except the session context (perception snapshots and transcripts).
- **Single writer** — Only the Dialogue Agent (step 10) writes the `final_message`. All other agents write to intermediate `agent_outputs` fields that are consumed by the Dialogue Agent and then cleared.

---

## 4.8 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Framework** | FastAPI (Python 3.11+) | Async HTTP + WebSocket server |
| **Database** | NeonDB (Serverless PostgreSQL) | Curriculum, student data, session state, mastery tracking |
| **ORM** | SQLAlchemy (async) + asyncpg | Database access with connection pooling |
| **LLM Provider** | OpenAI GPT-4o via FastRouter | All LLM agent calls (orchestrator, dialogue, correction, etc.) |
| **STT (Server)** | Gemini Flash Lite via FastRouter | Server-side speech-to-text transcription |
| **STT (Client)** | Web Speech API | Browser-native speech recognition (fallback) |
| **TTS** | Web Speech API | Client-side text-to-speech |
| **Face Analysis** | MediaPipe FaceLandmarker (WASM) | Client-side emotion + gaze detection |
| **Frontend** | React 19 + Vite | Single-page application |
| **Styling** | Tailwind CSS + shadcn/ui (Radix) | Component library and design system |
| **State Management** | Zustand (with persist) | Client-side auth and session state |
| **Animations** | Framer Motion | UI transitions and micro-interactions |
| **Charts** | Recharts | Progress visualization on dashboard |
| **Authentication** | JWT (PyJWT) + bcrypt | Stateless token-based auth |
| **Migrations** | Alembic | Database schema versioning |
| **Validation** | Pydantic v2 | Request/response schema validation |

---

## 4.9 Database Schema

The database schema replaces the Pinecone vector store with four core relational tables:

### Entity-Relationship Overview

```
┌──────────┐       ┌────────────────┐       ┌─────────────────┐
│ students │──1:N─▶│student_sessions│◀──N:1─│    chapters     │
└────┬─────┘       └────────────────┘       └────────┬────────┘
     │                                                │
     │              ┌─────────────────┐               │
     └──────1:N────▶│student_progress │◀──────N:1─────┘
                    └─────────────────┘
                                            ┌─────────────────┐
                                            │chapter_sections  │
                              chapters──1:N▶│                 │
                                            └─────────────────┘
```

### Table Descriptions

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `students` | Student identity and auth | `id` (UUID), `name`, `email`, `password_hash`, `grade`, `age`, `streak`, `last_login_date` |
| `chapters` | Chapter metadata | `chapter_id`, `chapter_name`, `grade`, `subject`, `section_ids` (ordered array) |
| `chapter_sections` | Self-contained teaching units | `section_id`, `chapter_id`, `order`, `concept`, `title`, `difficulty`, `explanation`, `examples`, `hint_progression`, `quiz_questions`, `common_misconceptions`, `prerequisite_concepts` |
| `student_sessions` | Per-session state | `id` (UUID), `student_id`, `chapter_id`, `turn_count`, `session_summary`, `last_10_messages`, `all_messages`, `asked_questions` |
| `student_progress` | Cross-session mastery tracking | `student_id`, `chapter_id`, `current_section_id`, `section_statuses` (JSONB), `completion_percent`, `was_completed` |

### Section Status Lifecycle

Each section follows a strict forward-only status progression:

```
not_started → introduced → in_progress → struggling → mastered
```

Status **never moves backward**. Once a section is mastered, it remains mastered across all future sessions. This is enforced by the `was_completed` flag at the chapter level, which prevents progress regression even if a student revisits a completed chapter for review.

---

## 4.10 Frontend UI Design

The frontend is structured as a single-page React application with four primary views:

### 4.10.1 Landing Page

The entry point providing authentication (login/register) with form validation. New students provide their name, email, password, and grade level.

### 4.10.2 Dashboard

After login, students see a topic selection grid showing all available chapters for their grade. Each topic card displays the chapter name, section count, and current completion percentage. Selecting a topic creates a new session and navigates to the tutoring interface.

### 4.10.3 Session Interface

The core tutoring view featuring:

- **Chat Panel** — A scrollable conversation thread with the tutor, supporting markdown and KaTeX mathematical rendering.
- **Input Area** — Text input with voice input toggle (speech-to-text via Web Speech API).
- **Perception HUD** — A real-time overlay displaying the student's detected emotion and gaze state, providing transparency about what the system perceives.
- **Subtitle Overlay** — A caption bar showing the tutor's response as it is read aloud via text-to-speech.
- **Progress Indicator** — A completion percentage bar showing progress through the current chapter.

### 4.10.4 Progress Page

A detailed mastery visualization showing per-chapter and per-section progress with interactive charts (Recharts). Students can see which sections they have mastered and which are in progress.

### 4.10.5 Communication Architecture

The frontend communicates with the backend through three concurrent WebSocket connections per session:

| WebSocket | Path | Purpose | Data Rate |
|-----------|------|---------|-----------|
| **Tutor WS** | `/ws/tutor/{session_id}` | Send triggers, receive streamed responses | Per-turn |
| **Video WS** | `/ws/video/{session_id}` | Send perception updates (emotion + gaze) | 1 Hz (~100 B/s) |
| **Audio WS** | `/ws/audio/{session_id}` | Send audio chunks for server-side STT | Continuous during recording |

---

## 4.11 Advantages of the Proposed Architecture over Approach I

| Dimension | Approach I (RAG) | Approach II (Structured) |
|-----------|-----------------|------------------------|
| **Content Retrieval** | Semantic similarity (stateless) | Deterministic section loading (stateful) |
| **Cross-Chapter Risk** | 30–40% contamination rate | Zero — section-scoped by design |
| **Hallucination** | >50% responses with ungrounded claims | Significantly reduced — complete context provided |
| **Orchestration** | LangGraph (non-deterministic graph) | 13-step linear pipeline (deterministic) |
| **Hint Quality** | Retrieved from mixed chunks | Pre-authored 3-stage progression per section |
| **Perception** | None (text-only) | Real-time emotion + gaze classification |
| **Adaptivity** | Query-driven retrieval only | Perception-aware feedback loops (struggle, boredom, mastery) |
| **Traceability** | Difficult (graph execution varies) | Full — every step logged with latencies |
| **Query Latency** | ~700ms (embed + search) | ~60ms (DB read) |
| **Operational Cost** | Pinecone hosting + embedding API calls | PostgreSQL only (near-zero marginal cost) |
| **Curriculum Updates** | Re-embed and re-upsert chunks | Insert/update rows in PostgreSQL |

---

## 4.12 Summary

Approach II fundamentally reimagines PALM's architecture by replacing the query-driven, stateless RAG paradigm with a structured, stateful, perception-aware tutoring system. The key innovations are:

1. **Structured Curriculum Store** — The entire curriculum is pre-decomposed into self-contained sections stored in PostgreSQL. Each section contains complete teaching material (explanation, examples, misconceptions, hints, quizzes), eliminating the need for retrieval and preventing cross-chapter contamination.

2. **Deterministic 13-Step Pipeline** — A linear, fully traceable pipeline replaces the non-deterministic LangGraph orchestration. Every turn executes the same 13 steps in the same order, making the system predictable and debuggable.

3. **Perception–Action Cycle** — Client-side MediaPipe FaceLandmarker provides real-time emotion and gaze classification, enabling adaptive feedback loops that respond to student frustration, boredom, and mastery in real time.

4. **Specialized Agent Architecture** — Eight purpose-built agents, each with a single responsibility, collaborate through a shared blackboard state. Only the Dialogue Agent produces student-facing text; all others contribute intermediate outputs or side effects.

5. **Section-Scoped Context** — The LLM agents' context window contains only the current section's content, the session summary, and the last 10 messages. This bounded, predictable context eliminates hallucination from irrelevant curriculum content and keeps token usage manageable.

This approach resolves all three critical limitations identified in Chapter 3 (cross-chapter contamination, pedagogical context loss, and hallucination), while extending the system's capabilities with multimodal perception and adaptive feedback — capabilities that were not possible under the RAG architecture. The implementation details of this architecture are described in Chapter 5.

---

*This chapter describes the methodology and architectural approach of the PALM system. Implementation details, including code structure, API design, and deployment configuration, are covered in Chapter 5.*
