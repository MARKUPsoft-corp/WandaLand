// ========================================
// useFollow — Firebase Realtime Database
// ========================================

import {
  ref as dbRef,
  set,
  remove,
  get,
  onValue,
  type Unsubscribe,
} from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'

export const useFollow = (targetUserId: string) => {
  const isFollowing = ref(false)
  const followersCount = ref(0)
  const followingCount = ref(0)
  const loading = ref(false)

  let unsubFollowers: Unsubscribe | null = null
  let unsubFollowing: Unsubscribe | null = null

  const listen = () => {
    const rtdb = getFirebaseRtdb()
    const authStore = useAuthStore()

    // Listen to followers count (realtime)
    unsubFollowers = onValue(dbRef(rtdb, `followers/${targetUserId}`), (snap) => {
      if (snap.exists()) {
        followersCount.value = Object.keys(snap.val()).length
        // Check if current user is following
        if (authStore.firebaseUid) {
          isFollowing.value = !!snap.val()[authStore.firebaseUid]
        }
      } else {
        followersCount.value = 0
        isFollowing.value = false
      }
    })

    // Listen to following count (realtime)
    unsubFollowing = onValue(dbRef(rtdb, `following/${targetUserId}`), (snap) => {
      followingCount.value = snap.exists() ? Object.keys(snap.val()).length : 0
    })
  }

  const follow = async () => {
    const rtdb = getFirebaseRtdb()
    const authStore = useAuthStore()
    if (!authStore.firebaseUid || authStore.firebaseUid === targetUserId) return

    loading.value = true
    try {
      // Add to my following list
      await set(dbRef(rtdb, `following/${authStore.firebaseUid}/${targetUserId}`), true)
      // Add to their followers list
      await set(dbRef(rtdb, `followers/${targetUserId}/${authStore.firebaseUid}`), true)

      // Send notification
      const { sendNotification } = await import('~/composables/useNotifications')
      await sendNotification(targetUserId, {
        type: 'new_follower',
        fromUserId: authStore.firebaseUid,
        fromDisplayName: authStore.user?.displayName || '',
        fromAvatarUrl: authStore.user?.avatarUrl || '',
      })

      isFollowing.value = true
    } catch (err) {
      console.error('[useFollow] follow error:', err)
    } finally {
      loading.value = false
    }
  }

  const unfollow = async () => {
    const rtdb = getFirebaseRtdb()
    const authStore = useAuthStore()
    if (!authStore.firebaseUid) return

    loading.value = true
    try {
      // Remove from my following list
      await remove(dbRef(rtdb, `following/${authStore.firebaseUid}/${targetUserId}`))
      // Remove from their followers list
      await remove(dbRef(rtdb, `followers/${targetUserId}/${authStore.firebaseUid}`))

      // Send notification
      const { sendNotification } = await import('~/composables/useNotifications')
      await sendNotification(targetUserId, {
        type: 'unfollow',
        fromUserId: authStore.firebaseUid,
        fromDisplayName: authStore.user?.displayName || '',
        fromAvatarUrl: authStore.user?.avatarUrl || '',
      })

      isFollowing.value = false
    } catch (err) {
      console.error('[useFollow] unfollow error:', err)
    } finally {
      loading.value = false
    }
  }

  const toggleFollow = async () => {
    if (isFollowing.value) {
      await unfollow()
    } else {
      await follow()
    }
  }

  const fetchUserList = async (path: string) => {
    const rtdb = getFirebaseRtdb()
    const snap = await get(dbRef(rtdb, path))
    if (!snap.exists()) return []

    const userIds = Object.keys(snap.val())
    const users: { id: string; displayName: string; username: string; avatarUrl: string }[] = []

    for (const uid of userIds) {
      const userSnap = await get(dbRef(rtdb, `users/${uid}`))
      if (userSnap.exists()) {
        const u = userSnap.val()
        users.push({
          id: uid,
          displayName: u.displayName || '',
          username: u.username || '',
          avatarUrl: u.avatarUrl || '',
        })
      }
    }
    return users
  }

  const fetchFollowersList = () => fetchUserList(`followers/${targetUserId}`)
  const fetchFollowingList = () => fetchUserList(`following/${targetUserId}`)

  const stopListening = () => {
    if (unsubFollowers) { unsubFollowers(); unsubFollowers = null }
    if (unsubFollowing) { unsubFollowing(); unsubFollowing = null }
  }

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    listen,
    toggleFollow,
    fetchFollowersList,
    fetchFollowingList,
    stopListening,
  }
}
