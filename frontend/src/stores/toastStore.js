import { create } from 'zustand'

let toastId = 0

/**
 * Global toast notification store.
 * Usage: useToastStore.getState().addToast({ type: 'success', message: '...' })
 */
const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ type = 'info', title = '', message = '', duration = 4000 }) => {
    const id = ++toastId
    set((s) => ({
      toasts: [...s.toasts, { id, type, title, message, duration, exiting: false }],
    }))
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration)
    }
    return id
  },

  dismissToast: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    }))
    // Remove after exit animation
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 300)
  },

  clearAll: () => set({ toasts: [] }),
}))

/** Convenience hook — returns { success, error, warning, info } shorthand fns */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast)
  return {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }
}

export default useToastStore
