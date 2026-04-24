import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStudentStore = create(
  persist(
    (set, get) => ({
      studentId: null,
      name: '',
      grade: null,

      setStudent: ({ studentId, name, grade }) =>
        set({ studentId, name, grade }),

      clearStudent: () =>
        set({ studentId: null, name: '', grade: null }),

      isLoggedIn: () => !!get().studentId,
    }),
    {
      name: 'palm-student',
    }
  )
)

export default useStudentStore
