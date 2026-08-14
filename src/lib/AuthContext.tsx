import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { User } from './firebase'

interface AuthContextValue {
  user: User | null
  uid: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, uid: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  return <AuthContext.Provider value={{ user, uid: user?.uid ?? null, loading }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  return useContext(AuthContext)
}
