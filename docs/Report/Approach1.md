# Chapter 3: Approach I — RAG-Based Curriculum Architecture

---

## 3.1 Introduction and Motivation

The Personalized Adaptive Learning Mentor (PALM) project set out to build an AI-powered tutoring system for primary school mathematics (Grades 1–5). A fundamental design question at the outset was: *how should the system's teaching content — the curriculum — be stored, retrieved, and presented to the large language model (LLM) agents that generate student-facing responses?*

The initial approach adopted **Retrieval-Augmented Generation (RAG)**, a widely established pattern in LLM application design. In a RAG architecture, source documents are split into smaller text chunks, converted into dense vector embeddings, and stored in a vector database. At inference time, a user's query is embedded using the same model, and the most semantically similar chunks are retrieved via approximate nearest-neighbour search. These retrieved chunks are then injected into the LLM's context window alongside the query, grounding the model's response in factual source material.

The motivation for choosing RAG was straightforward:

1. **Scalability** — RAG scales naturally with curriculum size. Adding new chapters or grades would only require upserting new chunks into the vector database, without modifying application code.
2. **Grounding** — By retrieving relevant chunks at query time, the LLM could be grounded in actual curriculum content, theoretically reducing hallucination.
3. **Dynamic Context** — Rather than loading entire textbooks into the context window, RAG would selectively retrieve only the most relevant passages, keeping token usage manageable.
4. **Industry Precedent** — RAG had been successfully deployed in customer support chatbots, document Q&A systems, and enterprise knowledge bases, making it a natural first choice for an educational application.

This chapter describes the complete RAG-based architecture that was designed, implemented, and tested as the first approach to PALM's curriculum delivery system.

---

## 3.2 System Overview

The first iteration of PALM comprised the following major components:

1. **Curriculum Source Material** — NCERT mathematics textbooks for Grades 1–5, covering subjects such as fractions, geometry, number systems, measurement, and data handling. These textbooks were available as PDF documents.

2. **Chunking Pipeline** — A pre-processing pipeline that parsed the curriculum PDFs, split them into semantically meaningful text chunks, and enriched each chunk with metadata (grade, subject, chapter, section, difficulty level, topic tags).

3. **Embedding Generation** — Each text chunk was converted into a 1536-dimensional dense vector using OpenAI's `text-embedding-ada-002` model.

4. **Pinecone Vector Database** — A serverless vector database (Pinecone, hosted on AWS `us-east-1`) that stored the embedded chunks with their associated metadata, enabling cosine-similarity-based retrieval.

5. **LLM Agents** — A set of specialized LLM agents (orchestrator, dialogue, hint, correction, engagement, encouragement) that used the retrieved chunks as their knowledge base for generating pedagogically appropriate responses.

6. **LangGraph Orchestration** — A graph-based agent orchestration framework (LangGraph) that managed the flow of control between agents, determining which agents to invoke based on the student's current state.

The high-level data flow was:

```
Student Message
      │
      ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Embed Query │────▶│  Pinecone Search  │────▶│  Top-K Chunks│
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                    Student State ─────────▶│  LLM Agents    │
                                            │  (with chunks  │
                                            │   in context)  │
                                            └───────┬────────┘
                                                    │
                                                    ▼
                                              Tutor Response
```

---

## 3.3 Architecture Design

### 3.3.1 Curriculum Data Model

The curriculum was modelled as a hierarchy of documents:

| Level | Description | Example |
|-------|-------------|---------|
| **Grade** | Academic year (1–5) | Grade 4 |
| **Subject** | Mathematics (single subject) | Mathematics |
| **Chapter** | A thematic unit within a grade | Chapter 10: Symmetry |
| **Section** | A sub-topic within a chapter | Lines of Symmetry |
| **Chunk** | An atomic text passage (200–500 tokens) | "A line of symmetry divides a shape into two halves that are mirror images..." |

### 3.3.2 Vector Database Schema

Each vector in the Pinecone index carried the following metadata alongside its 1536-dimensional embedding:

```json
{
  "id": "chunk_id",
  "values": [0.012, -0.034, ...],   // 1536-dim embedding
  "metadata": {
    "text": "The actual chunk text (up to 1500 chars)",
    "chunk_type": "explanation | example | exercise | definition",
    "grade": 4,
    "subject": "Mathematics",
    "chapter_id": "ch10",
    "topic": "Symmetry",
    "section_title": "Lines of Symmetry",
    "difficulty": 1,
    "topic_tags": "symmetry,geometry,shapes",
    "page_range": "pp. 45-47",
    "source_file": "grade4_math.pdf"
  }
}
```

### 3.3.3 Retrieval Strategy

At query time, the retrieval pipeline operated as follows:

