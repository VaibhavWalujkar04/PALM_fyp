import { motion } from 'framer-motion'
import MathRenderer from '@/components/math/MathRenderer'

export default function MessageBubble({ message }) {
  const { role, content, type, timestamp, metadata } = message
  const isTutor = role === 'tutor' || role === 'assistant'
  const isSystem = role === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-3"
      >
        <span
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: 'var(--palm-bg-warm)', color: 'var(--palm-text-muted)' }}
        >
          {content}
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 my-2 ${isTutor ? 'justify-start' : 'justify-end'}`}
    >
      {/* Tutor avatar */}
      {isTutor && (
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm mt-1"
          style={{ background: 'var(--palm-violet-light)' }}
        >
          🧠
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${
          isTutor ? 'rounded-tl-md' : 'rounded-tr-md'
        }`}
        style={
          isTutor
            ? {
                background: 'var(--palm-card)',
                color: 'var(--palm-text)',
                border: '1px solid var(--palm-border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }
            : {
                background: 'var(--palm-sky)',
                color: '#fff',
              }
        }
      >
        {/* Content with math rendering */}
        <div className="whitespace-pre-wrap break-words">
          <MathRenderer content={content} />
        </div>

        {/* Metadata badges */}
        {metadata?.agent_used && isTutor && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'var(--palm-violet-light)', color: 'var(--palm-violet)' }}
            >
              {metadata.agent_used.replace('_agent', '')}
            </span>
          </div>
        )}
      </div>

      {/* Timestamp (subtle) */}
      {timestamp && (
        <div className="self-end mb-1 shrink-0 opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-[10px]" style={{ color: 'var(--palm-text-muted)' }}>
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      )}
    </motion.div>
  )
}
