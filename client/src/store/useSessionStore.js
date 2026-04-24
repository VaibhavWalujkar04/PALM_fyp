import { create } from 'zustand'

const useSessionStore = create((set) => ({
  sessionId: null,
  currentTopic: null,
  difficultyLevel: 1,
  masteryScore: 0,
  sessionStatus: 'idle', // idle | active | ended

  startSession: ({ sessionId, topic, grade }) =>
    set({
      sessionId,
      currentTopic: topic,
      difficultyLevel: 1,
      masteryScore: 0,
      sessionStatus: 'active',
    }),

  updateMastery: (score) => set({ masteryScore: score }),

  updateMasteryDelta: (delta) =>
    set((state) => ({
      masteryScore: Math.max(0, Math.min(1, state.masteryScore + delta)),
    })),

  setDifficulty: (level) => set({ difficultyLevel: level }),

  setTopic: (topic) => set({ currentTopic: topic }),

  endSession: () =>
    set({
      sessionStatus: 'ended',
    }),

  resetSession: () =>
    set({
      sessionId: null,
      currentTopic: null,
      difficultyLevel: 1,
      masteryScore: 0,
      sessionStatus: 'idle',
    }),
}))

export default useSessionStore
