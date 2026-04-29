import { create } from 'zustand'

const useChatStore = create((set) => ({
  isOpen: false,
  isFullScreen: false,
  setChatOpen: (isOpen) => set({ isOpen }),
  setFullScreen: (isFullScreen) => set({ isFullScreen }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
}))

export default useChatStore
