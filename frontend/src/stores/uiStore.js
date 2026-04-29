import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global UI state store — sidebar, appearance, compact mode, animations.
 */
const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      
      // Appearance
      theme: 'dark', // 'dark', 'system'
      accentColor: 'violet', // 'violet', 'blue', 'teal', 'rose', 'amber'
      compactMode: false,
      animationsOn: true,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setAnimationsOn: (animationsOn) => set({ animationsOn }),
    }),
    {
      name: 'studvisor-ui-settings',
    }
  )
)

export default useUIStore
