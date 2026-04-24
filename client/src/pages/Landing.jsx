import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import useStudentStore from '@/store/useStudentStore'
import { createStudent } from '@/lib/api'

const GRADES = [1, 2, 3, 4, 5]

const gradeEmojis = {
  1: '🌱',
  2: '🌿',
  3: '🌳',
  4: '⭐',
  5: '🚀',
}

export default function Landing() {
  const navigate = useNavigate()
  const setStudent = useStudentStore((s) => s.setStudent)
  const existingStudent = useStudentStore((s) => s.studentId)

  const [name, setName] = useState('')
  const [grade, setGrade] = useState(null)
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect
  useEffect(() => {
    if (existingStudent) {
      navigate('/dashboard', { replace: true })
    }
  }, [existingStudent, navigate])

  if (existingStudent) return null

  const isValid = name.trim().length >= 2 && grade !== null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || loading) return

    setLoading(true)
    try {
      const student = await createStudent({ name: name.trim(), grade })
      setStudent({
        studentId: student.id,
        name: student.name,
        grade: student.grade,
      })
      toast.success(`Welcome, ${student.name}! Let's start learning! 🌟`)
      navigate('/dashboard')
    } catch (err) {
      toast.error('Oops! Something went wrong. Let\'s try again! 🔄')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--palm-bg)' }}>
      {/* Background decorative shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'var(--palm-sky-light)' }}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'var(--palm-violet-light)' }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/4 left-10 w-16 h-16 rounded-2xl opacity-20"
          style={{ background: 'var(--palm-mint)' }}
          animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-16 w-12 h-12 rounded-xl opacity-15"
          style={{ background: 'var(--palm-amber)' }}
          animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="palm-card w-full max-w-lg p-8 md:p-10 relative z-10"
      >
        {/* Logo / mascot area */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <div className="w-20 h-20 rounded-2xl palm-gradient-sky flex items-center justify-center shadow-lg">
            <span className="text-4xl">🧠</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-center mb-2"
          style={{ color: 'var(--palm-text)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Hi there! Ready to learn math today?{' '}
          <span className="inline-block animate-palm-float">🌟</span>
        </motion.h1>

        <motion.p
          className="text-center mb-8"
          style={{ color: 'var(--palm-text-muted)', fontSize: '1.05rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          I'm <strong>Pal</strong>, your personal math buddy. Let's get started!
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label
              htmlFor="student-name"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--palm-text)' }}
            >
              What's your name?
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Riya"
              className="w-full px-4 py-3 rounded-xl text-lg border-2 transition-all focus:outline-none"
              style={{
                borderColor: name.trim() ? 'var(--palm-sky)' : 'var(--palm-border)',
                background: 'var(--palm-bg)',
                color: 'var(--palm-text)',
              }}
              aria-label="Enter your name"
              autoComplete="off"
              autoFocus
            />
          </motion.div>

          {/* Grade selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--palm-text)' }}>
              Which grade are you in?
            </label>
            <div className="flex gap-2 flex-wrap">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className="palm-pill flex-1 min-w-[60px] py-3 rounded-full text-base font-semibold"
                  style={{
                    background: grade === g ? 'var(--palm-sky)' : 'var(--palm-bg)',
                    color: grade === g ? '#fff' : 'var(--palm-text)',
                    border: `2px solid ${grade === g ? 'var(--palm-sky)' : 'var(--palm-border)'}`,
                  }}
                  aria-label={`Select Grade ${g}`}
                  aria-pressed={grade === g}
                >
                  {gradeEmojis[g]} {g}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              type="submit"
              disabled={!isValid || loading}
              className="palm-btn-primary w-full py-4 rounded-full text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: isValid ? 'var(--palm-sky)' : 'var(--palm-border)' }}
              id="start-learning-btn"
              aria-label="Start learning"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Getting ready...
                </span>
              ) : (
                'Start Learning →'
              )}
            </button>
          </motion.div>
        </form>

        {/* Footer text */}
        <motion.p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--palm-text-muted)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          PALM — Personalized Adaptive Learning Mentor
        </motion.p>
      </motion.div>
    </div>
  )
}
