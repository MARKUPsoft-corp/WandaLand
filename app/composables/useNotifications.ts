// ========================================
// useNotifications — Firebase Realtime Database
// ========================================

import {
  ref as dbRef,
  push,
  set,
  get,
  onValue,
  update,
  query,
  orderByChild,
  limitToLast,
  type Unsubscribe,
} from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'

export interface Notification {
  id: string
  type: 'comment_reply' | 'new_follower' | 'unfollow' | 'post_like' | 'comment_like'
  fromUserId: string
  fromDisplayName: string
  fromAvatarUrl: string
  postId?: string
  commentPreview?: string
  postPreview?: string
  read: boolean
  createdAt: number
}

// Singleton state shared across all uses
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
let _unsub: Unsubscribe | null = null
let _listening = false

export const useNotifications = () => {

  const listen = () => {
    if (_listening) return
    const authStore = useAuthStore()
    if (!authStore.firebaseUid) return

    _listening = true
    const rtdb = getFirebaseRtdb()
    const notifsRef = query(
      dbRef(rtdb, `notifications/${authStore.firebaseUid}`),
      orderByChild('createdAt'),
      limitToLast(50)
    )

    _unsub = onValue(notifsRef, (snap) => {
      const items: Notification[] = []
      if (snap.exists()) {
        snap.forEach((child) => {
          const d = child.val()
          items.push({
            id: child.key!,
            type: d.type,
            fromUserId: d.fromUserId || '',
            fromDisplayName: d.fromDisplayName || '',
            fromAvatarUrl: d.fromAvatarUrl || '',
            postId: d.postId || undefined,
            commentPreview: d.commentPreview || undefined,
            postPreview: d.postPreview || undefined,
            read: !!d.read,
            createdAt: d.createdAt || 0,
          })
        })
      }
      // Newest first
      notifications.value = items.reverse()
      unreadCount.value = items.filter(n => !n.read).length
    })
  }

  const stopListening = () => {
    if (_unsub) { _unsub(); _unsub = null }
    _listening = false
  }

  const markAsRead = async (notifId: string) => {
    const authStore = useAuthStore()
    if (!authStore.firebaseUid) return
    const rtdb = getFirebaseRtdb()
    await update(dbRef(rtdb, `notifications/${authStore.firebaseUid}/${notifId}`), { read: true })
  }

  const markAllAsRead = async () => {
    const authStore = useAuthStore()
    if (!authStore.firebaseUid) return
    const rtdb = getFirebaseRtdb()
    const updates: Record<string, any> = {}
    for (const n of notifications.value) {
      if (!n.read) {
        updates[`${n.id}/read`] = true
      }
    }
    if (Object.keys(updates).length > 0) {
      await update(dbRef(rtdb, `notifications/${authStore.firebaseUid}`), updates)
    }
  }

  return {
    notifications,
    unreadCount,
    listen,
    stopListening,
    markAsRead,
    markAllAsRead,
  }
}

// Helper: send a notification to a user
export const sendNotification = async (
  toUserId: string,
  data: {
    type: 'comment_reply' | 'new_follower' | 'unfollow' | 'post_like' | 'comment_like'
    fromUserId: string
    fromDisplayName: string
    fromAvatarUrl: string
    postId?: string
    commentPreview?: string
    postPreview?: string
  }
) => {
  // Don't notify yourself
  if (toUserId === data.fromUserId) return

  const rtdb = getFirebaseRtdb()
  const newRef = push(dbRef(rtdb, `notifications/${toUserId}`))
  await set(newRef, {
    ...data,
    read: false,
    createdAt: Date.now(),
  })
}