1. **Query Embedding** — The student's message was embedded using the same `text-embedding-ada-002` model.
2. **Metadata Filtering** — The Pinecone query applied a metadata filter to restrict results to the student's current grade (e.g., `grade == 4`).
3. **Top-K Retrieval** — The top 5 most similar chunks (by cosine similarity) were retrieved.
4. **Context Injection** — The retrieved chunks were concatenated and injected into the LLM agents' system prompts as the "curriculum context" for generating responses.

### 3.3.4 Agent Architecture (LangGraph)

The agent orchestration in this first approach used **LangGraph**, a graph-based framework for building stateful, multi-agent LLM applications. The orchestration graph defined:

- **Nodes** — Each agent (orchestrator, hint, correction, engagement, encouragement, dialogue) was a node in the graph.
- **Edges** — Conditional edges determined the flow between agents based on the orchestrator's decision.
- **State** — A shared `TypedDict` state object was passed through the graph, with each agent reading from and writing to it.

The non-deterministic nature of the graph meant that the execution path could vary from turn to turn, depending on which edges the orchestrator chose to traverse.

---

## 3.4 Curriculum Pipeline: Chunking and Upsertion into Pinecone

### 3.4.1 PDF Parsing and Text Extraction

The curriculum PDFs were processed using a multi-stage pipeline:

1. **PDF-to-Text Extraction** — Raw text was extracted from the NCERT PDF files, preserving paragraph boundaries and section headings where possible.
2. **Section Identification** — Heading patterns (font size, bold text, numbering) were used to identify chapter and section boundaries.
3. **Chunk Generation** — Each section was split into chunks of 200–500 tokens using a recursive text splitter that respected sentence boundaries to avoid mid-sentence splits.

### 3.4.2 Metadata Enrichment

Each chunk was enriched with structured metadata:

- **Grade and Subject** — Inferred from the source PDF filename and directory structure.
- **Chapter ID and Topic** — Extracted from the section heading hierarchy.
- **Chunk Type** — Classified as `explanation`, `example`, `exercise`, or `definition` based on heuristic rules (e.g., presence of "Example:", numbered exercises, "Definition:" prefixes).
- **Difficulty Level** — Assigned an integer difficulty (1–3) based on the section's position within the chapter (introductory sections = 1, advanced = 3).
- **Topic Tags** — A comma-separated list of relevant mathematical concepts for secondary filtering.

### 3.4.3 Embedding and Upsertion

The embedding and upsertion process was implemented in `scripts/upsert-pinecone.py`:

1. **Embedding** — Each chunk's text was passed through OpenAI's `text-embedding-ada-002` to produce a 1536-dimensional dense vector.
2. **Pinecone Index Creation** — A serverless Pinecone index named `palm-fyp` was created with cosine similarity metric and 1536 dimensions, hosted on AWS `us-east-1`.
3. **Batch Upsertion** — Chunks were upserted in batches of 100, with rate-limiting delays between batches to avoid API throttling.
4. **Validation** — After upsertion, index statistics were queried to verify the total vector count matched expectations.

The Pinecone index configuration:

| Parameter | Value |
|-----------|-------|
| Index Name | `palm-fyp` |
| Dimensions | 1536 |
| Metric | Cosine Similarity |
| Cloud Provider | AWS |
| Region | `us-east-1` |
| Spec | Serverless |

---

## 3.5 LLM Validation Layer

To mitigate potential retrieval errors, an LLM validation layer was introduced between the retrieval step and the agent pipeline:

1. **Relevance Check** — After retrieving the top-K chunks, a lightweight LLM call assessed whether the retrieved chunks were actually relevant to the student's current topic and question.
2. **Chunk Re-ranking** — Chunks deemed irrelevant or tangential were deprioritized, and the remaining chunks were re-ordered by pedagogical relevance (e.g., prioritizing explanations over exercises when the student was confused).
3. **Fallback** — If no sufficiently relevant chunks were found (similarity score below a threshold), the system would fall back to a general prompt instructing the LLM to acknowledge the limitation rather than fabricate content.

Despite this validation layer, the fundamental issues described in Section 3.6 persisted, as the problems were rooted in the retrieval mechanism itself rather than in post-retrieval filtering.

---

## 3.6 Limitations Observed in Practice

During development and testing, three critical failure modes were identified that fundamentally undermined the effectiveness of the RAG-based approach for structured curriculum delivery.

### 3.6.1 Cross-Chapter Chunk Retrieval Problem

**The Problem:** Cosine similarity search operates on semantic similarity alone, without understanding the pedagogical structure of a curriculum. When a student asked about "fractions" while studying Chapter 5 (Introduction to Fractions), the retrieval engine would frequently pull chunks from:

