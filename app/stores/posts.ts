// ========================================
// Store — Posts (Firebase Realtime Database)
// ========================================

import { defineStore } from 'pinia'
import {
  ref as dbRef,
  push,
  set,
  remove,
  get,
  increment,
  onChildAdded,
  onChildRemoved,
  onChildChanged,
  query,
  orderByChild,
  limitToLast,
  type Unsubscribe,
} from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'
import type { Post } from '~/types'
import { extractHashtags } from '~/types'

const POSTS_PER_PAGE = 20

// Helper: map RTDB snapshot data to Post
const mapPost = (key: string, d: any, firebaseUid?: string): Post => ({
  id: key,
  content: d.content || '',
  imageUrl: d.imageUrl || undefined,
  hashtags: d.hashtags || [],
  createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
  author: {
    id: d.authorId || '',
    username: d.authorUsername || '',
    displayName: d.authorDisplayName || '',
    avatarUrl: d.authorAvatarUrl || '',
  },
  _count: {
    likes: d.likesCount || 0,
    comments: d.commentsCount || 0,
  },
  isLiked: firebaseUid ? !!(d.likes && d.likes[firebaseUid]) : false,
})

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [] as Post[],
    currentPost: null as Post | null,
    loading: false,
    hasMore: true,
    hashtag: null as string | null,
    userInterests: {} as Record<string, number>,
    followingList: [] as string[],
    seenPosts: new Set<string>(),
    _unsubAdd: null as Unsubscribe | null,
    _unsubRemove: null as Unsubscribe | null,
    _unsubChange: null as Unsubscribe | null,
  }),

  getters: {
    page: () => 1,
    totalPages(state) {
      return state.hasMore ? 2 : 1
    },

    filteredPosts(state): Post[] {
      let posts = state.posts

      // Filter by hashtag if selected
      if (state.hashtag) {
        posts = posts.filter(p => p.hashtags.includes(state.hashtag!))
      }

      const following = state.followingList
      const interests = state.userInterests
      const hasPersonalization = following.length > 0 || Object.keys(interests).length > 0

      // No followings/interests → pure chronological (newest first)
      if (!hasPersonalization) return posts

      // Smart scoring
      const scored = posts.map(post => {
        let score = 0

        // UNSEEN BOOST: posts you haven't seen yet always float to top
        if (!state.seenPosts.has(post.id)) {
          score += 200
        }

        // Following boost: posts from people you follow
        if (following.includes(post.author.id)) {
          score += 100
        }

        // Interest score: hashtag affinity
        for (const tag of post.hashtags) {
          if (interests[tag]) {
            score += interests[tag] * 10
          }
        }

        // Engagement score
        score += (post._count.likes * 2) + (post._count.comments * 3)

        // Recency bonus
        const ageMs = Date.now() - new Date(post.createdAt).getTime()
        const ageHours = ageMs / (1000 * 60 * 60)
        if (ageHours < 1) score += 50
        else if (ageHours < 6) score += 30
        else if (ageHours < 24) score += 10

        return { post, score }
      })

      return scored
        .sort((a, b) => b.score - a.score)
        .map(s => s.post)
    },
  },

  actions: {
    // Load user's interest profile from RTDB
    async loadUserInterests() {
      const authStore = useAuthStore()
      if (!authStore.firebaseUid) return

      try {
        const rtdb = getFirebaseRtdb()
        const snap = await get(dbRef(rtdb, `userInterests/${authStore.firebaseUid}`))
        if (snap.exists()) {
          this.userInterests = snap.val()
        }

        // Also load following list
        const followSnap = await get(dbRef(rtdb, `following/${authStore.firebaseUid}`))
        if (followSnap.exists()) {
          this.followingList = Object.keys(followSnap.val())
        }
      } catch (err) {
        console.error('[PostsStore] loadUserInterests error:', err)
      }
    },

    // Track interest: increment score for hashtags when user interacts
    async trackInterest(hashtags: string[], weight: number) {
      const authStore = useAuthStore()
      if (!authStore.firebaseUid || hashtags.length === 0) return

      try {
        const rtdb = getFirebaseRtdb()
        for (const tag of hashtags) {
          const ref = dbRef(rtdb, `userInterests/${authStore.firebaseUid}/${tag}`)
          const snap = await get(ref)
          const current = snap.exists() ? snap.val() : 0
          await set(ref, Math.max(0, current + weight))

          // Update local state too
          this.userInterests[tag] = Math.max(0, (this.userInterests[tag] || 0) + weight)
        }
      } catch (err) {
        console.error('[PostsStore] trackInterest error:', err)
      }
    },

    async fetchPosts(reset = false) {
      if (reset) {
        this.posts = []
        this.hasMore = true
        this.stopListeners()
      }

      this.loading = true
      try {
        const rtdb = getFirebaseRtdb()
        const postsRef = dbRef(rtdb, 'posts')
        const q = query(postsRef, orderByChild('createdAt'), limitToLast(POSTS_PER_PAGE))
        const snapshot = await get(q)

        const posts: Post[] = []
        if (snapshot.exists()) {
          const authStore = useAuthStore()
          snapshot.forEach((child) => {
            const d = child.val()
            posts.push(mapPost(child.key!, d, authStore.firebaseUid || undefined))
          })
        }

        this.posts = posts.reverse()
        this.hasMore = false

        // Load interests for personalized sorting
        await this.loadUserInterests()

        if (reset) this.setupListeners()
      } catch (err) {
        console.error('[PostsStore] fetchPosts error:', err)
      } finally {
        this.loading = false
      }
    },

    setupListeners() {
      try {
        const rtdb = getFirebaseRtdb()
        const postsRef = dbRef(rtdb, 'posts')
        let isFirst = true

        this._unsubAdd = onChildAdded(query(postsRef, orderByChild('createdAt'), limitToLast(1)), (snapshot) => {
          if (isFirst) { isFirst = false; return }
          if (!snapshot.key || !snapshot.exists()) return

          const d = snapshot.val()
          const authStore = useAuthStore()
          const newPost = mapPost(snapshot.key, d, authStore.firebaseUid || undefined)

          if (!this.posts.find((p) => p.id === newPost.id)) {
            this.posts.unshift(newPost)
          }
        })

        this._unsubRemove = onChildRemoved(postsRef, (snapshot) => {
          if (snapshot.key) {
            this.posts = this.posts.filter((p) => p.id !== snapshot.key)
          }
        })

        this._unsubChange = onChildChanged(postsRef, (snapshot) => {
          if (!snapshot.key) return
          const idx = this.posts.findIndex((p) => p.id === snapshot.key)
          if (idx !== -1) {
            const d = snapshot.val()
            const authStore = useAuthStore()
            const old = this.posts[idx]!
            this.posts[idx] = {
              ...old,
              content: d.content || old.content,
              imageUrl: d.imageUrl || old.imageUrl,
              hashtags: d.hashtags || old.hashtags,
              _count: {
                likes: d.likesCount || 0,
                comments: d.commentsCount || 0,
              },
              isLiked: authStore.firebaseUid ? !!(d.likes && d.likes[authStore.firebaseUid]) : false,
            } as Post
          }
        })
      } catch (err) {
        console.error('[PostsStore] setupListeners error:', err)
      }
    },

    stopListeners() {
      if (this._unsubAdd) { this._unsubAdd(); this._unsubAdd = null }
      if (this._unsubRemove) { this._unsubRemove(); this._unsubRemove = null }
      if (this._unsubChange) { this._unsubChange(); this._unsubChange = null }
    },

    async fetchPost(id: string) {
      const rtdb = getFirebaseRtdb()
      const snapshot = await get(dbRef(rtdb, `posts/${id}`))
      if (snapshot.exists()) {
        const d = snapshot.val()
        const authStore = useAuthStore()
        this.currentPost = mapPost(id, d, authStore.firebaseUid || undefined)
      }
    },

    async createPost(content: string, imageUrl?: string) {
      const rtdb = getFirebaseRtdb()
      const authStore = useAuthStore()

      if (!authStore.user || !authStore.firebaseUid) {
        console.error('[PostsStore] createPost: Not authenticated!')
        throw new Error('Not authenticated')
      }

      const hashtags = extractHashtags(content)

      const postData: Record<string, any> = {
        content,
        hashtags,
        authorId: authStore.firebaseUid,
        authorUsername: authStore.user.username,
        authorDisplayName: authStore.user.displayName,
        authorAvatarUrl: authStore.user.avatarUrl || '',
        likesCount: 0,
        commentsCount: 0,
        createdAt: Date.now(),
      }

      if (imageUrl) {
        postData.imageUrl = imageUrl
      }

      const newRef = push(dbRef(rtdb, 'posts'))
      await set(newRef, postData)

      // Increment global hashtag counters
      for (const tag of hashtags) {
        const tagCountRef = dbRef(rtdb, `hashtags/${tag}/count`)
        const snap = await get(tagCountRef)
        const current = snap.exists() ? snap.val() : 0
        await set(tagCountRef, current + 1)
      }

      const newPost: Post = {
        id: newRef.key!,
        content,
        imageUrl: imageUrl || undefined,
        hashtags,
        createdAt: new Date().toISOString(),
        author: {
          id: authStore.firebaseUid,
          username: authStore.user.username,
          displayName: authStore.user.displayName,
          avatarUrl: authStore.user.avatarUrl || '',
        },
        _count: { likes: 0, comments: 0 },
        isLiked: false,
      }

      if (!this.posts.find((p) => p.id === newPost.id)) {
        this.posts.unshift(newPost)
      }

      return newPost
    },

    async toggleLike(postId: string) {
      const rtdb = getFirebaseRtdb()
      const authStore = useAuthStore()
      if (!authStore.firebaseUid) return

      const likeRef = dbRef(rtdb, `posts/${postId}/likes/${authStore.firebaseUid}`)
      const likeSnap = await get(likeRef)
      const post = this.posts.find((p) => p.id === postId)

      if (likeSnap.exists()) {
        // Unlike
        await remove(likeRef)
        if (post) {
          post.isLiked = false
          post._count.likes = Math.max(0, post._count.likes - 1)
          await set(dbRef(rtdb, `posts/${postId}/likesCount`), post._count.likes)
          // Decrease interest for these hashtags
          await this.trackInterest(post.hashtags, -2)
        }
      } else {
        // Like
        await set(likeRef, true)
        if (post) {
          post.isLiked = true
          post._count.likes += 1
          await set(dbRef(rtdb, `posts/${postId}/likesCount`), post._count.likes)
          // Increase interest for these hashtags
          await this.trackInterest(post.hashtags, 2)

          // Notify post author
          if (post.author.id !== authStore.firebaseUid) {
            try {
              const { sendNotification } = await import('~/composables/useNotifications')
              await sendNotification(post.author.id, {
                type: 'post_like',
                fromUserId: authStore.firebaseUid,
                fromDisplayName: authStore.user?.displayName || '',
                fromAvatarUrl: authStore.user?.avatarUrl || '',
                postId,
                postPreview: post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content,
              })
            } catch (_) { /* silent */ }
          }
        }
      }

      if (this.currentPost?.id === postId && post) {
        this.currentPost.isLiked = post.isLiked
        this.currentPost._count.likes = post._count.likes
      }
    },

    async deletePost(postId: string) {
      const rtdb = getFirebaseRtdb()

      // Decrement hashtag counters before deleting
      const post = this.posts.find(p => p.id === postId)
      if (post) {
        for (const tag of post.hashtags) {
          const tagCountRef = dbRef(rtdb, `hashtags/${tag}/count`)
          const snap = await get(tagCountRef)
          const current = snap.exists() ? snap.val() : 0
          await set(tagCountRef, Math.max(0, current - 1))
        }
      }

      await remove(dbRef(rtdb, `posts/${postId}`))
      this.posts = this.posts.filter((p) => p.id !== postId)
    },

    setHashtag(tag: string | null) {
      this.hashtag = tag
    },

    // Mark posts as seen (called from feed page when posts render on screen)
    markAsSeen(postIds: string[]) {
      let changed = false
      for (const id of postIds) {
        if (!this.seenPosts.has(id)) {
          this.seenPosts.add(id)
          changed = true
        }
      }
      // Persist to localStorage
      if (changed) {
        const authStore = useAuthStore()
        if (authStore.firebaseUid) {
          const key = `wandaland_seen_${authStore.firebaseUid}`
          // Keep only last 200 seen posts to avoid bloat
          const arr = [...this.seenPosts].slice(-200)
          localStorage.setItem(key, JSON.stringify(arr))
        }
      }
    },

    // Load seen posts from localStorage
    loadSeenPosts() {
      const authStore = useAuthStore()
      if (!authStore.firebaseUid) return
      try {
        const key = `wandaland_seen_${authStore.firebaseUid}`
        const stored = localStorage.getItem(key)
        if (stored) {
          const arr = JSON.parse(stored) as string[]
          this.seenPosts = new Set(arr)
        }
      } catch (_) { /* ignore */ }
    },

    async loadMore() {
      // RTDB loads all at once with limitToLast
    },
  },
})
