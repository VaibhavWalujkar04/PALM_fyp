import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

const masteryLabels = [
  { max: 0, label: 'Not started', color: 'var(--palm-text-muted)' },
  { max: 0.35, label: 'Learning', color: 'var(--palm-amber)' },
  { max: 0.7, label: 'Confident', color: 'var(--palm-sky)' },
  { max: 1.0, label: 'Mastered', color: 'var(--palm-mint)' },
]

function getMasteryInfo(score) {
  if (score <= 0) return masteryLabels[0]
  for (const ml of masteryLabels) {
    if (score <= ml.max) return ml
  }
  return masteryLabels[masteryLabels.length - 1]
}

export default function TopicCard({ topic, emoji, mastery = 0, index = 0, onStart, disabled = false }) {
  const info = getMasteryInfo(mastery)
  const pct = Math.round(mastery * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      className="palm-card palm-card-hover p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'var(--palm-sky-light)' }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate" style={{ color: 'var(--palm-text)' }}>
            {topic}
          </h3>
          <span
            className="text-xs font-semibold"
            style={{ color: info.color }}
          >
            {info.label}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span style={{ color: 'var(--palm-text-muted)' }}>Mastery</span>
          <span className="font-semibold" style={{ color: info.color }}>{pct}%</span>
        </div>
        <Progress
          value={pct}
          className="h-2.5 rounded-full"
          style={{ background: 'var(--palm-bg)' }}
        />
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart?.(topic)}
        disabled={disabled}
        className="palm-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: disabled ? 'var(--palm-border)' : undefined }}
        aria-label={`Start ${topic} session`}
      >
        {disabled ? 'Coming Soon' : 'Start →'}
      </button>
    </motion.div>
  )
}
