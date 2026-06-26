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
  setAuth: (user: User, accessToken: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    document.cookie = 'hasSession=true; path=/; max-age=604800'
    document.cookie = `userRole=${user.role}; path=/; max-age=604800`
    set({ user, accessToken, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    document.cookie = 'hasSession=; path=/; max-age=0'
    document.cookie = 'userRole=; path=/; max-age=0'
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
  hydrate: () => {
    const token = localStorage.getItem('accessToken')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        set({ user: JSON.parse(userStr), accessToken: token, isAuthenticated: true })
      } catch {}
    }
  }
}))
