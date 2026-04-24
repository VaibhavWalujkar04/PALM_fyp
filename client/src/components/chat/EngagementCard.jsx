import { motion } from 'framer-motion'

export default function EngagementCard({ content, studentName = 'there', onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="my-4 mx-2"
    >
      <div
        className="rounded-2xl p-[2px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--palm-sky), var(--palm-violet), var(--palm-mint))',
        }}
      >
        <div className="rounded-2xl p-5" style={{ background: 'var(--palm-card)' }}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎯</span>
            <h3 className="font-bold text-base" style={{ color: 'var(--palm-text)' }}>
              Hey {studentName}, let's try something fun!
            </h3>
          </div>

          {/* Challenge content */}
          <div
            className="text-[0.95rem] leading-relaxed mb-4 p-3 rounded-xl"
            style={{ background: 'var(--palm-bg)', color: 'var(--palm-text)' }}
          >
            {content || "Here's a fun challenge for you! 🧩"}
          </div>

          {/* Action button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'var(--palm-sky)' }}
            aria-label="Dismiss engagement card"
          >
            I'm ready! Let's go! 🚀
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
