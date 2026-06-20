<template>
  <div class="post-card card border-wanda mb-3 animate-fade-in-up" :style="{ animationDelay: `${(index || 0) * 0.05}s` }">
    <!-- Author Header -->
    <div class="post-header">
      <NuxtLink :to="`/profile/${post.author.id}`" class="post-avatar-link">
        <div v-if="post.author.avatarUrl" class="post-avatar">
          <img :src="post.author.avatarUrl" :alt="post.author.displayName" />
        </div>
        <div v-else class="post-avatar post-avatar-initials">
          {{ authorInitial }}
        </div>
      </NuxtLink>

      <div class="post-author-info">
        <NuxtLink :to="`/profile/${post.author.id}`" class="post-author-name">
          {{ post.author.displayName }}
        </NuxtLink>
        <span class="post-meta">@{{ post.author.username }} · {{ timeAgo }}</span>
      </div>

      <!-- Options menu -->
      <div class="dropdown ms-auto" v-if="isOwner">
        <button class="btn btn-link text-wanda-muted p-1" data-bs-toggle="dropdown">
          <i class="bi bi-three-dots fs-5"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li>
            <button class="dropdown-item text-danger" @click="$emit('delete', post.id)">
              <i class="bi bi-trash me-2"></i>Supprimer
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Post Content with clickable hashtags -->
    <div class="post-text-area">
      <NuxtLink :to="`/post/${post.id}`" class="post-text-link">
        <p class="post-text" v-html="renderedContent"></p>
      </NuxtLink>
    </div>

    <!-- Post Image -->
    <div v-if="post.imageUrl" class="post-image-wrapper">
      <NuxtLink :to="`/post/${post.id}`">
        <img :src="post.imageUrl" :alt="post.content.substring(0, 50)" class="post-image" />
      </NuxtLink>
    </div>

    <!-- Action Buttons -->
    <div class="post-actions">
      <button
        class="post-action-btn"
        :class="{ 'active': post.isLiked }"
        @click="$emit('like', post.id)"
      >
        <i class="bi" :class="post.isLiked ? 'bi-emoji-surprise-fill' : 'bi-emoji-surprise'"></i>
        <span>Wanda!</span>
        <span class="post-count" v-if="post._count.likes">{{ post._count.likes }}</span>
      </button>

      <NuxtLink :to="`/post/${post.id}`" class="post-action-btn text-decoration-none">
        <i class="bi bi-chat"></i>
        <span>Commenter</span>
        <span class="post-count" v-if="post._count.comments">{{ post._count.comments }}</span>
      </NuxtLink>

      <button class="post-action-btn">
        <i class="bi bi-share"></i>
        <span>Partager</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

const props = defineProps<{
  post: Post
  index?: number
}>()

defineEmits(['like', 'delete'])

const postsStore = usePostsStore()
const authStore = useAuthStore()

const authorInitial = computed(() =>
  (props.post.author.displayName || props.post.author.username).charAt(0).toUpperCase()
)

const isOwner = computed(() => authStore.firebaseUid === props.post.author?.id)

// Render content with clickable hashtags
const renderedContent = computed(() => {
  const escaped = props.post.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(
    /#([\wÀ-ÿ]+)/g,
    '<span class="post-hashtag" data-tag="$1">#$1</span>'
  )
})

const timeAgo = computed(() => {
  const now = new Date()
  const posted = new Date(props.post.createdAt)
  const diffMs = now.getTime() - posted.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin}min`
  if (diffH < 24) return `il y a ${diffH}h`
  if (diffD < 7) return `il y a ${diffD}j`
  return posted.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
})
</script>

<style scoped lang="scss">
.post-card {
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Header */
.post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0;
}

.post-avatar-link {
  text-decoration: none;
  flex-shrink: 0;
}

.post-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--wanda-bg-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.post-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.post-author-info {
  min-width: 0;
}

.post-author-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--wanda-text);
  text-decoration: none;
  line-height: 1.3;
  display: block;

  &:hover {
    text-decoration: underline;
  }
}

.post-meta {
  font-size: 0.8rem;
  color: var(--wanda-text-muted);
  line-height: 1.3;
}

/* Content */
.post-text-area {
  padding: 0;
}

.post-text-link {
  text-decoration: none;
}

.post-text {
  padding: 0.65rem 1rem;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--wanda-text);
  white-space: pre-line;
}

:deep(.post-hashtag) {
  color: #4B83F0;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

/* Image */
.post-image-wrapper {
  line-height: 0;
}

.post-image {
  width: 100%;
  max-height: 520px;
  object-fit: cover;
  display: block;
}

/* Action Buttons */
.post-actions {
  display: flex;
  border-top: 1px solid var(--wanda-border);
  margin: 0 0.75rem;
  padding: 0.25rem 0;
}

.post-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0;
  font-size: 0.9rem;
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
    font-size: 1.1rem;
  }

  span {
    font-size: 0.85rem;
  }
}

.post-count {
  font-weight: 700;
  font-size: 0.8rem;
}

/* Mobile */
@media (max-width: 575.98px) {
  .post-action-btn span:not(.post-count) {
    display: none;
  }

  .post-action-btn i {
    font-size: 1.25rem;
  }
}
</style>
