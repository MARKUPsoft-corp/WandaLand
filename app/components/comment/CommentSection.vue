<template>
  <div class="comments-section">
    <!-- Comments List -->
    <div class="comments-list">
      <div v-if="commentsLoading" class="text-center py-3">
        <div class="spinner-border spinner-border-sm text-primary"></div>
      </div>

      <template v-else>
        <p v-if="allComments.length === 0" class="text-wanda-muted text-center small py-3 mb-0">
          Aucun commentaire. Sois le premier à réagir !
        </p>

        <!-- Top-level comments -->
        <template v-for="comment in topLevelComments" :key="comment.id">
          <CommentItem
            :comment="comment"
            @reply="handleReply"
            @like="handleLike"
          />

          <!-- Replies (indented, 1 level only) -->
          <div
            v-if="getReplies(comment.id).length"
            class="replies-group"
          >
            <CommentItem
              v-for="reply in getReplies(comment.id)"
              :key="reply.id"
              :comment="reply"
              @reply="handleReplyToReply(comment, reply)"
              @like="handleLike"
            />
          </div>
        </template>
      </template>
    </div>

    <!-- Comment Input (at bottom) -->
    <div v-if="authStore.isAuthenticated" class="comment-input-bar">
      <NuxtLink :to="`/profile/${authStore.firebaseUid}`" class="flex-shrink-0">
        <div v-if="authStore.user?.avatarUrl" class="comment-input-avatar">
          <img :src="authStore.user.avatarUrl" :alt="authStore.user.displayName" />
        </div>
        <div v-else class="comment-input-avatar comment-input-avatar-initials">
          {{ userInitial }}
        </div>
      </NuxtLink>

      <div class="comment-input-wrapper">
        <input
          ref="commentInputRef"
          v-model="newComment"
          type="text"
          class="comment-input"
          :placeholder="inputPlaceholder"
          @keyup.enter="submitComment"
        />
        <button
          v-if="replyTarget"
          class="reply-cancel-btn"
          @click="cancelReply"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>

      <button
        class="comment-send-btn"
        :disabled="!newComment.trim() || submitting"
        @click="submitComment"
      >
        <span v-if="submitting" class="spinner-border spinner-border-sm"></span>
        <i v-else class="bi bi-send-fill"></i>
      </button>
    </div>

    <div v-else class="text-center py-3">
      <NuxtLink to="/" class="btn btn-outline-primary btn-sm rounded-pill">
        Connecte-toi pour commenter
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Comment } from '~/types'

const props = defineProps<{
  postId: string
}>()

const authStore = useAuthStore()
const { comments: allComments, loading: commentsLoading, listen, addComment, toggleCommentLike, stopListening } = useComments(props.postId)

const newComment = ref('')
const submitting = ref(false)
const commentInputRef = ref<HTMLInputElement | null>(null)

// Reply state
const replyTarget = ref<{ parentId: string; username: string } | null>(null)

const userInitial = computed(() =>
  (authStore.user?.displayName || authStore.user?.username || '?').charAt(0).toUpperCase()
)

const inputPlaceholder = computed(() => {
  if (replyTarget.value) {
    return `Répondre à @${replyTarget.value.username}...`
  }
  return `Commenter en tant que ${authStore.user?.displayName || 'vous'}...`
})

// top-level: no parentId
const topLevelComments = computed(() =>
  allComments.value.filter(c => !c.parentId)
)

// replies for a given parent
const getReplies = (parentId: string) =>
  allComments.value.filter(c => c.parentId === parentId)

const handleReply = (comment: Comment) => {
  replyTarget.value = {
    parentId: comment.id,
    username: comment.author.username,
  }
  newComment.value = ''
  nextTick(() => commentInputRef.value?.focus())
}

const handleReplyToReply = (parentComment: Comment, reply: Comment) => {
  // Replies to replies stay under the SAME parent (no 3rd level)
  replyTarget.value = {
    parentId: parentComment.id,
    username: reply.author.username,
  }
  newComment.value = ''
  nextTick(() => commentInputRef.value?.focus())
}

const cancelReply = () => {
  replyTarget.value = null
  newComment.value = ''
}

const handleLike = async (commentId: string) => {
  try {
    await toggleCommentLike(commentId)
  } catch (err) {
    console.error('Failed to toggle comment like:', err)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim() || submitting.value) return
  submitting.value = true
  try {
    await addComment(
      newComment.value.trim(),
      replyTarget.value?.parentId,
      replyTarget.value?.username,
    )
    newComment.value = ''
    replyTarget.value = null
  } catch (err) {
    console.error('Failed to submit comment:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  listen()
})

onUnmounted(() => {
  stopListening()
})
</script>

<style scoped lang="scss">
.comments-section {
  display: flex;
  flex-direction: column;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.5rem 0;
}

/* Reply group — indented */
.replies-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 2.75rem;
}

/* Comment Input Bar */
.comment-input-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--wanda-border);
  margin-top: 0.25rem;
}

.comment-input-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--wanda-bg-surface);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.comment-input-avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: var(--wanda-blue);
}

.comment-input-wrapper {
  flex: 1;
  position: relative;
}

.comment-input {
  width: 100%;
  padding: 0.5rem 0.85rem;
  padding-right: 2rem;
  border-radius: 1.25rem;
  border: none;
  background: var(--wanda-bg-surface);
  color: var(--wanda-text);
  font-size: 0.9rem;
  outline: none;
  transition: box-shadow 0.15s;

  &::placeholder {
    color: var(--wanda-text-muted);
    font-size: 0.85rem;
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(75, 131, 240, 0.3);
  }
}

.reply-cancel-btn {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--wanda-text-muted);
  color: var(--wanda-bg-card);
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: var(--wanda-text);
  }
}

.comment-send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--wanda-blue);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--wanda-bg-surface);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}
</style>
