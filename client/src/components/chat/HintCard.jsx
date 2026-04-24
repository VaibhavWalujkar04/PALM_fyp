import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from '@/components/math/MathRenderer'

const tierInfo = {
  1: { label: 'Gentle Nudge', emoji: '💡', color: 'var(--palm-mint)' },
  2: { label: 'Guided Hint', emoji: '🔍', color: 'var(--palm-amber)' },
  3: { label: 'Detailed Help', emoji: '📖', color: 'var(--palm-sky)' },
}

export default function HintCard({ content, tier = 1, metadata = {} }) {
  const [isOpen, setIsOpen] = useState(tier >= 2)
  const info = tierInfo[tier] || tierInfo[1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 ml-10"
    >
      <div className="palm-card overflow-hidden">
        {/* Header (clickable) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2.5 p-3 text-left transition-colors hover:bg-gray-50"
          aria-expanded={isOpen}
          aria-label={`${info.label} hint, tier ${tier}`}
        >
          <span className="text-lg">{info.emoji}</span>
          <div className="flex-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--palm-text)' }}>
              {info.label}
            </span>
            <span
              className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: info.color + '20', color: info.color }}
            >
              Tier {tier}
            </span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--palm-text-muted)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="px-4 pb-4 text-[0.9rem] leading-relaxed border-t"
                style={{ borderColor: 'var(--palm-border)', color: 'var(--palm-text)' }}
              >
                <div className="pt-3">
                  <MathRenderer content={content} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
