import { create } from 'zustand'

/**
 * Global UI state store — sidebar, modals, command palette.
 */
const useUIStore = create((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))

export default useUIStore