- **Chapter 7** (Fractions — Advanced Operations) — containing multiplication and division of fractions, which are above the student's current learning level.
- **Chapter 12** (Decimals) — which discusses fractions in the context of decimal conversion, introducing unrelated concepts.
- **Chapter 3** (Measurement) — which mentions fractions in the context of measuring lengths ("half a metre"), a completely different pedagogical context.

This cross-chapter contamination occurred because the word "fraction" has high semantic similarity across all these chapters, and the embedding model could not distinguish between *the same mathematical term used in different pedagogical contexts*.

**Observed Impact:** In testing, approximately 30–40% of retrieved chunks originated from chapters other than the one the student was currently studying. Even with metadata filtering by grade, chunks from different chapters within the same grade were freely mixed.

**Example:**
- **Student's current chapter:** Chapter 5 — Understanding Fractions (Grade 4)
- **Student's message:** "I don't understand what a numerator is"
- **Retrieved chunks included:**
  - ✅ Chapter 5, Section 1: "The numerator is the top number in a fraction..."
  - ❌ Chapter 7, Section 3: "When multiplying fractions, multiply the numerators together..."
  - ❌ Chapter 12, Section 2: "To convert a fraction to a decimal, divide the numerator by..."
  - ❌ Chapter 5, Section 4: "Comparing fractions with unlike denominators..." (correct chapter, but advanced section)

The LLM, receiving all these chunks in its context, would blend concepts from multiple modules into a single response — introducing fraction multiplication to a student who had not yet grasped what a numerator means.

### 3.6.2 Loss of Pedagogical Context

**The Problem:** RAG retrieval is fundamentally *query-driven* — it retrieves content based on what the student asks, not based on *where the student is in the curriculum*. This creates a disconnect between the retrieved content and the student's learning trajectory.

In a well-designed curriculum, concepts are presented in a deliberate sequence: prerequisites are taught before dependent concepts, examples build in complexity, and misconceptions are addressed at specific stages. RAG retrieval ignores this sequential structure entirely.

**Specific failures observed:**

1. **Prerequisite violation** — The system would retrieve and present content that depended on concepts the student had not yet been taught. For example, retrieving content about "equivalent fractions" when the student was still learning "parts of a whole."

2. **Example mismatch** — Retrieved examples were often from a different difficulty level than the student's current section. A student working on introductory exercises would receive worked examples from advanced sections, creating confusion rather than clarity.

3. **Hint incoherence** — The hint progression (conceptual hint → procedural hint → near-answer) requires that all three hints refer to the *same* problem and concept. With RAG, hints were drawn from different chunks and often addressed different aspects of the topic, breaking the pedagogical scaffolding.

4. **Loss of "what has been taught"** — The retrieval engine had no awareness of which concepts the tutor had already explained in the current session. It might re-retrieve and re-explain the same introductory chunk multiple times, or skip ahead to advanced content without building on prior explanations.

### 3.6.3 Hallucination and Off-Curriculum Drift

**The Problem:** When the retrieved chunks did not precisely answer the student's question — a common occurrence given the retrieval issues described above — the LLM would fill the gaps by generating content from its parametric knowledge. This led to two forms of hallucination:

1. **Curriculum Hallucination** — The LLM would introduce mathematical concepts, rules, or terminology not present in the NCERT curriculum for the student's grade. For example:
   - Introducing the concept of "improper fractions" to a Grade 3 student studying basic fractions.
   - Using algebraic notation (`x`, `y`, variables) to explain arithmetic to Grade 4 students.
   - Mentioning "infinite lines of symmetry" (a Grade 8+ concept) when teaching basic symmetry to Grade 4 students.

2. **Example Fabrication** — When the retrieved chunks lacked sufficient worked examples, the LLM would invent its own. These invented examples were sometimes mathematically incorrect, used inappropriate difficulty levels, or introduced notations the student had never seen.

3. **Off-Curriculum Drift** — Over multiple turns, the conversation would gradually drift away from the curriculum section. The LLM, responding to the student's follow-up questions with its general knowledge rather than curriculum-grounded content, would lead the session into topics not covered by the NCERT syllabus at all.

**Quantitative Evidence from Later Evaluation:**
When the final system (Approach II) was evaluated using the LLM-as-a-Judge framework, even the structured curriculum approach scored only 2/10 on Faithfulness for certain personas. The RAG approach, which lacked even the structured grounding of the final system, exhibited significantly worse hallucination rates during its testing phase — estimated at over 50% of tutor responses containing at least one claim not traceable to the curriculum source material.

---

## 3.7 Rationale for Pivoting Away from RAG

The decision to abandon the RAG-based approach was driven by the fundamental realization that **educational tutoring is not a retrieval problem — it is a structured delivery problem**.

### 3.7.1 Why RAG Fails for Curriculum Delivery

