import { useState } from 'react'
import { motion } from 'framer-motion'
import MathRenderer from '@/components/math/MathRenderer'

export default function QuizCard({ question, options = [], questionType = 'mcq', onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (submitted) return
    const answer = questionType === 'mcq' ? selected : textAnswer.trim()
    if (!answer) return
    setSubmitted(true)
    onAnswer?.(answer)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 ml-10"
    >
      <div className="palm-card p-4 space-y-4">
        {/* Question */}
        <div className="flex items-start gap-2">
          <span className="text-lg mt-0.5">❓</span>
          <div className="text-[0.95rem] font-medium leading-relaxed" style={{ color: 'var(--palm-text)' }}>
            <MathRenderer content={question} />
          </div>
        </div>

        {/* MCQ options */}
        {questionType === 'mcq' && options.length > 0 && (
          <div className="space-y-2 pl-7">
            {options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selected === letter
              return (
                <button
                  key={i}
                  onClick={() => !submitted && setSelected(letter)}
                  disabled={submitted}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all flex items-center gap-2.5 ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  style={{
                    background: isSelected ? 'var(--palm-sky-light)' : 'var(--palm-bg)',
                    border: `2px solid ${isSelected ? 'var(--palm-sky)' : 'var(--palm-border)'}`,
                    color: 'var(--palm-text)',
                  }}
                  aria-label={`Option ${letter}: ${opt}`}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: isSelected ? 'var(--palm-sky)' : 'var(--palm-border)',
                      color: isSelected ? '#fff' : 'var(--palm-text-muted)',
                    }}
                  >
                    {letter}
                  </span>
                  <MathRenderer content={opt} />
                </button>
              )
            })}
          </div>
        )}

        {/* Text input for fill-in / short answer */}
        {(questionType === 'fill' || questionType === 'short') && (
          <div className="pl-7">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={submitted}
              placeholder={questionType === 'fill' ? 'Type your answer...' : 'Write a short answer...'}
              className="w-full px-4 py-2.5 rounded-xl text-sm border-2 transition-all focus:outline-none"
              style={{
                borderColor: textAnswer ? 'var(--palm-sky)' : 'var(--palm-border)',
                background: 'var(--palm-bg)',
                color: 'var(--palm-text)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              aria-label="Your answer"
            />
          </div>
        )}

        {/* Submit button */}
        {!submitted && (
          <div className="pl-7">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={questionType === 'mcq' ? !selected : !textAnswer.trim()}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'var(--palm-sky)' }}
              aria-label="Submit answer"
            >
              Submit Answer ✓
            </motion.button>
          </div>
        )}

        {submitted && (
          <div className="pl-7">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: 'var(--palm-mint-light)', color: '#2A7A5E' }}
            >
              ✓ Answer submitted
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
