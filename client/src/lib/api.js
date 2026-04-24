const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }

  const res = await fetch(url, config)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || `Request failed: ${res.status}`)
  }

  return res.json()
}

// ── Students ─────────────────────────────────────────────────────────────
export async function createStudent({ name, grade }) {
  return request('/students/', {
    method: 'POST',
    body: JSON.stringify({ name, grade }),
  })
}

export async function getStudent(studentId) {
  return request(`/students/${studentId}`)
}

export async function findStudentByNameGrade(name, grade) {
  // The backend doesn't have a search endpoint yet — we'll use the create
  // endpoint which will return the student. For now, just create a new one.
  return createStudent({ name, grade })
}

// ── Sessions ─────────────────────────────────────────────────────────────
export async function createSession({ studentId, grade, topic }) {
  return request('/sessions/', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, grade, topic }),
  })
}

export async function getSession(sessionId) {
  return request(`/sessions/${sessionId}`)
}

export async function endSession(sessionId, summary = null) {
  return request(`/sessions/${sessionId}/end`, {
    method: 'PATCH',
    body: summary ? JSON.stringify({ summary }) : null,
  })
}

// ── Mastery ──────────────────────────────────────────────────────────────
export async function getMastery(studentId) {
  return request(`/mastery/${studentId}`)
}

// ── Curriculum ───────────────────────────────────────────────────────────
export async function getTopics(grade) {
  return request(`/curriculum/topics?grade=${grade}`)
}

export async function getNextTopic(studentId) {
  return request(`/curriculum/next?student_id=${studentId}`)
}

// ── Chat (test endpoint) ─────────────────────────────────────────────────
export async function testChat({ message, grade, topic }) {
  return request('/chat/test', {
    method: 'POST',
    body: JSON.stringify({ message, grade, topic }),
  })
}
