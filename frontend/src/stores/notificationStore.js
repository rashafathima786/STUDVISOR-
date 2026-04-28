import { create } from 'zustand'

/**
 * Global notification store for real-time alerts.
 * Will be wired to WebSocket in Phase 3.
 */
const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.is_read).length
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    const current = get().notifications
    set({
      notifications: [notification, ...current],
      unreadCount: get().unreadCount + 1,
    })
  },

  markAsRead: (notificationId) => {
    const updated = get().notifications.map(n =>
      n.id === notificationId ? { ...n, is_read: true } : n
    )
    set({
      notifications: updated,
      unreadCount: updated.filter(n => !n.is_read).length,
    })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))

export default useNotificationStore
