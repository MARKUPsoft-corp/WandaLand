// ========================================
// Store — Auth (Firebase)
// ========================================

import { defineStore } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '~/utils/firebase'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    firebaseUid: null as string | null,
    loading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.firebaseUid,
    currentUser: (state) => state.user,
  },

  actions: {
    setUser(user: User | null, uid: string | null) {
      this.user = user
      this.firebaseUid = uid
      this.loading = false
    },

    async login(email: string, password: string) {
      const { login } = useFireAuth()
      await login(email, password)
      // onAuthStateChanged will call setUser automatically
    },

    async register(username: string, email: string, password: string, displayName: string) {
      const { register } = useFireAuth()
      await register(email, password, displayName, username)
    },

    async logout() {
      const { logout } = useFireAuth()
      await logout()
      this.user = null
      this.firebaseUid = null
      navigateTo('/')
    },

    async loginWithGoogle() {
      const { loginWithGoogle } = useFireAuth()
      await loginWithGoogle()
      // onAuthStateChanged will sync the user
    },

    initAuth() {
      if (!import.meta.client) return
      const auth = getFirebaseAuth()

      onAuthStateChanged(auth, async (fbUser: any) => {
        if (fbUser) {
          const { getUserProfile } = useFireAuth()
          const profile = await getUserProfile(fbUser.uid)
          this.setUser(
            profile
              ? {
                  id: fbUser.uid,
                  username: profile.username || '',
                  displayName: profile.displayName || fbUser.displayName || '',
                  email: fbUser.email || '',
                  bio: profile.bio || '',
                  avatarUrl: profile.avatarUrl || fbUser.photoURL || '',
                  postsCount: profile.postsCount || 0,
                  createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : new Date().toISOString(),
                }
              : {
                  id: fbUser.uid,
                  username: fbUser.email?.split('@')[0] || '',
                  displayName: fbUser.displayName || '',
                  email: fbUser.email || '',
                  bio: '',
                  avatarUrl: fbUser.photoURL || '',
                  postsCount: 0,
                  createdAt: new Date().toISOString(),
                },
            fbUser.uid
          )
        } else {
          this.setUser(null, null)
        }
      })
    },
  },
})
