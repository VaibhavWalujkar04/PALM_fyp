import { create } from 'zustand'

let _msgId = 0
const nextId = () => `msg-${++_msgId}-${Date.now()}`

const useChatStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingMessageId: null,

  addMessage: ({ role, content, type = 'text', metadata = {} }) => {
    const msg = {
      id: nextId(),
      role,       // 'tutor' | 'student' | 'system'
      content,
      type,       // 'text' | 'hint' | 'quiz' | 'engagement' | 'celebration'
      metadata,
      timestamp: Date.now(),
    }
    set((state) => ({ messages: [...state.messages, msg] }))
    return msg.id
  },

  // Start a streaming message (tokens arrive one-by-one)
  startStreaming: (role = 'tutor') => {
    const id = nextId()
    const msg = {
      id,
      role,
      content: '',
      type: 'text',
      metadata: {},
      timestamp: Date.now(),
    }
    set((state) => ({
      messages: [...state.messages, msg],
      isStreaming: true,
      streamingMessageId: id,
    }))
    return id
  },

  // Append a token to the currently streaming message
  appendToken: (token) => {
    const { streamingMessageId } = get()
    if (!streamingMessageId) return
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: m.content + token }
          : m
      ),
    }))
  },

  // Finalize streaming: replace content and mark done
  finalizeStream: (fullText, metadata = {}) => {
    const { streamingMessageId } = get()
    if (!streamingMessageId) return
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: fullText || m.content, metadata: { ...m.metadata, ...metadata } }
          : m
      ),
      isStreaming: false,
      streamingMessageId: null,
    }))
  },

  // Stop streaming without finalizing (error case)
  cancelStream: () =>
    set({ isStreaming: false, streamingMessageId: null }),

  clearMessages: () =>
    set({ messages: [], isStreaming: false, streamingMessageId: null }),
}))

export default useChatStore
