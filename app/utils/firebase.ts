// ========================================
// Firebase Singleton — Module-level access
// ========================================
// This module stores Firebase instances set by the plugin.
// Unlike useNuxtApp(), this works everywhere (Pinia actions, composables, etc.)

import type { Auth } from 'firebase/auth'
import type { Database } from 'firebase/database'
import type { FirebaseStorage } from 'firebase/storage'

let _auth: Auth
let _rtdb: Database
let _storage: FirebaseStorage
let _initialized = false

export const setFirebaseInstances = (auth: Auth, rtdb: Database, storage: FirebaseStorage) => {
  _auth = auth
  _rtdb = rtdb
  _storage = storage
  _initialized = true
}

export const getFirebaseAuth = (): Auth => {
  if (!_initialized) throw new Error('[Firebase] Not initialized yet')
  return _auth
}

export const getFirebaseRtdb = (): Database => {
  if (!_initialized) throw new Error('[Firebase] Not initialized yet')
  return _rtdb
}

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!_initialized) throw new Error('[Firebase] Not initialized yet')
  return _storage
}
