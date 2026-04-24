import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useSessionStore from '@/store/useSessionStore'
import useUIStore from '@/store/useUIStore'

export default function SessionHeader() {
  const navigate = useNavigate()
  const { currentTopic, sessionStatus } = useSessionStore()
  const { tutorWsStatus } = useUIStore()
  const endSession = useSessionStore((s) => s.endSession)

  const [elapsed, setElapsed] = useState(0)

  // Timer
  useEffect(() => {
    if (sessionStatus !== 'active') return
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStatus])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const statusDot = {
    connected: 'var(--palm-mint)',
    reconnecting: 'var(--palm-amber)',
    disconnected: 'var(--palm-coral)',
  }

  const handleEnd = () => {
    if (window.confirm('End this learning session?')) {
      endSession()
      navigate('/dashboard')
    }
  }

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b"
      style={{ background: 'var(--palm-card)', borderColor: 'var(--palm-border)' }}
    >
      {/* Left — Topic + Grade */}
      <div className="flex items-center gap-2">
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--palm-sky-light)', color: 'var(--palm-sky)' }}
        >
          📚 {currentTopic || 'Math'}
        </span>
        {/* Connection status */}
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: statusDot[tutorWsStatus] || statusDot.disconnected }}
          />
          <span className="text-[10px] font-medium" style={{ color: 'var(--palm-text-muted)' }}>
            {tutorWsStatus === 'connected' ? 'Connected' : tutorWsStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
          </span>
        </span>
      </div>

      {/* Center — Logo */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg palm-gradient-sky flex items-center justify-center">
          <span className="text-sm">🧠</span>
        </div>
        <span className="font-bold text-sm" style={{ color: 'var(--palm-text)' }}>PALM</span>
      </div>

      {/* Right — Timer + End */}
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-sm px-3 py-1 rounded-lg"
          style={{ background: 'var(--palm-bg)', color: 'var(--palm-text-muted)' }}
        >
          {mm}:{ss}
        </span>
        <button
          onClick={handleEnd}
          className="palm-btn-outline px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ borderColor: 'var(--palm-border)', color: 'var(--palm-text-muted)' }}
          aria-label="End session"
        >
          End Session
        </button>
      </div>
    </header>
  )
}
