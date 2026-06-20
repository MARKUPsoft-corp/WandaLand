<template>
  <div class="comment-bubble d-flex gap-2 animate-slide-in">
    <!-- Avatar -->
    <NuxtLink :to="`/profile/${comment.author.id}`" class="flex-shrink-0">
      <div v-if="comment.author.avatarUrl" class="comment-avatar">
        <img :src="comment.author.avatarUrl" :alt="comment.author.displayName" />
      </div>
      <div v-else class="comment-avatar comment-avatar-initials">
        {{ authorInitial }}
      </div>
    </NuxtLink>

    <!-- Bubble -->
    <div class="flex-grow-1" style="min-width: 0;">
      <div class="comment-content">
        <NuxtLink :to="`/profile/${comment.author.id}`" class="comment-author-name">
          {{ comment.author.displayName }}
        </NuxtLink>
        <p class="mb-0">
          <span v-if="comment.replyToUsername" class="comment-mention">@{{ comment.replyToUsername }}</span>
          {{ comment.content }}
        </p>
      </div>
      <div class="comment-meta">
        <span>{{ timeAgo }}</span>
        <button
          class="comment-meta-action"
          :class="{ 'active': isLiked }"
          @click="$emit('like', comment.id)"
        >
          Wanda!
        </button>
        <button class="comment-meta-action" @click="$emit('reply', comment)">
          Répondre
        </button>
        <span v-if="comment.likesCount" class="comment-like-count">
          {{ comment.likesCount }} <i class="bi bi-emoji-surprise-fill"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '~/types'

const props = defineProps<{
  comment: Comment
}>()

defineEmits(['reply', 'like'])

const authStore = useAuthStore()

const authorInitial = computed(() =>
  (props.comment.author.displayName || props.comment.author.username).charAt(0).toUpperCase()
)

const isLiked = computed(() =>
  authStore.firebaseUid ? !!(props.comment.likes && props.comment.likes[authStore.firebaseUid]) : false
)

const timeAgo = computed(() => {
  const now = new Date()
  const posted = new Date(props.comment.createdAt)
  const diffMs = now.getTime() - posted.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `${diffMin} min`
  if (diffH < 24) return `${diffH} h`
  if (diffD < 7) return `${diffD} j`
  return posted.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
})
</script>

<style scoped lang="scss">
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--wanda-bg-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.comment-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.comment-content {
  background: var(--wanda-bg-surface);
  border-radius: 1.1rem;
  padding: 0.5rem 0.85rem;
  display: inline-block;
  max-width: 100%;

  p {
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--wanda-text);
  }
}

.comment-author-name {
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--wanda-text);
  text-decoration: none;
  display: block;
  line-height: 1.3;

  &:hover {
    text-decoration: underline;
  }
}

.comment-mention {
  color: var(--wanda-blue);
  font-weight: 600;
  margin-right: 0.2rem;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.15rem 0.85rem;
  font-size: 0.75rem;
  color: var(--wanda-text-muted);
}

.comment-meta-action {
  background: none;
  border: none;
  padding: 0;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--wanda-text-muted);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    color: var(--wanda-text);
  }

  &.active {
    color: var(--wanda-blue);
  }
}

.comment-like-count {
  font-size: 0.75rem;
  color: var(--wanda-text-muted);
  margin-left: auto;

  i {
    color: var(--wanda-blue);
    font-size: 0.8rem;
  }
}
</style>