RAG was designed for *information retrieval* scenarios (e.g., "find me the answer to this question from a large corpus"), not for *structured pedagogical delivery* (e.g., "teach this specific concept to this student at this level, in this order, with these examples").

The core mismatch can be summarized as follows:

| Requirement | RAG's Approach | Curriculum's Need |
|-------------|---------------|------------------|
| **Content Selection** | Semantic similarity to query | Position in learning sequence |
| **Scope** | Entire corpus is searchable | Only current section should be visible |
| **Ordering** | Relevance-ranked | Prerequisite-ordered |
| **Completeness** | Best-match fragments | Complete section with explanation + examples + hints + quiz |
| **Boundary** | Fuzzy (similar content from anywhere) | Strict (only this chapter, this section, this difficulty level) |
| **Statefulness** | Stateless (each query is independent) | Stateful (depends on what was taught before) |

### 3.7.2 The Structured Alternative

The analysis of RAG's failures pointed directly toward an alternative: instead of *retrieving* curriculum content at query time, **pre-structure the entire curriculum as a relational database** where each section is a self-contained unit containing everything an agent needs to teach it:

- A focused explanation (2–4 sentences)
- Worked examples (3 per section)
- Common misconceptions (2–3 per section)
- A three-stage hint progression (vague → procedural → near-complete)
- Quiz questions with answers and explanations

This structure would be loaded deterministically by a *Section Loader* — a simple database read that loads the correct section based on the student's current position in the curriculum, not based on semantic similarity. This eliminates cross-chapter contamination, preserves pedagogical ordering, and provides complete context for every agent.

This alternative became the foundation for **Approach II** (Chapter 4).

### 3.7.3 Additional Factors

Beyond the core technical limitations, several practical factors reinforced the decision to pivot:

1. **Pinecone Operational Cost** — The serverless Pinecone instance incurred costs proportional to storage and query volume. For a student-facing application, the ongoing vector database hosting cost was an unnecessary operational burden when a simpler PostgreSQL-based approach could serve the same purpose at near-zero marginal cost.

2. **Embedding Latency** — Each student message required an embedding API call before retrieval could begin, adding 200–500ms of latency to every turn. In the final system, the Section Loader achieves the same result with a sub-100ms database read.

3. **LangGraph Complexity** — The non-deterministic graph-based orchestration made debugging difficult. When the tutor produced an incorrect response, tracing the execution path through the graph to identify which agent was responsible was complex and time-consuming. The pivot to a deterministic 13-step linear pipeline (Approach II) made the system fully traceable.

---

## 3.8 Summary

The RAG-based curriculum architecture (Approach I) represented the initial attempt to ground PALM's LLM agents in curriculum content using industry-standard retrieval-augmented generation techniques. The system was fully implemented, including a Pinecone vector database with 1536-dimensional OpenAI embeddings, a metadata-enriched chunking pipeline, and LangGraph-based agent orchestration.

However, extensive testing revealed three critical limitations that were inherent to the RAG paradigm when applied to structured educational content delivery:

1. **Cross-chapter chunk retrieval** contaminated the teaching context with content from unrelated modules, causing the tutor to prematurely introduce advanced concepts.
2. **Loss of pedagogical context** disconnected the retrieved content from the student's position in the learning sequence, breaking prerequisite chains and hint progressions.
3. **Hallucination and off-curriculum drift** caused the LLM to supplement incomplete retrieved context with fabricated content not present in the curriculum.

These failures were not implementation bugs — they were fundamental mismatches between RAG's query-driven, stateless retrieval paradigm and the structured, stateful, sequence-dependent nature of curriculum delivery. This realization motivated the complete architectural pivot to a structured PostgreSQL-based curriculum with deterministic section loading, which is described in **Chapter 4: Approach II**.

---

| Aspect | Approach I (RAG) | Approach II (Structured) |
|--------|-----------------|------------------------|
| Curriculum Storage | Pinecone Vector DB | PostgreSQL (NeonDB) |
| Content Retrieval | Cosine similarity search | Deterministic section loader |
| Orchestration | LangGraph (non-deterministic) | 13-step linear pipeline |
| Context Scope | Top-K from entire corpus | Current section only |
| Hint Progression | Retrieved from mixed chunks | Pre-authored 3-stage array |
| Cross-Chapter Risk | High (30–40% contamination) | Zero (section-scoped) |
| Hallucination Risk | High (>50% estimated) | Reduced (curriculum-grounded prompts) |
| Query Latency | ~500ms (embed) + ~200ms (search) | ~60ms (DB read) |

---

*This chapter documents the first architectural approach to PALM's curriculum system. The rationale, design, and failure analysis presented here directly informed the design decisions of Approach II, described in the following chapter.*
