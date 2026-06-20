// ========================================
// useFireAuth — Firebase Authentication
// ========================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { ref as dbRef, set, get } from 'firebase/database'
import { getFirebaseAuth, getFirebaseRtdb } from '~/utils/firebase'

const googleProvider = new GoogleAuthProvider()

export const useFireAuth = () => {
  const auth = getFirebaseAuth()
  const rtdb = getFirebaseRtdb()
  const currentUser = useState<User | null>('firebase-user', () => null)
  const loading = useState('auth-loading', () => true)

  // Register with email/password + create RTDB profile
  const register = async (
    email: string,
    password: string,
    displayName: string,
    username: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })

    await set(dbRef(rtdb, `users/${cred.user.uid}`), {
      uid: cred.user.uid,
      email,
      displayName,
      username: username.toLowerCase(),
      bio: '',
      avatarUrl: '',
      postsCount: 0,
      createdAt: Date.now(),
    })

    currentUser.value = cred.user
    return cred.user
  }

  // Login with email/password
  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    currentUser.value = cred.user
    return cred.user
  }

  // Logout
  const logout = async () => {
    await signOut(auth)
    currentUser.value = null
  }

  // Login with Google popup
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)

    const snapshot = await get(dbRef(rtdb, `users/${cred.user.uid}`))
    if (!snapshot.exists()) {
      await set(dbRef(rtdb, `users/${cred.user.uid}`), {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
        username: (cred.user.email?.split('@')[0] || 'user').toLowerCase(),
        bio: '',
        avatarUrl: cred.user.photoURL || '',
        postsCount: 0,
        createdAt: Date.now(),
      })
    }

    currentUser.value = cred.user
    return cred.user
  }

  // Get user profile from RTDB
  const getUserProfile = async (uid: string): Promise<any | null> => {
    const snap = await get(dbRef(rtdb, `users/${uid}`))
    if (snap.exists()) {
      return { id: uid, ...snap.val() }
    }
    return null
  }

  // Listen to auth state changes
  const initAuth = () => {
    if (!import.meta.client) return
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      loading.value = false
    })
  }

  return {
    currentUser,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    getUserProfile,
    initAuth,
  }
}
