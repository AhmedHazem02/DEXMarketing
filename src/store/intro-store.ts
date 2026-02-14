import { create } from 'zustand'

interface IntroState {
    isIntroComplete: boolean
    setIntroComplete: (complete: boolean) => void
}

export const useIntroStore = create<IntroState>((set) => ({
    isIntroComplete: false,
    setIntroComplete: (complete) => set({ isIntroComplete: complete }),
}))
