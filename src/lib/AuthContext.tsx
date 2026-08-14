import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { User } from './firebase'

interface AuthContextValue {
  user: User | null
  uid: string | null
  loading: boolean
  redirectError: unknown
}

const AuthContext = createContext<AuthContextValue>({ user: null, uid: null, loading: true, redirectError: null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, redirectError } = useAuth()
  return (
    <AuthContext.Provider value={{ user, uid: user?.uid ?? null, loading, redirectError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
