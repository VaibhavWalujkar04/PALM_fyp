import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import useUIStore from '@/store/useUIStore'

export default function BottomInputBar({ onSend, disabled = false }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const micState = useUIStore((s) => s.micState)

  const handleSubmit = (e) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="sticky bottom-0 z-10 border-t px-4 py-3"
      style={{ background: 'var(--palm-card)', borderColor: 'var(--palm-border)' }}
    >
      {/* Status label */}
      {micState !== 'idle' && (
        <div className="flex justify-center mb-2">
          <span
            className="text-[11px] px-3 py-1 rounded-full font-medium"
            style={{
              background: micState === 'listening' ? 'var(--palm-sky-light)' : 'var(--palm-amber-light)',
              color: micState === 'listening' ? 'var(--palm-sky)' : 'var(--palm-amber)',
            }}
          >
            {micState === 'listening' ? '🎤 Listening...' : '⏳ Processing...'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Mic button */}
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all"
          style={{
            background: micState === 'listening' ? 'var(--palm-sky)' : 'var(--palm-bg)',
            color: micState === 'listening' ? '#fff' : 'var(--palm-text-muted)',
            border: `1px solid ${micState === 'listening' ? 'var(--palm-sky)' : 'var(--palm-border)'}`,
          }}
          aria-label={micState === 'listening' ? 'Stop recording' : 'Start recording'}
          disabled
          title="Voice input coming soon"
        >
          {micState === 'listening' ? (
            <motion.svg
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </motion.svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-full text-sm border transition-all focus:outline-none focus:ring-2"
          style={{
            background: 'var(--palm-bg)',
            borderColor: text ? 'var(--palm-sky)' : 'var(--palm-border)',
            color: 'var(--palm-text)',
            '--tw-ring-color': 'var(--palm-sky)',
          }}
          aria-label="Type your message"
          autoComplete="off"
        />

        {/* Send button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white transition-all disabled:opacity-30"
          style={{ background: text.trim() ? 'var(--palm-sky)' : 'var(--palm-border)' }}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </motion.button>
      </form>
    </div>
  )
}
