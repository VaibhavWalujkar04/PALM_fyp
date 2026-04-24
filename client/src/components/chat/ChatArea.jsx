import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useChatStore from '@/store/useChatStore'
import useUIStore from '@/store/useUIStore'
import useStudentStore from '@/store/useStudentStore'
import MessageBubble from './MessageBubble'
import EngagementCard from './EngagementCard'
import HintCard from './HintCard'
import QuizCard from './QuizCard'

export default function ChatArea({ onQuizAnswer }) {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const { showEngagementCard, engagementCardContent, dismissEngagement } = useUIStore()
  const studentName = useStudentStore((s) => s.name)
  const bottomRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming, showEngagementCard])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {/* Empty state */}
      {messages.length === 0 && !showEngagementCard && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-palm-float" style={{ background: 'var(--palm-violet-light)' }}>
            🧠
          </div>
          <p className="font-semibold text-lg" style={{ color: 'var(--palm-text)' }}>
            Hey {studentName}! I'm Pal! 👋
          </p>
          <p className="text-sm max-w-xs" style={{ color: 'var(--palm-text-muted)' }}>
            Ask me any math question, or I'll get us started with something fun!
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => {
        if (msg.type === 'hint') {
          return (
            <HintCard
              key={msg.id}
              content={msg.content}
              tier={msg.metadata?.tier || 1}
              metadata={msg.metadata}
            />
          )
        }

        if (msg.type === 'quiz') {
          return (
            <QuizCard
              key={msg.id}
              question={msg.content}
              options={msg.metadata?.options || []}
              questionType={msg.metadata?.question_type || 'mcq'}
              onAnswer={(answer) => onQuizAnswer?.(answer, msg)}
            />
          )
        }

        return <MessageBubble key={msg.id} message={msg} />
      })}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2.5 my-2">
          <div
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm"
            style={{ background: 'var(--palm-violet-light)' }}
          >
            🧠
          </div>
          <div
            className="rounded-2xl rounded-tl-md px-4 py-3"
            style={{ background: 'var(--palm-card)', border: '1px solid var(--palm-border)' }}
          >
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--palm-sky)', animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--palm-sky)', animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--palm-sky)', animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Engagement card */}
      <AnimatePresence>
        {showEngagementCard && (
          <EngagementCard
            content={engagementCardContent}
            studentName={studentName}
            onDismiss={dismissEngagement}
          />
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
