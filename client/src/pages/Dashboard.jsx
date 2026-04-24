import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useStudentStore from '@/store/useStudentStore'
import useSessionStore from '@/store/useSessionStore'
import TopicCard from '@/components/dashboard/TopicCard'
import SessionHistory from '@/components/dashboard/SessionHistory'
import MasteryHeatmap from '@/components/dashboard/MasteryHeatmap'
import { createSession } from '@/lib/api'

const TOPICS_BY_GRADE = {
  1: [
    { name: 'Number Systems', emoji: '🔢' },
    { name: 'Addition & Subtraction', emoji: '➕' },
    { name: 'Shapes & Patterns', emoji: '🔷' },
    { name: 'Measurement', emoji: '📏' },
    { name: 'Data Handling', emoji: '📊' },
  ],
  2: [
    { name: 'Number Systems', emoji: '🔢' },
    { name: 'Addition & Subtraction', emoji: '➕' },
    { name: 'Multiplication Basics', emoji: '✖️' },
    { name: 'Geometry & Visuals', emoji: '📐' },
    { name: 'Data Handling', emoji: '📊' },
  ],
  3: [
    { name: 'Number Systems', emoji: '🔢' },
    { name: 'Fractions & Decimals', emoji: '🥧' },
    { name: 'Multiplication & Division', emoji: '✖️' },
    { name: 'Geometry & Visuals', emoji: '📐' },
    { name: 'Applied Measurement', emoji: '📏' },
  ],
  4: [
    { name: 'Number Systems', emoji: '🔢' },
    { name: 'Fractions & Decimals', emoji: '🥧' },
    { name: 'Applied Measurement', emoji: '📏' },
    { name: 'Geometry & Visuals', emoji: '📐' },
    { name: 'Data Handling', emoji: '📊' },
  ],
  5: [
    { name: 'Number Systems', emoji: '🔢' },
    { name: 'Fractions & Decimals', emoji: '🥧' },
    { name: 'Applied Measurement', emoji: '📏' },
    { name: 'Geometry & Visuals', emoji: '📐' },
    { name: 'Data Handling', emoji: '📊' },
  ],
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { studentId, name, grade } = useStudentStore()
  const startSession = useSessionStore((s) => s.startSession)

  const [sessions, setSessions] = useState([])
  const [masteryData, setMasteryData] = useState({})
  const [loading, setLoading] = useState(false)

  // Redirect if no student
  useEffect(() => {
    if (!studentId) {
      navigate('/', { replace: true })
    }
  }, [studentId, navigate])

  if (!studentId) return null

  const topics = TOPICS_BY_GRADE[grade] || TOPICS_BY_GRADE[3]

  const handleStartSession = async (topicName) => {
    if (loading) return
    setLoading(true)
    try {
      const session = await createSession({
        studentId,
        grade,
        topic: topicName,
      })
      startSession({
        sessionId: session.id,
        topic: topicName,
        grade,
      })
      navigate('/session')
    } catch (err) {
      toast.error('Oops! Could not start the session. Let\'s try again! 🔄')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--palm-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b" style={{ background: 'var(--palm-card)', borderColor: 'var(--palm-border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl palm-gradient-sky flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--palm-text)' }}>PALM</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--palm-sky-light)', color: 'var(--palm-sky)' }}
            >
              Grade {grade}
            </span>
            <button
              onClick={() => {
                useStudentStore.getState().clearStudent()
                navigate('/')
              }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--palm-text-muted)' }}
              aria-label="Switch student"
            >
              Switch Student
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold" style={{ color: 'var(--palm-text)' }}>
            Welcome back, {name}! 👋
          </h2>
          <p style={{ color: 'var(--palm-text-muted)' }}>
            What would you like to learn today?
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="topics" className="w-full">
          <TabsList className="mb-6 p-1 rounded-xl" style={{ background: 'var(--palm-bg-warm)' }}>
            <TabsTrigger
              value="topics"
              className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📚 Topics
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📝 Recent Sessions
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              📈 Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((t, i) => (
                <TopicCard
                  key={t.name}
                  topic={t.name}
                  emoji={t.emoji}
                  mastery={masteryData[t.name] || 0}
                  index={i}
                  onStart={handleStartSession}
                  disabled={loading}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <SessionHistory sessions={sessions} />
          </TabsContent>

          <TabsContent value="progress">
            <MasteryHeatmap masteryData={masteryData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
