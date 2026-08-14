import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID,
)

// Fall back to harmless placeholders when unconfigured so SDK init doesn't throw —
// the UI gates all real usage behind `isFirebaseConfigured` and shows a setup screen instead.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:0:web:0',
}

export const app = initializeApp(firebaseConfig)
// Force localStorage-backed persistence instead of the SDK's default IndexedDB
// persistence — IndexedDB connections get force-closed when an installed PWA is
// backgrounded (which happens during the Google redirect flow), causing auth to
// fail with an opaque "Database is closing/hidden" error right when the user
// returns from picking their account. localStorage has no such connection to lose.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
})

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

const googleProvider = new GoogleAuthProvider()

// Popup first: it keeps the whole flow in one live browsing context (talking via
// postMessage), which survives real-world mobile Chrome storage partitioning between
// this app's origin and the authDomain — redirect requires that state to persist
// across a full page unload/reload and silently drops it on many mobile setups
// (no error, just lands back on the login screen). Redirect is only the fallback for
// environments where popups genuinely don't work (blocked, or an installed PWA).
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider)
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider)
      return
    }
    throw err
  }
}

export function completeRedirectSignIn() {
  return getRedirectResult(auth)
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export type { User }
