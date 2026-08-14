import { useEffect, useState } from 'react'
import { auth, completeRedirectSignIn, watchAuth, type User } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    completeRedirectSignIn().catch(() => {
      // No pending redirect result, or it failed silently — onAuthStateChanged still fires.
    })
    const unsubscribe = watchAuth((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, loading }
}
