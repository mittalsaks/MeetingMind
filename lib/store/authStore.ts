import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'student' | 'user'
  workspaceId: string
  workspaceName: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setAuth: (user: User, accessToken: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hasHydrated: false,
  setAuth: (user, accessToken) => {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('user', JSON.stringify(user))
    document.cookie = 'hasSession=true; path=/'
    document.cookie = `userRole=${user.role}; path=/`
    set({ user, accessToken, isAuthenticated: true })
  },
  logout: () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    document.cookie = 'hasSession=; path=/; max-age=0'
    document.cookie = 'userRole=; path=/; max-age=0'
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
  hydrate: () => {
    const token = sessionStorage.getItem('accessToken')
    const userStr = sessionStorage.getItem('user')
    if (token && userStr) {
      try {
        set({ user: JSON.parse(userStr), accessToken: token, isAuthenticated: true, hasHydrated: true })
        return
      } catch {}
    }
    set({ hasHydrated: true })
  }
}))