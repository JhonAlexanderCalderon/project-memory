import { useEffect, useState } from 'react'
import { auth, completeRedirectSignIn, watchAuth, type User } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [loading, setLoading] = useState(true)
  const [redirectError, setRedirectError] = useState<unknown>(null)

  useEffect(() => {
    completeRedirectSignIn().catch((err) => {
      setRedirectError(err)
    })
    const unsubscribe = watchAuth((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading, redirectError }
}
