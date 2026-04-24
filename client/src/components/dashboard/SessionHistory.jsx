import { motion } from 'framer-motion'

export default function SessionHistory({ sessions = [] }) {
  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--palm-sky-light)' }}>
          📚
        </div>
        <p className="text-lg font-semibold" style={{ color: 'var(--palm-text)' }}>
          No sessions yet
        </p>
        <p style={{ color: 'var(--palm-text-muted)' }}>
          Start your first learning session from the Topics tab!
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, i) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="palm-card palm-card-hover p-4 flex items-center gap-4"
        >
          {/* Date icon */}
          <div
            className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--palm-violet-light)', color: 'var(--palm-violet)' }}
          >
            <span>{new Date(session.started_at).toLocaleDateString('en-US', { day: 'numeric' })}</span>
            <span className="text-[10px] uppercase">{new Date(session.started_at).toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--palm-text)' }}>
                {session.topic || 'General Math'}
              </span>
              {session.ended_at && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--palm-mint-light)', color: '#2A7A5E' }}
                >
                  Completed
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--palm-text-muted)' }}>
              {session.summary || 'Great learning session! Keep it up! ⭐'}
            </p>
          </div>

          {/* Duration */}
          <div className="text-right shrink-0">
            <span className="text-xs font-medium" style={{ color: 'var(--palm-text-muted)' }}>
              {session.total_turns || 0} turns
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
