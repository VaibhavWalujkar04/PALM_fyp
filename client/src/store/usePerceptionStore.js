import { create } from 'zustand'

const usePerceptionStore = create((set) => ({
  emotion: 'neutral',
  gazeStatus: 'unknown',
  emotionConfidence: 0,
  meshFps: 0,
  isPerceptionReady: false,

  updatePerception: ({ emotion, gaze, confidence }) =>
    set({
      emotion: emotion || 'neutral',
      gazeStatus: gaze || 'unknown',
      emotionConfidence: confidence || 0,
    }),

  setMeshFps: (fps) => set({ meshFps: fps }),
  setPerceptionReady: (ready) => set({ isPerceptionReady: ready }),

  resetPerception: () =>
    set({
      emotion: 'neutral',
      gazeStatus: 'unknown',
      emotionConfidence: 0,
      meshFps: 0,
      isPerceptionReady: false,
    }),
}))

export default usePerceptionStore
