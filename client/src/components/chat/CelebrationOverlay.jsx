import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CONFETTI_COLORS = ['#5CC8A8', '#4A9EE0', '#7B6FE8', '#F0A845', '#F07070', '#FFD700']
const PARTICLE_COUNT = 40

function randomBetween(a, b) {
  return Math.random() * (b - a) + a
}

export default function CelebrationOverlay({ show }) {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: randomBetween(10, 90),
      delay: randomBetween(0, 0.5),
      duration: randomBetween(1.5, 3),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: randomBetween(6, 14),
      rotation: randomBetween(0, 360),
    }))
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
        >
          {/* Center message */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-6xl mb-2"
              >
                🎉
              </motion.div>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold px-6 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--palm-text)' }}
              >
                Amazing work! You're a math star! ⭐
              </motion.p>
            </div>
          </motion.div>

          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}vw`,
                y: '-10%',
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: '110vh',
                rotate: p.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeIn',
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: p.size > 10 ? '2px' : '50%',
                background: p.color,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
