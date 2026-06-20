<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else-if="user">
      <!-- Profile Header -->
      <div class="profile-header card border-wanda mb-3 overflow-hidden">
        <!-- Cover Photo -->
        <div
          class="profile-cover"
          :style="user.coverUrl ? { backgroundImage: `url(${user.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
        >
          <button
            v-if="isOwnProfile"
            class="cover-edit-btn"
            @click="($refs.coverInput as HTMLInputElement).click()"
          >
            <i class="bi bi-camera-fill"></i>
          </button>
          <input
            ref="coverInput"
            type="file"
            accept="image/*"
            hidden
            @change="handleCoverUpload"
          />
        </div>

        <!-- Profile Info Card Body -->
        <div class="profile-body">
          <!-- Avatar Row -->
          <div class="profile-avatar-row">
            <div class="profile-avatar-wrapper">
              <div v-if="user.avatarUrl" class="profile-avatar">
                <img :src="user.avatarUrl" :alt="user.displayName" />
              </div>
              <div v-else class="profile-avatar profile-avatar-initials">
                {{ userInitial }}
              </div>
              <button
                v-if="isOwnProfile"
                class="avatar-edit-btn"
                @click="($refs.avatarInput as HTMLInputElement).click()"
              >
                <i class="bi bi-camera-fill"></i>
              </button>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                hidden
                @change="handleAvatarUpload"
              />
            </div>

            <!-- Edit Button (sits next to avatar row on desktop) -->
          </div>

          <!-- Name + Edit Button Row -->
          <div class="d-flex align-items-center justify-content-between mt-2">
            <div>
              <h4 class="fw-bold mb-0">{{ user.displayName }}</h4>
              <span class="text-wanda-muted">@{{ user.username }}</span>
            </div>
            <button
              v-if="isOwnProfile"
              class="btn btn-outline-secondary btn-sm rounded-pill fw-bold px-3"
              @click="showEditModal = true"
            >
              Modifier le profil
            </button>
            <button
              v-else-if="authStore.isAuthenticated"
              class="btn btn-sm rounded-pill fw-bold px-3"
              :class="followData.isFollowing.value ? 'btn-outline-secondary' : 'btn-primary'"
              :disabled="followData.loading.value"
              @click="followData.toggleFollow()"
            >
              <span v-if="followData.loading.value" class="spinner-border spinner-border-sm me-1"></span>
              <template v-else-if="followData.isFollowing.value">
                <i class="bi bi-check-lg me-1"></i>Abonné
              </template>
              <template v-else>
                <i class="bi bi-person-plus me-1"></i>S'abonner
              </template>
            </button>
          </div>

          <!-- Bio -->
          <p v-if="user.bio" class="mt-2 mb-0" style="line-height: 1.6;">{{ user.bio }}</p>

          <!-- Meta -->
          <div class="d-flex flex-wrap gap-3 mt-2 text-wanda-muted small">
            <span>
              <i class="bi bi-calendar3 me-1"></i>
              Membre depuis {{ memberSince }}
            </span>
          </div>

          <!-- Stats -->
          <div class="d-flex gap-4 mt-3">
            <div class="profile-stat">
              <span class="fw-bold">{{ userPosts.length }}</span>
              <span class="text-wanda-muted ms-1">wandas</span>
            </div>
            <div class="profile-stat profile-stat-clickable" @click="openFollowList('followers')">
              <span class="fw-bold">{{ followData.followersCount.value }}</span>
              <span class="text-wanda-muted ms-1">abonnés</span>
            </div>
            <div class="profile-stat profile-stat-clickable" @click="openFollowList('following')">
              <span class="fw-bold">{{ followData.followingCount.value }}</span>
              <span class="text-wanda-muted ms-1">abonnements</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="profile-tabs mb-3">
        <button
          class="profile-tab"
          :class="{ active: currentTab === 'wandas' }"
          @click="currentTab = 'wandas'"
        >
          <i class="bi bi-collection me-1"></i>Wandas
        </button>
        <button
          class="profile-tab"
          :class="{ active: currentTab === 'likes' }"
          @click="currentTab = 'likes'"
        >
          <i class="bi bi-hand-thumbs-up me-1"></i>Likes
        </button>
        <button
          class="profile-tab"
          :class="{ active: currentTab === 'about' }"
          @click="currentTab = 'about'"
        >
          <i class="bi bi-person me-1"></i>À propos
        </button>
      </div>

      <!-- Tab Content: Wandas -->
      <div v-if="currentTab === 'wandas'">
        <PostCard
          v-for="(post, i) in userPosts"
          :key="post.id"
          :post="post"
          :index="i"
          @like="postsStore.toggleLike"
          @delete="postsStore.deletePost"
        />
        <div v-if="userPosts.length === 0" class="text-center py-5">
          <i class="bi bi-journal-x text-wanda-muted" style="font-size: 2.5rem;"></i>
          <p class="text-wanda-muted mt-2">Aucun wanda publié pour l'instant.</p>
        </div>
      </div>

      <!-- Tab Content: Likes -->
      <div v-if="currentTab === 'likes'">
        <PostCard
          v-for="(post, i) in likedPosts"
          :key="post.id"
          :post="post"
          :index="i"
          @like="postsStore.toggleLike"
        />
        <div v-if="likedPosts.length === 0" class="text-center py-5">
          <i class="bi bi-heart text-wanda-muted" style="font-size: 2.5rem;"></i>
          <p class="text-wanda-muted mt-2">Aucun like pour l'instant.</p>
        </div>
      </div>

      <!-- Tab Content: About -->
      <div v-if="currentTab === 'about'">
        <div class="card border-wanda">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-info-circle me-2 text-primary"></i>Informations</h6>

            <div class="mb-3">
              <small class="text-wanda-muted d-block mb-1">Nom d'affichage</small>
              <span class="fw-medium">{{ user.displayName }}</span>
            </div>

            <div class="mb-3">
              <small class="text-wanda-muted d-block mb-1">Nom d'utilisateur</small>
              <span class="fw-medium">@{{ user.username }}</span>
            </div>

            <div class="mb-3">
              <small class="text-wanda-muted d-block mb-1">Bio</small>
              <span class="fw-medium">{{ user.bio || 'Aucune bio' }}</span>
            </div>

            <div class="mb-3">
              <small class="text-wanda-muted d-block mb-1">Email</small>
              <span class="fw-medium">{{ user.email }}</span>
            </div>

            <div>
              <small class="text-wanda-muted d-block mb-1">Membre depuis</small>
              <span class="fw-medium">{{ memberSinceFull }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <ProfileEditProfileModal
        :show="showEditModal"
        :user="user"
        @close="showEditModal = false"
        @saved="onProfileSaved"
      />

      <!-- Follow List Modal -->
      <Teleport to="body">
        <div v-if="showFollowList" class="follow-modal-overlay" @click.self="showFollowList = false">
          <div class="follow-modal">
            <div class="follow-modal-header">
              <h6 class="fw-bold mb-0">{{ followListType === 'followers' ? 'Abonnés' : 'Abonnements' }}</h6>
              <button class="btn btn-link text-wanda-muted p-0" @click="showFollowList = false">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="follow-modal-body">
              <div v-if="followListLoading" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary"></div>
              </div>
              <div v-else-if="followListUsers.length === 0" class="text-center py-4 text-wanda-muted">
                <i class="bi bi-people" style="font-size: 2rem;"></i>
                <p class="mt-2 mb-0 small">Aucun {{ followListType === 'followers' ? 'abonné' : 'abonnement' }}</p>
              </div>
              <template v-else>
                <div
                  v-for="u in followListUsers"
                  :key="u.id"
                  class="follow-list-item"
                >
                  <NuxtLink :to="`/profile/${u.id}`" class="d-flex align-items-center gap-2 text-decoration-none flex-grow-1 min-w-0" @click="showFollowList = false">
                    <div v-if="u.avatarUrl" class="follow-list-avatar">
                      <img :src="u.avatarUrl" :alt="u.displayName" />
                    </div>
                    <div v-else class="follow-list-avatar follow-list-avatar-initials">
                      {{ u.displayName.charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0">
                      <span class="fw-bold d-block text-truncate" style="font-size: 0.9rem; color: var(--wanda-text);">{{ u.displayName }}</span>
                      <span class="text-wanda-muted" style="font-size: 0.78rem;">@{{ u.username }}</span>
                    </div>
                  </NuxtLink>
                  <button
                    v-if="u.id !== authStore.firebaseUid"
                    class="btn btn-sm rounded-pill fw-bold px-3 ms-2 flex-shrink-0"
                    :class="u.isFollowedByMe ? 'btn-outline-secondary' : 'btn-primary'"
                    @click="toggleFollowInList(u)"
                  >
                    <template v-if="u.isFollowedByMe">
                      <i class="bi bi-check-lg me-1"></i>Abonné
                    </template>
                    <template v-else>
                      S'abonner
                    </template>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Teleport>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-5">
      <i class="bi bi-person-x text-wanda-muted" style="font-size: 3rem;"></i>
      <h5 class="fw-bold mt-3">Utilisateur introuvable</h5>
      <NuxtLink to="/" class="btn btn-primary mt-2">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref as dbRef, get, set, remove, update } from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'
import type { User, Post } from '~/types'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const postsStore = usePostsStore()
const authStore = useAuthStore()

const user = ref<User | null>(null)
const userPosts = ref<Post[]>([])
const likedPosts = ref<Post[]>([])
const loading = ref(true)
const currentTab = ref<'wandas' | 'likes' | 'about'>('wandas')
const showEditModal = ref(false)

const targetUid = route.params.id as string
const followData = useFollow(targetUid)

const showFollowList = ref(false)
const followListType = ref<'followers' | 'following'>('followers')
const followListUsers = ref<{ id: string; displayName: string; username: string; avatarUrl: string; isFollowedByMe: boolean }[]>([])
const followListLoading = ref(false)

const openFollowList = async (type: 'followers' | 'following') => {
  followListType.value = type
  showFollowList.value = true
  followListLoading.value = true
  try {
    const rawUsers = type === 'followers'
      ? await followData.fetchFollowersList()
      : await followData.fetchFollowingList()

    // Check which ones the current user follows
    const rtdb = getFirebaseRtdb()
    const enriched = []
    for (const u of rawUsers) {
      let isFollowedByMe = false
      if (authStore.firebaseUid && u.id !== authStore.firebaseUid) {
        const snap = await get(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`))
        isFollowedByMe = snap.exists()
      }
      enriched.push({ ...u, isFollowedByMe })
    }
    followListUsers.value = enriched
  } catch (err) {
    console.error('Error loading follow list:', err)
  } finally {
    followListLoading.value = false
  }
}

const toggleFollowInList = async (u: { id: string; isFollowedByMe: boolean }) => {
  const rtdb = getFirebaseRtdb()
  if (!authStore.firebaseUid) return

  if (u.isFollowedByMe) {
    await remove(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`))
    await remove(dbRef(rtdb, `followers/${u.id}/${authStore.firebaseUid}`))
    u.isFollowedByMe = false
  } else {
    await set(dbRef(rtdb, `following/${authStore.firebaseUid}/${u.id}`), true)
    await set(dbRef(rtdb, `followers/${u.id}/${authStore.firebaseUid}`), true)
    u.isFollowedByMe = true
  }
}

const isOwnProfile = computed(() =>
  authStore.firebaseUid === route.params.id
)

const userInitial = computed(() =>
  user.value ? (user.value.displayName || user.value.username).charAt(0).toUpperCase() : '?'
)

const memberSince = computed(() => {
  if (!user.value) return ''
  return new Date(user.value.createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
})

const memberSinceFull = computed(() => {
  if (!user.value) return ''
  return new Date(user.value.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const onProfileSaved = (updates: Partial<User>) => {
  if (user.value) {
    Object.assign(user.value, updates)
  }
  if (isOwnProfile.value && authStore.user) {
    Object.assign(authStore.user, updates)
  }
}

const resizeAndConvertToBase64 = (file: File, maxWidth: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ratio = Math.min(maxWidth / img.width, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleAvatarUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !user.value) return
  try {
    const rtdb = getFirebaseRtdb()
    const base64 = await resizeAndConvertToBase64(file, 200)
    await update(dbRef(rtdb, `users/${user.value.id}`), { avatarUrl: base64 })
    user.value.avatarUrl = base64
  } catch (err) {
    console.error('Avatar upload error:', err)
  }
}

const handleCoverUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !user.value) return
  try {
    const rtdb = getFirebaseRtdb()
    const base64 = await resizeAndConvertToBase64(file, 1200)
    await update(dbRef(rtdb, `users/${user.value.id}`), { coverUrl: base64 })
    user.value.coverUrl = base64
  } catch (err) {
    console.error('Cover upload error:', err)
  }
}

onMounted(async () => {
  try {
    const uid = route.params.id as string
    const rtdb = getFirebaseRtdb()

    // Start follow listeners
    followData.listen()

    // Load user profile
    const { getUserProfile } = useFireAuth()
    const profile = await getUserProfile(uid)

    if (profile) {
      user.value = {
        id: uid,
        username: profile.username || '',
        displayName: profile.displayName || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        coverUrl: profile.coverUrl || '',
        postsCount: profile.postsCount || 0,
        followersCount: profile.followersCount || 0,
        followingCount: profile.followingCount || 0,
        createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : new Date().toISOString(),
      }

      // Load all posts to find user's posts and liked posts
      const postsSnap = await get(dbRef(rtdb, 'posts'))
      if (postsSnap.exists()) {
        const owned: Post[] = []
        const liked: Post[] = []

        postsSnap.forEach((child) => {
          const d = child.val()
          const post: Post = {
            id: child.key!,
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
            isLiked: authStore.firebaseUid ? !!(d.likes && d.likes[authStore.firebaseUid]) : false,
          }

          // User's own posts
          if (d.authorId === uid) {
            owned.push(post)
          }

          // Posts this user has liked
          if (d.likes && d.likes[uid]) {
            liked.push(post)
          }
        })

        userPosts.value = owned.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        likedPosts.value = liked.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
    } else {
      user.value = null
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    user.value = null
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  followData.stopListening()
})
</script>

<style scoped lang="scss">
/* Cover */
.profile-cover {
  height: 200px;
  background: linear-gradient(135deg, #1a1c2e 0%, #2d3561 40%, #4B83F0 100%);
  position: relative;
}

.cover-edit-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(0, 0, 0, 0.75);
  }
}

/* Profile body */
.profile-body {
  padding: 0 1.25rem 1.25rem;
  margin-top: -60px;
}

.profile-avatar-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

/* Avatar */
.profile-avatar-wrapper {
  flex-shrink: 0;
  position: relative;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--wanda-bg-card);
  background: var(--wanda-bg-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.profile-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  background: var(--wanda-blue);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--wanda-bg-card);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.75);
  }
}

/* Stats */
.profile-stat {
  cursor: default;
  font-size: 0.95rem;

  &:hover .fw-bold {
    text-decoration: underline;
  }
}

/* Tabs */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid var(--wanda-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.profile-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--wanda-text-secondary);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: var(--wanda-text);
    background: var(--wanda-bg-surface);
  }

  &.active {
    color: var(--wanda-blue);
    border-bottom-color: var(--wanda-blue);
  }
}

/* Responsive */
@media (max-width: 575.98px) {
  .profile-cover {
    height: 150px;
  }

  .profile-body {
    margin-top: -45px;
  }

  .profile-avatar-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .profile-avatar-initials {
    font-size: 2rem;
  }

  .profile-stat {
    font-size: 0.85rem;
  }
}

/* Follow List Modal */
.profile-stat-clickable {
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  margin: -0.25rem -0.5rem;
  transition: background 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
  }
}

.follow-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.follow-modal {
  background: var(--wanda-bg);
  border: 1px solid var(--wanda-border);
  border-radius: 1rem;
  width: 100%;
  max-width: 420px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.follow-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--wanda-border);
}

.follow-modal-body {
  overflow-y: auto;
  padding: 0.5rem 0;
}

.follow-list-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 1.25rem;
  transition: background 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
  }
}

.follow-list-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.follow-list-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}
</style>
