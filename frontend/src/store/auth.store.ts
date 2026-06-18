import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

export interface User {
  id: string
  email: string
  username: string
  role: 'admin' | 'organizer' | 'player'
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  isEmailVerified: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  hydrateFromServer: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      setLoading: (isLoading) => set({ isLoading }),

      hydrateFromServer: async () => {
        try {
          const token = localStorage.getItem('accessToken')
          if (!token) { set({ isLoading: false }); return }

          set({ isLoading: true })
          const { data } = await api.get('/auth/me')
          const user = data.data?.user
          if (user) {
            set({ user, isAuthenticated: true, accessToken: token, isLoading: false })
          } else {
            get().clearAuth()
            set({ isLoading: false })
          }
        } catch {
          get().clearAuth()
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'crime-game-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
