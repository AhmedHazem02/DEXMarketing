import { create } from 'zustand'

interface IntroStore {
  isIntroComplete: boolean
  setIntroComplete: (complete: boolean) => void
}

export const useIntroStore = create<IntroStore>((set) => ({
  isIntroComplete: true, // Default to true for immediate display
  setIntroComplete: (complete) => set({ isIntroComplete: complete }),
}))
