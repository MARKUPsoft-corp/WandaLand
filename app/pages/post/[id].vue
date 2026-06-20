<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <template v-else-if="post">
      <!-- Post Card -->
      <div class="card border-wanda mb-0">
        <div class="card-body pb-0">
          <!-- Author -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <NuxtLink :to="`/profile/${post.author.id}`" class="flex-shrink-0">
              <div v-if="post.author.avatarUrl" class="detail-avatar">
                <img :src="post.author.avatarUrl" :alt="post.author.displayName" />
              </div>
              <div v-else class="detail-avatar detail-avatar-initials">
                {{ authorInitial }}
              </div>
            </NuxtLink>
            <div class="flex-grow-1 min-w-0">
              <NuxtLink :to="`/profile/${post.author.id}`" class="detail-author-name">
                {{ post.author.displayName }}
              </NuxtLink>
              <span class="detail-meta d-block">@{{ post.author.username }} · {{ formatDate }}</span>
            </div>

            <!-- Close button -->
            <button class="detail-close-btn ms-auto" @click="$router.back()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Content -->
          <p class="detail-text" v-html="renderedContent"></p>
        </div>

        <!-- Image -->
        <div v-if="post.imageUrl" class="detail-image-wrapper">
          <img :src="post.imageUrl" :alt="post.content.substring(0, 50)" class="detail-image" />
        </div>

        <div class="card-body pt-0">
          <!-- Counts -->
          <div class="detail-counts" v-if="post._count.likes || post._count.comments">
            <span v-if="post._count.likes">
              <i class="bi bi-emoji-surprise-fill text-primary me-1"></i>{{ post._count.likes }}
            </span>
            <span v-if="post._count.comments" class="ms-auto">
              {{ post._count.comments }} commentaire{{ post._count.comments > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button
              class="detail-action-btn"
              :class="{ active: post.isLiked }"
              @click="postsStore.toggleLike(post.id)"
            >
              <i class="bi" :class="post.isLiked ? 'bi-emoji-surprise-fill' : 'bi-emoji-surprise'"></i>
              <span>Wanda!</span>
            </button>

            <button class="detail-action-btn" @click="focusCommentInput">
              <i class="bi bi-chat"></i>
              <span>Commenter</span>
            </button>

            <button class="detail-action-btn">
              <i class="bi bi-share"></i>
              <span>Partager</span>
            </button>
          </div>

          <!-- Comments Section -->
          <CommentSection :post-id="post.id" />
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-5">
      <i class="bi bi-question-circle text-wanda-muted" style="font-size: 3rem;"></i>
      <h5 class="fw-bold mt-3">Wanda introuvable</h5>
      <p class="text-wanda-muted">Ce wanda n'existe pas ou a été supprimé.</p>
      <NuxtLink to="/" class="btn btn-primary">Retour à l'accueil</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const postsStore = usePostsStore()

const post = computed(() => postsStore.currentPost)
const loading = ref(true)

const authorInitial = computed(() =>
  post.value ? (post.value.author.displayName || post.value.author.username).charAt(0).toUpperCase() : '?'
)

const renderedContent = computed(() => {
  if (!post.value) return ''
  const escaped = post.value.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(
    /#([\wÀ-ÿ]+)/g,
    '<span class="detail-hashtag">#$1</span>'
  )
})

const formatDate = computed(() => {
  if (!post.value) return ''
  const now = new Date()
  const posted = new Date(post.value.createdAt)
  const diffMs = now.getTime() - posted.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffH = Math.floor(diffMin / 60)

  if (diffSec < 60) return `il y a ${diffSec}s`
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffH < 24) return `il y a ${diffH}h`

  // Check if yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (posted.toDateString() === yesterday.toDateString()) {
    return `hier à ${posted.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Full date with day name
  return posted.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const focusCommentInput = () => {
  const input = document.querySelector('.comment-input') as HTMLInputElement
  if (input) input.focus()
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    await postsStore.fetchPost(id)
  } catch {
    // Post not found
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.detail-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--wanda-bg-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.detail-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--wanda-text-muted);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
    color: var(--wanda-text);
  }
}

.detail-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.detail-author-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--wanda-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}



.detail-meta {
  font-size: 0.82rem;
  color: var(--wanda-text-muted);
}

.detail-text {
  font-size: 1.05rem;
  line-height: 1.7;
  white-space: pre-line;
  margin-bottom: 0.5rem;
  color: var(--wanda-text);
}

.detail-image-wrapper {
  line-height: 0;
}

.detail-image {
  width: 100%;
  max-height: 600px;
  object-fit: cover;
  display: block;
}

.detail-counts {
  display: flex;
  align-items: center;
  padding: 0.6rem 0;
  font-size: 0.9rem;
  color: var(--wanda-text-muted);
}

.detail-actions {
  display: flex;
  border-top: 1px solid var(--wanda-border);
  border-bottom: 1px solid var(--wanda-border);
  padding: 0.2rem 0;
}

.detail-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--wanda-text-secondary);
  background: none;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--wanda-bg-surface);
    color: var(--wanda-text);
  }

  &.active {
    color: var(--wanda-blue);
  }

  i {
    font-size: 1.15rem;
  }
}

:deep(.detail-hashtag) {
  color: #4B83F0;
  font-weight: 600;
}

@media (max-width: 575.98px) {
  .detail-action-btn span {
    display: none;
  }
}
</style>
