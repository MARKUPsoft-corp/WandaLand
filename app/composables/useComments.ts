// ========================================
// useComments — Firebase Realtime Database
// ========================================

import {
  ref as dbRef,
  push,
  set,
  remove,
  get,
  update,
  onValue,
  type Unsubscribe,
} from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'
import type { Comment } from '~/types'

export const useComments = (postId: string) => {
  const comments = ref<Comment[]>([])
  const loading = ref(true)
  let unsubscribe: Unsubscribe | null = null

  const listen = () => {
    const rtdb = getFirebaseRtdb()
    const commentsRef = dbRef(rtdb, `posts/${postId}/comments`)

    unsubscribe = onValue(commentsRef, (snapshot) => {
      const result: Comment[] = []
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const d = child.val()
          result.push({
            id: child.key!,
            content: d.content || '',
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
            parentId: d.parentId || undefined,
            replyToUsername: d.replyToUsername || undefined,
            likesCount: d.likesCount || 0,
            likes: d.likes || {},
            author: {
              id: d.authorId || '',
              username: d.authorUsername || '',
              displayName: d.authorDisplayName || '',
              avatarUrl: d.authorAvatarUrl || '',
            },
          })
        })
      }
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      comments.value = result
      loading.value = false
    })
  }

  const addComment = async (content: string, parentId?: string, replyToUsername?: string) => {
    const rtdb = getFirebaseRtdb()
    const authStore = useAuthStore()
    if (!authStore.user || !authStore.firebaseUid) throw new Error('Not authenticated')

    const commentData: Record<string, any> = {
      content,
      authorId: authStore.firebaseUid,
      authorUsername: authStore.user.username,
      authorDisplayName: authStore.user.displayName,
      authorAvatarUrl: authStore.user.avatarUrl || '',
      createdAt: Date.now(),
      likesCount: 0,
    }

    if (parentId) {
      commentData.parentId = parentId
    }
    if (replyToUsername) {
      commentData.replyToUsername = replyToUsername
    }

    const newRef = push(dbRef(rtdb, `posts/${postId}/comments`))
    await set(newRef, commentData)

    const countSnap = await get(dbRef(rtdb, `posts/${postId}/commentsCount`))
    const currentCount = countSnap.exists() ? countSnap.val() : 0
    await set(dbRef(rtdb, `posts/${postId}/commentsCount`), currentCount + 1)

    // Send notification if replying to someone's comment
    if (parentId) {
      try {
        const parentSnap = await get(dbRef(rtdb, `posts/${postId}/comments/${parentId}`))
        if (parentSnap.exists()) {
          const parentComment = parentSnap.val()
          if (parentComment.authorId && parentComment.authorId !== authStore.firebaseUid) {
            const { sendNotification } = await import('~/composables/useNotifications')
            await sendNotification(parentComment.authorId, {
              type: 'comment_reply',
              fromUserId: authStore.firebaseUid,
              fromDisplayName: authStore.user.displayName,
              fromAvatarUrl: authStore.user.avatarUrl || '',
              postId,
              commentPreview: content.length > 60 ? content.substring(0, 60) + '...' : content,
            })
          }
        }
      } catch (_) { /* silent */ }
    }

    // Track interest: commenting = +1 weight on post hashtags
    try {
      const postSnap = await get(dbRef(rtdb, `posts/${postId}/hashtags`))
      if (postSnap.exists()) {
        const postsStore = usePostsStore()
        await postsStore.trackInterest(postSnap.val(), 1)
      }
    } catch (_) { /* silent */ }
  }

  const toggleCommentLike = async (commentId: string) => {
    const rtdb = getFirebaseRtdb()
    const authStore = useAuthStore()
    if (!authStore.firebaseUid) return

    const likeRef = dbRef(rtdb, `posts/${postId}/comments/${commentId}/likes/${authStore.firebaseUid}`)
    const snap = await get(likeRef)

    if (snap.exists()) {
      await remove(likeRef)
      const countSnap = await get(dbRef(rtdb, `posts/${postId}/comments/${commentId}/likesCount`))
      const c = countSnap.exists() ? countSnap.val() : 0
      await set(dbRef(rtdb, `posts/${postId}/comments/${commentId}/likesCount`), Math.max(0, c - 1))
    } else {
      await set(likeRef, true)
      const countSnap = await get(dbRef(rtdb, `posts/${postId}/comments/${commentId}/likesCount`))
      const c = countSnap.exists() ? countSnap.val() : 0
      await set(dbRef(rtdb, `posts/${postId}/comments/${commentId}/likesCount`), c + 1)

      // Notify comment author
      try {
        const commentSnap = await get(dbRef(rtdb, `posts/${postId}/comments/${commentId}`))
        if (commentSnap.exists()) {
          const comment = commentSnap.val()
          if (comment.authorId && comment.authorId !== authStore.firebaseUid) {
            const { sendNotification } = await import('~/composables/useNotifications')
            await sendNotification(comment.authorId, {
              type: 'comment_like',
              fromUserId: authStore.firebaseUid,
              fromDisplayName: authStore.user?.displayName || '',
              fromAvatarUrl: authStore.user?.avatarUrl || '',
              postId,
              commentPreview: comment.content?.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content,
            })
          }
        }
      } catch (_) { /* silent */ }
    }
  }

  const deleteComment = async (commentId: string) => {
    const rtdb = getFirebaseRtdb()
    await remove(dbRef(rtdb, `posts/${postId}/comments/${commentId}`))

    const countSnap = await get(dbRef(rtdb, `posts/${postId}/commentsCount`))
    const currentCount = countSnap.exists() ? countSnap.val() : 0
    await set(dbRef(rtdb, `posts/${postId}/commentsCount`), Math.max(0, currentCount - 1))
  }

  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    comments,
    loading,
    listen,
    addComment,
    toggleCommentLike,
    deleteComment,
    stopListening,
  }
}
