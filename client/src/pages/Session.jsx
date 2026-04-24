import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import useStudentStore from '@/store/useStudentStore'
import useSessionStore from '@/store/useSessionStore'
import usePerceptionStore from '@/store/usePerceptionStore'
import useChatStore from '@/store/useChatStore'
import useUIStore from '@/store/useUIStore'
import useWebSocket from '@/hooks/useWebSocket'
import ChatArea from '@/components/chat/ChatArea'
import CelebrationOverlay from '@/components/chat/CelebrationOverlay'
import WebcamPreview from '@/components/perception/WebcamPreview'
import SessionHeader from '@/components/layout/SessionHeader'
import BottomInputBar from '@/components/layout/BottomInputBar'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'

export default function Session() {
  const navigate = useNavigate()
  const { studentId, name, grade } = useStudentStore()
  const { sessionId, currentTopic, masteryScore, sessionStatus } = useSessionStore()
  const emotion = usePerceptionStore((s) => s.emotion)
  const gazeStatus = usePerceptionStore((s) => s.gazeStatus)
  const { addMessage, startStreaming, appendToken, finalizeStream, isStreaming } = useChatStore()
  const { showCelebration, triggerCelebration, setTutorWsStatus, setPerceptionWsStatus, showEngagement } = useUIStore()
  const updateMasteryDelta = useSessionStore((s) => s.updateMasteryDelta)

  const greetingSentRef = useRef(false)
  const perceptionIntervalRef = useRef(null)

  // Redirect if no session
  useEffect(() => {
    if (!studentId || !sessionId) {
      navigate('/dashboard', { replace: true })
    }
  }, [studentId, sessionId, navigate])

  // ── Tutor WebSocket ────────────────────────────────────────────────
  const handleTutorMessage = useCallback((data) => {
    const { type, payload } = data

    switch (type) {
      case 'token':
        if (payload?.done) {
          // Stream complete — finalize will happen on response_complete
        } else if (payload?.token) {
          // If this is the first token, start a streaming message
          if (!useChatStore.getState().isStreaming) {
            useChatStore.getState().startStreaming('tutor')
          }
          useChatStore.getState().appendToken(payload.token)
        }
        break

      case 'response_complete':
        useChatStore.getState().finalizeStream(payload?.full_text, {
          agent_used: payload?.agent_used,
        })
        // Mastery delta
        if (payload?.mastery_delta && payload.mastery_delta !== 0) {
          updateMasteryDelta(payload.mastery_delta)
          if (useSessionStore.getState().masteryScore >= 0.85) {
            triggerCelebration()
          }
        }
        break

      case 'error':
        useChatStore.getState().cancelStream()
        addMessage({
          role: 'system',
          content: 'Oops! Something went wrong. Let\'s try again! 🔄',
        })
        break

      default:
        break
    }
  }, [addMessage, updateMasteryDelta, triggerCelebration])

  const tutorWs = useWebSocket(
    sessionId ? `/ws/tutor/${sessionId}` : null,
    {
      onMessage: handleTutorMessage,
      onStatusChange: setTutorWsStatus,
      autoConnect: !!sessionId,
    }
  )

  // ── Perception WebSocket ───────────────────────────────────────────
  const perceptionWs = useWebSocket(
    sessionId ? `/ws/video/${sessionId}` : null,
    {
      onStatusChange: setPerceptionWsStatus,
      autoConnect: !!sessionId,
    }
  )

  // Send perception updates at max 1/sec
  useEffect(() => {
    if (!sessionId) return
    perceptionIntervalRef.current = setInterval(() => {
      const { emotion, gazeStatus } = usePerceptionStore.getState()
      perceptionWs.send({
        type: 'perception_update',
        emotion,
        gaze: gazeStatus,
        timestamp: Date.now(),
      })
    }, 1000)
    return () => clearInterval(perceptionIntervalRef.current)
  }, [sessionId, perceptionWs])

  // ── Send opening greeting ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !studentId || greetingSentRef.current) return
    if (tutorWs.status !== 'connected') return

    greetingSentRef.current = true
    // Small delay so the UI renders first
    const timer = setTimeout(() => {
      tutorWs.send({
        type: 'trigger',
        payload: {
          student_id: studentId,
          query: `Hi! I'm ${name}. I want to learn about ${currentTopic || 'math'}.`,
        },
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [tutorWs.status, sessionId, studentId, name, currentTopic])

  // ── Handlers ───────────────────────────────────────────────────────
  const handleSend = useCallback((text) => {
    if (!text?.trim() || isStreaming) return

    // Add student message to chat
    addMessage({ role: 'student', content: text })

    // Send trigger to tutor WebSocket
    tutorWs.send({
      type: 'trigger',
      payload: {
        student_id: studentId,
        query: text,
      },
    })
  }, [addMessage, tutorWs, studentId, isStreaming])

  const handleQuizAnswer = useCallback((answer, quizMessage) => {
    handleSend(`My answer is: ${answer}`)
  }, [handleSend])

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(perceptionIntervalRef.current)
      useUIStore.getState().resetUI()
      useChatStore.getState().clearMessages()
      usePerceptionStore.getState().resetPerception()
    }
  }, [])

  if (!studentId || !sessionId) return null

  const masteryPct = Math.round(masteryScore * 100)

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--palm-bg)' }}>
      {/* Celebration overlay */}
      <CelebrationOverlay show={showCelebration} />

      {/* Header */}
      <SessionHeader />

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — Perception & Status (hidden on mobile, 280px on desktop) */}
        <aside
          className="hidden lg:flex flex-col w-[280px] shrink-0 border-r p-4 gap-5 overflow-y-auto"
          style={{ background: 'var(--palm-card)', borderColor: 'var(--palm-border)' }}
        >
          {/* Webcam preview */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--palm-text-muted)' }}>
              Camera
            </h3>
            <WebcamPreview isActive={sessionStatus === 'active'} />
          </div>

          {/* Mastery progress */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--palm-text-muted)' }}>
              {currentTopic || 'Topic'} Mastery
            </h3>
            <div className="palm-card p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--palm-text)' }}>Progress</span>
                <span className="font-bold" style={{ color: masteryPct >= 70 ? 'var(--palm-mint)' : 'var(--palm-sky)' }}>
                  {masteryPct}%
                </span>
              </div>
              <Progress
                value={masteryPct}
                className="h-2.5 rounded-full"
                style={{ background: 'var(--palm-bg)' }}
              />
              <p className="text-[11px]" style={{ color: 'var(--palm-text-muted)' }}>
                {masteryPct >= 85 ? '🌟 Mastered!' : masteryPct >= 50 ? '💪 Keep going!' : '📖 Just getting started'}
              </p>
            </div>
          </div>

          {/* Tutor avatar info */}
          <div className="palm-card p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl animate-palm-float"
              style={{ background: 'var(--palm-violet-light)' }}
            >
              🧠
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--palm-text)' }}>Pal</p>
              <p className="text-[11px]" style={{ color: 'var(--palm-text-muted)' }}>Your Math Buddy</p>
            </div>
          </div>
        </aside>

        {/* Right panel — Chat */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatArea onQuizAnswer={handleQuizAnswer} />
          <BottomInputBar onSend={handleSend} disabled={isStreaming} />
        </main>
      </div>
    </div>
  )
}
