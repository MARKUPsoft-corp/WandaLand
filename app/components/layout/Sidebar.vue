<template>
  <nav class="d-flex flex-column gap-1">
    <h6 class="text-wanda-muted text-uppercase small fw-bold mb-2 px-2">Navigation</h6>

    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-link-item d-flex align-items-center gap-3 py-2 px-3 rounded-2 text-decoration-none"
      :class="{ active: route.path === item.to }"
    >
      <i :class="item.icon" class="fs-5"></i>
      <span class="fw-medium">{{ item.label }}</span>
    </NuxtLink>

    <button
      v-if="authStore.isAuthenticated"
      class="nav-link-item d-flex align-items-center gap-3 py-2 px-3 rounded-2 text-decoration-none border-0 bg-transparent text-start w-100"
      @click="postModal.open()"
    >
      <i class="bi bi-plus-circle fs-5"></i>
      <span class="fw-medium">Nouveau Wanda</span>
    </button>

    <template v-if="authStore.isAuthenticated">
      <hr class="my-3" />

      <h6 class="text-wanda-muted text-uppercase small fw-bold mb-2 px-2">
        <i class="bi bi-people me-1"></i>Abonnements
      </h6>

      <div v-if="loadingFollowing" class="px-3 py-2">
        <div class="spinner-border spinner-border-sm text-primary"></div>
      </div>

      <div v-else-if="followingUsers.length === 0" class="px-3 py-2 text-wanda-muted small">
        Aucun abonnement
      </div>

      <div
        v-for="u in followingUsers"
        :key="'following-' + u.id"
        class="follow-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
      >
        <NuxtLink :to="`/profile/${u.id}`" class="d-flex align-items-center gap-2 text-decoration-none flex-grow-1 min-w-0">
          <div v-if="u.avatarUrl" class="sidebar-avatar">
            <img :src="u.avatarUrl" :alt="u.displayName" />
          </div>
          <div v-else class="sidebar-avatar sidebar-avatar-initials">
            {{ u.displayName.charAt(0).toUpperCase() }}
          </div>
          <span class="fw-medium text-truncate sidebar-name">{{ u.displayName }}</span>
        </NuxtLink>
        <button
          class="btn btn-sm btn-outline-secondary rounded-pill fw-bold px-2 flex-shrink-0 sidebar-follow-btn"
          @click="toggleFollow(u)"
        >
          <i class="bi bi-check-lg" style="font-size: 0.75rem;"></i>
        </button>
      </div>

      <hr class="my-3" />

      <h6 class="text-wanda-muted text-uppercase small fw-bold mb-2 px-2">
        <i class="bi bi-people-fill me-1"></i>Abonnés
      </h6>

      <div v-if="followerUsers.length === 0 && !loadingFollowing" class="px-3 py-2 text-wanda-muted small">
        Aucun abonné
      </div>

      <div
        v-for="u in followerUsers"
        :key="'follower-' + u.id"
        class="follow-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
      >
        <NuxtLink :to="`/profile/${u.id}`" class="d-flex align-items-center gap-2 text-decoration-none flex-grow-1 min-w-0">
          <div v-if="u.avatarUrl" class="sidebar-avatar">
            <img :src="u.avatarUrl" :alt="u.displayName" />
          </div>
          <div v-else class="sidebar-avatar sidebar-avatar-initials">
            {{ u.displayName.charAt(0).toUpperCase() }}
          </div>
          <span class="fw-medium text-truncate sidebar-name">{{ u.displayName }}</span>
        </NuxtLink>
        <button
          v-if="!u.isFollowed"
          class="btn btn-sm btn-primary rounded-pill fw-bold px-2 flex-shrink-0 sidebar-follow-btn"
          @click="followBack(u)"
        >
          <i class="bi bi-person-plus" style="font-size: 0.75rem;"></i>
        </button>
        <span v-else class="text-wanda-muted" style="font-size: 0.7rem;"><i class="bi bi-check-lg"></i></span>
      </div>

      <hr class="my-3" />

      <h6 class="text-wanda-muted text-uppercase small fw-bold mb-2 px-2">
        <i class="bi bi-lightbulb me-1"></i>Suggestions
      </h6>

      <div v-if="suggestions.length === 0 && !loadingFollowing" class="px-3 py-2 text-wanda-muted small">
        Aucune suggestion
      </div>

      <div
        v-for="u in suggestions"
        :key="'suggest-' + u.id"
        class="follow-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
      >
        <NuxtLink :to="`/profile/${u.id}`" class="d-flex align-items-center gap-2 text-decoration-none flex-grow-1 min-w-0">
          <div v-if="u.avatarUrl" class="sidebar-avatar">
            <img :src="u.avatarUrl" :alt="u.displayName" />
          </div>
          <div v-else class="sidebar-avatar sidebar-avatar-initials">
            {{ u.displayName.charAt(0).toUpperCase() }}
          </div>
          <span class="fw-medium text-truncate sidebar-name">{{ u.displayName }}</span>
        </NuxtLink>
        <button
          class="btn btn-sm btn-primary rounded-pill fw-bold px-2 flex-shrink-0 sidebar-follow-btn"
          @click="followSuggestion(u)"
        >
          <i class="bi bi-person-plus" style="font-size: 0.75rem;"></i>
        </button>
      </div>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { ref as dbRef, get, set, remove, onValue, type Unsubscribe } from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'

const route = useRoute()
const authStore = useAuthStore()
const postModal = usePostModal()

const navItems = [
  { to: '/', icon: 'bi bi-house', label: 'Accueil' },
]

