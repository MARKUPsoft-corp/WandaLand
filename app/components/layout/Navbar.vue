<template>
  <header class="wanda-navbar">
    <div class="container-fluid d-flex align-items-center gap-3">
      <!-- Brand -->
      <NuxtLink to="/" class="navbar-brand d-flex align-items-center text-decoration-none">
        <img src="/wandaland_logo.svg" alt="WandaLand" />
        <span style="color: var(--wanda-blue);">WandaLand</span>
      </NuxtLink>

      <!-- Search (desktop — absolutely centered) -->
      <div class="wanda-search wanda-search-centered d-none d-lg-block">
        <i class="bi bi-search wanda-search-icon"></i>
        <input
          type="search"
          class="wanda-search-input"
          placeholder="Rechercher un wanda..."
          v-model="searchQuery"
        />
      </div>

      <!-- Right Actions -->
      <div class="d-flex align-items-center gap-2 ms-auto">

        <!-- Theme Toggle -->
        <button
          class="btn-icon"
          @click="toggleTheme($event)"
          :title="isDark ? 'Mode clair' : 'Mode sombre'"
        >
          <i class="bi" :class="isDark ? 'bi-sun-fill' : 'bi-moon'"></i>
        </button>

        <template v-if="authStore.isAuthenticated">
          <!-- Notifications -->
          <div class="position-relative">
            <button class="btn-icon position-relative" @click="showNotifs = !showNotifs">
              <i class="bi bi-bell"></i>
              <span v-if="notifs.unreadCount.value > 0" class="notif-badge">
                {{ notifs.unreadCount.value > 9 ? '9+' : notifs.unreadCount.value }}
              </span>
            </button>

            <!-- Dropdown -->
            <div v-if="showNotifs" class="notif-dropdown">
              <div class="notif-header">
                <span class="fw-bold">Notifications</span>
                <button v-if="notifs.unreadCount.value > 0" class="btn btn-link btn-sm text-primary p-0" @click="notifs.markAllAsRead()">
                  Tout lire
                </button>
              </div>
              <div class="notif-body">
                <div v-if="notifs.notifications.value.length === 0" class="text-center py-4 text-wanda-muted">
                  <i class="bi bi-bell" style="font-size: 1.5rem;"></i>
                  <p class="small mt-2 mb-0">Aucune notification</p>
                </div>
                <div
                  v-for="n in notifs.notifications.value"
                  :key="n.id"
                  class="notif-item"
                  :class="{ 'notif-unread': !n.read }"
                  @click="handleNotifClick(n)"
                >
                  <div v-if="n.fromAvatarUrl" class="notif-avatar">
                    <img :src="n.fromAvatarUrl" :alt="n.fromDisplayName" />
                  </div>
                  <div v-else class="notif-avatar notif-avatar-initials">
                    {{ n.fromDisplayName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <p class="mb-0 small">
                      <strong>{{ n.fromDisplayName }}</strong>
                      <template v-if="n.type === 'new_follower'"> s'est abonné(e) à vous</template>
                      <template v-else-if="n.type === 'unfollow'"> s'est désabonné(e)</template>
                      <template v-else-if="n.type === 'comment_reply'"> a répondu à votre commentaire</template>
                      <template v-else-if="n.type === 'post_like'"> a aimé votre wanda</template>
                      <template v-else-if="n.type === 'comment_like'"> a aimé votre commentaire</template>
                    </p>
                    <small v-if="n.commentPreview" class="text-wanda-muted d-block text-truncate">« {{ n.commentPreview }} »</small>
                    <small v-else-if="n.postPreview" class="text-wanda-muted d-block text-truncate">« {{ n.postPreview }} »</small>
                    <small class="text-wanda-muted">{{ formatNotifTime(n.createdAt) }}</small>
                  </div>
                  <span v-if="!n.read" class="notif-dot"></span>
                </div>
              </div>
            </div>

            <!-- Backdrop -->
            <div v-if="showNotifs" class="notif-backdrop" @click="showNotifs = false"></div>
          </div>

          <!-- Profile Dropdown -->
          <div class="dropdown">
            <button
              class="btn p-0 border-0 bg-transparent"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div
                v-if="authStore.user?.avatarUrl"
                class="profile-avatar"
              >
                <img :src="authStore.user.avatarUrl" :alt="authStore.user.displayName" />
              </div>
              <div v-else class="avatar avatar-sm bg-primary text-white">
                {{ userInitials }}
              </div>
            </button>
            <div class="dropdown-menu dropdown-menu-end mt-2 profile-dropdown">
              <!-- User Info Header -->
              <div class="px-3 py-2 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <div
                    v-if="authStore.user?.avatarUrl"
                    class="profile-avatar profile-avatar-md"
                  >
                    <img :src="authStore.user.avatarUrl" :alt="authStore.user.displayName" />
                  </div>
                  <div v-else class="avatar avatar-md bg-primary text-white">
                    {{ userInitials }}
                  </div>
                  <div>
                    <div class="fw-bold" style="line-height: 1.3;">{{ authStore.user?.displayName }}</div>
                    <div class="text-wanda-muted small">@{{ authStore.user?.username || authStore.user?.email?.split('@')[0] }}</div>
                  </div>
                </div>
              </div>

              <!-- Menu Items -->
              <NuxtLink
                class="dropdown-item d-flex align-items-center gap-2 py-2"
                :to="`/profile/${authStore.user?.id}`"
              >
                <i class="bi bi-person"></i>
                Voir mon profil
              </NuxtLink>
              <hr class="dropdown-divider my-1" />
              <button
                class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                @click="authStore.logout()"
              >
                <i class="bi bi-box-arrow-left"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

  </header>
</template>

<script setup lang="ts">
import type { WandaNotification } from '~/composables/useNotifications'

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const notifs = useNotifications()
const searchQuery = ref('')
const showNotifs = ref(false)

const userInitials = computed(() => {
  const name = authStore.user?.displayName || authStore.user?.username || '?'
  return name.charAt(0).toUpperCase()
})

const formatNotifTime = (ts: number) => {
  const diffSec = Math.floor((Date.now() - ts) / 1000)
  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const handleNotifClick = async (n: WandaNotification) => {
  if (!n.read) await notifs.markAsRead(n.id)
  showNotifs.value = false
  if (n.postId && (n.type === 'comment_reply' || n.type === 'post_like' || n.type === 'comment_like')) {
    navigateTo(`/post/${n.postId}`)
  } else if (n.type === 'new_follower' || n.type === 'unfollow') {
    navigateTo(`/profile/${n.fromUserId}`)
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    notifs.listen()
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) notifs.listen()
  else notifs.stopListening()
})
</script>

<style scoped lang="scss">
.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.profile-avatar-md {
    width: 40px;
    height: 40px;
  }
}

.profile-dropdown {
  min-width: 240px;
  border: 1px solid var(--wanda-border);
  background: var(--wanda-bg-card);
  border-radius: 0.75rem;
  overflow: hidden;

  .dropdown-item {
    color: var(--wanda-text);
    font-size: 0.875rem;
    padding-left: 1rem;
    padding-right: 1rem;

    &:hover {
      background: var(--wanda-bg-surface);
    }

    &.text-danger:hover {
      background: rgba(220, 53, 69, 0.08);
    }
  }

  .border-bottom {
    border-color: var(--wanda-border) !important;
  }
}

/* Notification System */
.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ef4444;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.notif-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1039;
}

.notif-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 360px;
  background: var(--wanda-bg);
  border: 1px solid var(--wanda-border);
  border-radius: 0.75rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  z-index: 1040;
  overflow: hidden;

  @media (max-width: 576px) {
    position: fixed;
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    top: 60px;
  }
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--wanda-border);
}

.notif-body {
  max-height: 350px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
  }
}

.notif-unread {
  background: rgba(37, 99, 235, 0.06);
}

.notif-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.notif-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563EB;
  flex-shrink: 0;
  margin-top: 0.4rem;
}
</style>
