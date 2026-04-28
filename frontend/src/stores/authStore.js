import { create } from 'zustand'
import { getToken, getRole, getUser, saveToken, saveRole, saveUser, removeToken } from '../utils/auth'

/**
 * Global auth + user state store using Zustand.
 * Eliminates prop drilling and duplicate API calls across pages.
 */
const useAuthStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────
  token: getToken(),
  role: getRole(),
  user: getUser(),
  isAuthenticated: !!getToken(),

  // ── Actions ───────────────────────────────────────────────────────────
  login: (token, role, user) => {
    saveToken(token)
    saveRole(role)
    saveUser(user)
    set({ token, role, user, isAuthenticated: true })
  },

  logout: () => {
    removeToken()
    localStorage.removeItem('erp_refresh_token')
    set({ token: null, role: null, user: null, isAuthenticated: false })
  },

  // ── Role Checks (using Zustand state, not localStorage) ───────────────
  isStudent: () => get().role === 'student',
  isFaculty: () => {
    const r = get().role
    return r === 'faculty' || r === 'hod'
  },
  isAdmin: () => get().role === 'admin',
}))

export default useAuthStore