interface SidebarUser {
  id: string
  displayName: string
  username: string
  avatarUrl: string
  isFollowed: boolean
}

const followingUsers = ref<SidebarUser[]>([])
const followerUsers = ref<SidebarUser[]>([])
const suggestions = ref<SidebarUser[]>([])
const loadingFollowing = ref(true)
let unsubFollowing: Unsubscribe | null = null
let unsubFollowers: Unsubscribe | null = null

const loadUserProfile = async (uid: string, isFollowed = true): Promise<SidebarUser | null> => {
  const rtdb = getFirebaseRtdb()
  const snap = await get(dbRef(rtdb, `users/${uid}`))
  if (!snap.exists()) return null
  const u = snap.val()
  return {
    id: uid,
    displayName: u.displayName || '',
    username: u.username || '',
    avatarUrl: u.avatarUrl || '',
    isFollowed,
  }
}

const loadSuggestions = async (followingIds: string[]) => {
  const rtdb = getFirebaseRtdb()
  const usersSnap = await get(dbRef(rtdb, 'users'))
  if (!usersSnap.exists()) return

  const allSuggestions: SidebarUser[] = []
  usersSnap.forEach((child) => {
    const uid = child.key!
    if (uid === authStore.firebaseUid || followingIds.includes(uid)) return
    const u = child.val()
    allSuggestions.push({
      id: uid,
      displayName: u.displayName || '',
      username: u.username || '',
      avatarUrl: u.avatarUrl || '',
      isFollowed: false,
    })
  })
  suggestions.value = allSuggestions.slice(0, 5)
}

onMounted(() => {
  if (!authStore.firebaseUid) {
    loadingFollowing.value = false
    return
  }

  const rtdb = getFirebaseRtdb()

  // Listen to who I follow
  unsubFollowing = onValue(dbRef(rtdb, `following/${authStore.firebaseUid}`), async (snap) => {
    const users: SidebarUser[] = []
    const followingIds: string[] = []

    if (snap.exists()) {
      const ids = Object.keys(snap.val())
      for (const uid of ids) {
        followingIds.push(uid)
        const profile = await loadUserProfile(uid, true)
        if (profile) users.push(profile)
      }
    }

    followingUsers.value = users
    loadingFollowing.value = false
    await loadSuggestions(followingIds)

    // Update follower list: recheck which followers I follow back
    updateFollowersFollowBack(followingIds)
  })

  // Listen to who follows me
  unsubFollowers = onValue(dbRef(rtdb, `followers/${authStore.firebaseUid}`), async (snap) => {
    const users: SidebarUser[] = []
    const myFollowingIds = followingUsers.value.map(u => u.id)

    if (snap.exists()) {
      const ids = Object.keys(snap.val())
      for (const uid of ids) {
        const profile = await loadUserProfile(uid, myFollowingIds.includes(uid))
        if (profile) users.push(profile)
      }
    }

    followerUsers.value = users
  })
})

const updateFollowersFollowBack = (followingIds: string[]) => {
  for (const f of followerUsers.value) {
    f.isFollowed = followingIds.includes(f.id)
  }
}

onUnmounted(() => {
  if (unsubFollowing) unsubFollowing()
  if (unsubFollowers) unsubFollowers()
})

const toggleFollow = async (u: SidebarUser) => {
  const rtdb = getFirebaseRtdb()
  if (!authStore.firebaseUid) return

  // Unfollow
  await remove(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`))
  await remove(dbRef(rtdb, `followers/${u.id}/${authStore.firebaseUid}`))

  try {
    const { sendNotification } = await import('~/composables/useNotifications')
    await sendNotification(u.id, {
      type: 'unfollow',
      fromUserId: authStore.firebaseUid,
      fromDisplayName: authStore.user?.displayName || '',
      fromAvatarUrl: authStore.user?.avatarUrl || '',
    })
  } catch (_) { /* silent */ }
}

const followSuggestion = async (u: SidebarUser) => {
  const rtdb = getFirebaseRtdb()
  if (!authStore.firebaseUid) return

  await set(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`), true)
  await set(dbRef(rtdb, `followers/${u.id}/${authStore.firebaseUid}`), true)

  try {
    const { sendNotification } = await import('~/composables/useNotifications')
    await sendNotification(u.id, {
      type: 'new_follower',
      fromUserId: authStore.firebaseUid,
      fromDisplayName: authStore.user?.displayName || '',
      fromAvatarUrl: authStore.user?.avatarUrl || '',
    })
  } catch (_) { /* silent */ }
}

const followBack = async (u: SidebarUser) => {
  const rtdb = getFirebaseRtdb()
  if (!authStore.firebaseUid) return

  await set(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`), true)
  await set(dbRef(rtdb, `followers/${u.id}/${authStore.firebaseUid}`), true)

  try {
    const { sendNotification } = await import('~/composables/useNotifications')
    await sendNotification(u.id, {
      type: 'new_follower',
      fromUserId: authStore.firebaseUid,
      fromDisplayName: authStore.user?.displayName || '',
      fromAvatarUrl: authStore.user?.avatarUrl || '',
    })
  } catch (_) { /* silent */ }
}
</script>

<style scoped lang="scss">
.nav-link-item {
  color: var(--wanda-text-muted);
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    color: #2563EB;
    background: rgba(37, 99, 235, 0.08);
  }

  &.active {
    color: #2563EB;
    background: rgba(37, 99, 235, 0.12);
    font-weight: 600;
  }
}

.follow-item {
  transition: background 0.15s;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
  }
}

.sidebar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.sidebar-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.sidebar-name {
  font-size: 0.85rem;
  color: var(--wanda-text);
}

.sidebar-follow-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
