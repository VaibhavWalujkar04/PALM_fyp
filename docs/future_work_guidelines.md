# PALM Project: Future Work Guidelines

This document outlines the strategic directions and research opportunities for the future development of the PALM (Personalized Adaptive Learning Mentor) system. It is intended to guide future contributors, researchers, and developers working on extending the platform based on the findings from our initial implementation and evaluation.

## 1. Formal User Studies and Empirical Validation
The current implementation has been evaluated using synthetic personas. The next critical phase requires formal ecological validation with real users.
*   **Study Design:** Carry out a well-designed IRB-approved study.
*   **Metrics:** Measure learning gains ($\Delta$ pre/post-test scores), time-on-task, and subjective engagement.
*   **Subjects:** Grade 1-5 students.
*   **Comparisons:** Evaluate PALM against text-only LLM tutor baselines and conventional classroom teaching.
*   **Goal:** Achieve ecological validity and enable direct comparison of our results with Bloom's two-sigma effect (1984).

## 2. Curriculum Generalization Across Grades and Subjects
Currently, PALM is validated on Grade 5 mathematics (Symmetry).
*   **Grade Expansion (Grades 1 to 10):**
    *   Account for age-appropriate perception calibration (blendshape thresholds optimized for 8-11 year olds may not apply to younger or older children).
    *   Adopt grade-based dialogue mechanisms (e.g., playful for Grades K-2, explanatory for Grades 6-8, and analytical for Grades 9-10).
    *   Progressively scale the difficulty level of the vocabulary used by the Dialogue Agent.
*   **Subject Expansion (Science, Language Arts, Social Studies):**
    *   Develop a subject-independent assessment tool within the Mastery Agent, as answer validation in open-ended subjects cannot rely on simple character or math-expression matching.

## 3. Perception Engine Advancement
The current engine uses 52 facial blendshapes for emotion and iris landmarks for gaze. Investigate the following modalities:
*   **Compound Emotion Recognition:** Transform single-label categorization into multiple label recognition (e.g., identifying confusion *and* frustration simultaneously). Develop models for affective progression between turns rather than independent modeling per frame.
*   **Posture and Gesture Analysis:** Use the MediaPipe Pose API to recognize engagement-specific postures/gestures (e.g., leaning forward for interest, slouching for disengagement, head movements indicating agreement or confusion).
*   **Handwriting Recognition:** Add a digital pen input stream, allowing students to work through math problems manually. Enable automatic correction of each solution step for detailed feedback instead of just evaluating the final answer.
*   **Prosodic Analysis:** Analyze vocal characteristics (frequency modulation, speaking speed, pausing) from the audio WebSocket stream to detect uncertainty or cognitive saturation that cannot be inferred from text alone.
*   **Personalized Calibration:** Discard hard-coded blendshape threshold values in favor of personalized tuning based on individual student needs, or use classifiers trained on annotated data covering various lighting conditions and demographics.

## 4. Scalable Cloud Deployment
Address current pipeline latency issues (~44 seconds average) and support concurrent users in a production environment.
*   **Infrastructure:** Migrate to a container-based cloud environment using Docker and Kubernetes running on GKE or EKS.
*   **Observability:** Implement Prometheus and Grafana for robust health monitoring of the agent pipeline.
*   **CI/CD:** Utilize pipelines like GitHub Actions to manage testing and deployment.
*   **Security/Access:** Implement Federated Authentication (OAuth 2.0 via Google/Microsoft) necessary for deployment in educational institutions.

## 5. Multilingual Support and Accessibility
Expand the reach, inclusivity, and usability of PALM.
*   **Languages:** Support Indian regional languages (Hindi, Marathi, Tamil, Bengali). This requires multilingual routing of LLMs, localization of the PostgreSQL educational materials, and language-specific tracking of adopted vocabularies.
*   **Inclusion & Accessibility:** Implement dyslexic fonts, high-contrast modes, flexible speech rate controls for the TTS engine, and robust screen reader support.

## 6. Longitudinal Learning Models and Knowledge Graphs
Move beyond the current single-session memory architecture.
*   **Knowledge Graphs:** Model relationships between mathematical prerequisites across different sessions to provide intelligent remediation (e.g., if a student struggles with fractions, detect and address needs in previously taught division concepts).
*   **Spaced Repetition:** Implement schedules based on forgetting curve models to determine optimal times for the Mastery Agent to re-introduce and revise learned content.

## 7. Open Research Questions
Three fundamental research problems emerge for future academic investigation:
*   **Reinforcement Learning for Tutoring Policy Optimization:** Examine the capability of an RL agent trained on session-level reward signals (Learning Gain, Engagement Time, Emotional Curve) to learn orchestration strategies that are more effective than the current prompt-based LLM approach, especially regarding the exploration/exploitation balance in pedagogy.
*   **Predictive Student Modelling:** Create temporal models to predict *when* a learner will reach a state of frustration or when they are ready for further challenges, enabling proactive learning interventions rather than reactive ones.
*   **Fairness and Bias Auditing:** Systematically test if the combination of blendshape emotion recognition and LLM response generation exhibits performance disparities (in accuracy or tutoring quality) across different demographic groups, lighting situations, and linguistic backgrounds.
