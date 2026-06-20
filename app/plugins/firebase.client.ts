// ========================================
// Firebase Plugin — Init app + services
// ========================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { setFirebaseInstances } from '~/utils/firebase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string,
    databaseURL: config.public.firebaseDatabaseUrl as string,
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const rtdb = getDatabase(app)
  const storage = getStorage(app)

  // Store in module singleton — works everywhere, even in async Pinia actions
  setFirebaseInstances(auth, rtdb, storage)
})
