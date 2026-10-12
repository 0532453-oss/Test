import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { env } from '@app/config'
import { isDemoMode } from '@/mocks/demoMode'
import { mockUser } from '@/mocks/data'

// Types - align with your @flexdesk/types
interface User {
  id: string
  email: string
  fullName: string
  role: string
  workspaceId: string
  avatarUrl?: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'flexdesk_token'
const USER_KEY = 'flexdesk_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_KEY)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuth = useCallback(async () => {
    // Demo mode: Use mock user and skip backend fetch
    if (isDemoMode()) {
      setUser(mockUser)
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
      localStorage.setItem(TOKEN_KEY, 'demo-token')
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem(TOKEN_KEY)

    // No token: user must log in
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    // If token exists, try to validate with backend
    try {
      const res = await fetch(`${env.API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      } else {
        // Backend rejected token - clear credentials
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      }
    } catch {
      // Backend not available - use cached user if available
      try {
        const cached = localStorage.getItem(USER_KEY)
        if (cached) {
          setUser(JSON.parse(cached))
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    // Demo mode: Skip backend fetch and use mock user
    if (isDemoMode()) {
      localStorage.setItem(TOKEN_KEY, 'demo-token')
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
      setUser(mockUser)
      const from = (location.state as { from?: string })?.from || '/dashboard'
      navigate(from, { replace: true })
      return
    }

    try {
      const res = await fetch(`${env.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem(TOKEN_KEY, data.access_token)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setUser(data.user)
        setError(null)
        const from = (location.state as { from?: string })?.from || '/dashboard'
        navigate(from, { replace: true })
        return
      }

      // Backend returned an error (invalid credentials, etc.)
      throw new Error('Invalid email or password')
    } catch (err) {
      // Re-throw our own errors, wrap network errors
      if (err instanceof Error && err.message === 'Invalid email or password') {
        throw err
      }
      // Backend not available
      throw new Error('Unable to connect to server. Please try again later.')
    }
  }

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      try {
        await fetch(`${env.API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Ignore logout API errors
      }
    }

    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
