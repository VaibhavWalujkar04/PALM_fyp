import { motion } from 'framer-motion'

const TOPICS = [
  'Number Systems',
  'Fractions & Decimals',
  'Applied Measurement',
  'Geometry & Visuals',
  'Data Handling',
]

function getColor(score) {
  if (score >= 0.85) return 'var(--palm-mint)'
  if (score >= 0.5) return 'var(--palm-sky)'
  if (score > 0) return 'var(--palm-amber)'
  return 'var(--palm-border)'
}

function getTextColor(score) {
  if (score >= 0.85) return '#1a6348'
  if (score >= 0.5) return '#1e5f8a'
  if (score > 0) return '#8a5a15'
  return 'var(--palm-text-muted)'
}

export default function MasteryHeatmap({ masteryData = {} }) {
  return (
    <div className="space-y-6">
      {/* Heatmap grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TOPICS.map((topic, i) => {
          const score = masteryData[topic] || 0
          const pct = Math.round(score * 100)

          return (
            <motion.div
              key={topic}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="palm-card p-4 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: getColor(score),
                  color: '#fff',
                  opacity: Math.max(0.4, score || 0.2),
                }}
              >
                {pct}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--palm-text)' }}>
                  {topic}
                </p>
                <p className="text-xs" style={{ color: getTextColor(score) }}>
                  {score >= 0.85 ? '🌟 Strong' : score >= 0.5 ? '💪 Growing' : score > 0 ? '📖 Needs Practice' : 'Not started'}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--palm-text-muted)' }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--palm-mint)' }} /> Strong (85%+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--palm-sky)' }} /> Growing (50%+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: 'var(--palm-amber)' }} /> Needs Practice
        </span>
      </div>
    </div>
  )
}
