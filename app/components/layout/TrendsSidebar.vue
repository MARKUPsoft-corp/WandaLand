<template>
  <div>
    <div class="card border-wanda">
      <div class="card-body">
        <h6 class="fw-bold mb-3"><i class="bi bi-trophy me-2 text-primary"></i>Wandas tendance</h6>

        <div v-if="loading" class="text-center py-3">
          <div class="spinner-border spinner-border-sm text-primary"></div>
        </div>

        <template v-else>
          <div
            v-for="(post, i) in topPosts"
            :key="post.id"
            class="trend-item d-flex align-items-start gap-2 mb-3"
            @click="navigateTo(`/post/${post.id}`)"
          >
            <span class="rank-badge" :class="{ 'rank-gold': i === 0, 'rank-silver': i === 1, 'rank-bronze': i === 2 }">
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <div v-if="post.avatarUrl" class="trend-avatar">
                  <img :src="post.avatarUrl" :alt="post.displayName" />
                </div>
                <div v-else class="trend-avatar trend-avatar-initials">
                  {{ post.displayName.charAt(0).toUpperCase() }}
                </div>
                <span class="trend-author">{{ post.displayName }}</span>
              </div>
              <p class="trend-text mb-1">{{ post.preview }}</p>
              <div class="d-flex align-items-center gap-1">
                <i class="bi bi-emoji-surprise-fill text-primary" style="font-size: 0.75rem;"></i>
                <span class="trend-count">{{ post.likes }} wandas</span>
                <span class="trend-count ms-2"><i class="bi bi-chat me-1"></i>{{ post.comments }}</span>
              </div>
            </div>
          </div>

          <p v-if="topPosts.length === 0" class="text-wanda-muted small mb-0 text-center py-2">
            Aucun wanda pour le moment
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref as dbRef, onValue, type Unsubscribe } from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'

interface TopPost {
  id: string
  preview: string
  displayName: string
  avatarUrl: string
  likes: number
  comments: number
}

const topPosts = ref<TopPost[]>([])
const loading = ref(true)
let unsub: Unsubscribe | null = null

onMounted(() => {
  const rtdb = getFirebaseRtdb()
  unsub = onValue(dbRef(rtdb, 'posts'), (snapshot) => {
    const posts: TopPost[] = []
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const d = child.val()
        const content = d.content || ''
        posts.push({
          id: child.key!,
          preview: content.length > 55 ? content.substring(0, 55) + '...' : content,
          displayName: d.authorDisplayName || 'Anonyme',
          avatarUrl: d.authorAvatarUrl || '',
          likes: d.likesCount || 0,
          comments: d.commentsCount || 0,
        })
      })
    }
    topPosts.value = posts.sort((a, b) => b.likes - a.likes).slice(0, 10)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsub) unsub()
})
</script>

<style scoped lang="scss">
.trend-item {
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.4rem;
  margin-left: -0.4rem;
  margin-right: -0.4rem;
  transition: background 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
  }
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 0.15rem;
  background: var(--wanda-bg-surface);
  color: var(--wanda-text-muted);
}

.rank-gold {
  background: rgba(255, 215, 0, 0.2);
  color: #D4A017;
}

.rank-silver {
  background: rgba(192, 192, 192, 0.25);
  color: #888;
}

.rank-bronze {
  background: rgba(205, 127, 50, 0.2);
  color: #B87333;
}

.trend-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.trend-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.trend-author {
  font-weight: 600;
  font-size: 0.78rem;
  color: var(--wanda-text);
}

.trend-text {
  font-size: 0.78rem;
  color: var(--wanda-text-muted);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trend-count {
  font-size: 0.72rem;
  color: var(--wanda-text-muted);
  font-weight: 600;
}
</style>
