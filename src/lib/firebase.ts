import { initializeApp } from 'firebase/app'
import {
  getAuth,
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
export const auth = getAuth(app)

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

const googleProvider = new GoogleAuthProvider()

// Popup is nicer on desktop; redirect is more reliable inside an installed PWA on Android.
const isStandalone =
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true

export function signInWithGoogle() {
  return isStandalone ? signInWithRedirect(auth, googleProvider) : signInWithPopup(auth, googleProvider)
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
