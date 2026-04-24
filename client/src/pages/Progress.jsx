import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import useStudentStore from '@/store/useStudentStore'

const TOPICS = [
  {
    name: 'Number Systems',
    emoji: '🔢',
    subtopics: ['Counting', 'Place Value', 'Comparing Numbers', 'Ordering'],
  },
  {
    name: 'Fractions & Decimals',
    emoji: '🥧',
    subtopics: ['Unit Fractions', 'Equivalent Fractions', 'Adding Fractions', 'Decimals'],
  },
  {
    name: 'Applied Measurement',
    emoji: '📏',
    subtopics: ['Length', 'Weight', 'Volume', 'Time', 'Money'],
  },
  {
    name: 'Geometry & Visuals',
    emoji: '📐',
    subtopics: ['Shapes', 'Symmetry', 'Patterns', 'Spatial Reasoning'],
  },
  {
    name: 'Data Handling',
    emoji: '📊',
    subtopics: ['Tally Charts', 'Bar Graphs', 'Pictographs', 'Reading Data'],
  },
]

export default function ProgressPage() {
  const navigate = useNavigate()
  const { studentId, name, grade } = useStudentStore()
  const [expandedTopic, setExpandedTopic] = useState(null)

  useEffect(() => {
    if (!studentId) navigate('/', { replace: true })
  }, [studentId, navigate])

  if (!studentId) return null

  // Mock mastery data (will be replaced with API calls)
  const masteryData = {}
  TOPICS.forEach((t) => {
    masteryData[t.name] = { score: Math.random() * 0.8, subtopics: {} }
    t.subtopics.forEach((st) => {
      masteryData[t.name].subtopics[st] = Math.random() * 0.9
    })
  })

  const weakTopics = Object.entries(masteryData)
    .filter(([, d]) => d.score < 0.4)
    .map(([name]) => name)

  return (
    <div className="min-h-screen" style={{ background: 'var(--palm-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b" style={{ background: 'var(--palm-card)', borderColor: 'var(--palm-border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg palm-gradient-sky flex items-center justify-center">
                <span className="text-sm">🧠</span>
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--palm-text)' }}>PALM</span>
            </Link>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--palm-sky-light)', color: 'var(--palm-sky)' }}>
            Grade {grade}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--palm-text)' }}>
            {name}'s Progress Report 📈
          </h1>
          <p style={{ color: 'var(--palm-text-muted)' }}>Here's how you're doing across all topics</p>
        </motion.div>

        {/* Weak areas alert */}
        {weakTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="palm-card p-4 flex items-start gap-3"
            style={{ borderLeft: '4px solid var(--palm-amber)' }}
          >
            <span className="text-xl mt-0.5">💡</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--palm-text)' }}>
                Areas to practice
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--palm-text-muted)' }}>
                Try spending a bit more time on:{' '}
                <strong>{weakTopics.join(', ')}</strong>
              </p>
            </div>
          </motion.div>
        )}

        {/* Topic breakdown */}
        <div className="space-y-3">
          {TOPICS.map((topic, i) => {
            const data = masteryData[topic.name] || { score: 0, subtopics: {} }
            const pct = Math.round(data.score * 100)
            const isExpanded = expandedTopic === topic.name

            return (
              <motion.div
                key={topic.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="palm-card overflow-hidden"
              >
                {/* Topic row (clickable) */}
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.name)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--palm-sky-light)' }}>
                    {topic.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--palm-text)' }}>{topic.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pct} className="h-2 flex-1 rounded-full" style={{ background: 'var(--palm-bg)' }} />
                      <span className="text-xs font-bold w-10 text-right" style={{ color: pct >= 70 ? 'var(--palm-mint)' : pct >= 40 ? 'var(--palm-sky)' : 'var(--palm-amber)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--palm-text-muted)' }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Subtopics */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'var(--palm-border)' }}>
                    <div className="space-y-2 ml-13">
                      {topic.subtopics.map((st) => {
                        const stScore = data.subtopics?.[st] || 0
                        const stPct = Math.round(stScore * 100)
                        return (
                          <div key={st} className="flex items-center gap-3">
                            <span className="text-xs w-32 truncate" style={{ color: 'var(--palm-text-muted)' }}>{st}</span>
                            <Progress value={stPct} className="h-1.5 flex-1 rounded-full" style={{ background: 'var(--palm-bg)' }} />
                            <span className="text-[11px] font-semibold w-8 text-right" style={{ color: stPct >= 70 ? 'var(--palm-mint)' : 'var(--palm-text-muted)' }}>
                              {stPct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Back to dashboard */}
        <div className="text-center pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{ background: 'var(--palm-sky-light)', color: 'var(--palm-sky)' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
