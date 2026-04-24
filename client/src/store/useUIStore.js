import { create } from 'zustand'

const useUIStore = create((set) => ({
  // Engagement card
  showEngagementCard: false,
  engagementCardContent: null,

  // Celebration
  showCelebration: false,

  // Microphone
  micState: 'idle', // idle | listening | processing

  // Connection
  tutorWsStatus: 'disconnected',    // connected | reconnecting | disconnected
  perceptionWsStatus: 'disconnected',

  // Actions
  showEngagement: (content) =>
    set({ showEngagementCard: true, engagementCardContent: content }),

  dismissEngagement: () =>
    set({ showEngagementCard: false, engagementCardContent: null }),

  triggerCelebration: () => {
    set({ showCelebration: true })
    setTimeout(() => set({ showCelebration: false }), 3000)
  },

  setMicState: (state) => set({ micState: state }),

  setTutorWsStatus: (status) => set({ tutorWsStatus: status }),
  setPerceptionWsStatus: (status) => set({ perceptionWsStatus: status }),

  resetUI: () =>
    set({
      showEngagementCard: false,
      engagementCardContent: null,
      showCelebration: false,
      micState: 'idle',
      tutorWsStatus: 'disconnected',
      perceptionWsStatus: 'disconnected',
    }),
}))

export default useUIStore
