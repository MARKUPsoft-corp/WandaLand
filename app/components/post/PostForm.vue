<template>
  <div class="card border-wanda mb-3">
    <div class="card-body">
      <div class="d-flex gap-3">
        <div
          v-if="authStore.user?.avatarUrl"
          class="profile-avatar flex-shrink-0"
        >
          <img :src="authStore.user.avatarUrl" :alt="authStore.user.displayName" />
        </div>
        <div v-else class="avatar avatar-md bg-primary text-white flex-shrink-0">
          {{ userInitial }}
        </div>
        <div class="flex-grow-1">
          <textarea
            v-model="content"
            class="form-control border-0 bg-transparent p-0 mb-2"
            :placeholder="placeholder"
            rows="2"
            style="resize: none; font-size: 1rem;"
            @focus="expanded = true"
          ></textarea>

          <!-- Detected Hashtags Preview -->
          <div v-if="detectedHashtags.length" class="d-flex flex-wrap gap-1 mb-2">
            <span
              v-for="tag in detectedHashtags"
              :key="tag"
              class="hashtag-preview"
            >
              #{{ tag }}
            </span>
          </div>

          <!-- Image Preview -->
          <div v-if="imagePreview" class="image-preview-wrapper mb-3">
            <img :src="imagePreview" alt="Aperçu" class="image-preview" />
            <button class="image-remove-btn" @click="removeImage">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div v-if="expanded" class="animate-fade-in-up">
            <!-- Hashtag Suggestions -->
            <div class="mb-3">
              <small class="text-wanda-muted d-block mb-2">
                <i class="bi bi-hash me-1"></i>Ajoute des #hashtags dans ton texte pour catégoriser
              </small>
              <div class="d-flex flex-wrap gap-1">
                <button
                  v-for="suggestion in suggestions"
                  :key="suggestion"
                  class="btn btn-sm rounded-pill hashtag-suggestion"
                  @click="addHashtag(suggestion)"
                >
                  #{{ suggestion }}
                </button>
              </div>
            </div>

            <!-- Actions Row -->
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <button
                  class="btn btn-sm btn-outline-secondary rounded-pill"
                  @click="($refs.imageInput as HTMLInputElement).click()"
                >
                  <i class="bi bi-image me-1"></i>Photo
                </button>
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="handleImageSelect"
                />
                <small class="text-wanda-muted">
                  {{ content.length }} / 1000
                </small>
              </div>
              <button
                class="btn btn-primary px-4"
                :disabled="!canSubmit || loading"
                @click="submitPost"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-send me-2"></i>
                Publier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { extractHashtags } from '~/types'

const emit = defineEmits(['posted'])
const authStore = useAuthStore()
const postsStore = usePostsStore()

const content = ref('')
const expanded = ref(false)
const loading = ref(false)
const imagePreview = ref<string | null>(null)

const placeholders = [
  'Raconte ta wanda du jour... #hashtag',
  'Qu\'est-ce qui t\'a dépassé aujourd\'hui ?',
  'Ton wanda, c\'est par ici... #wanda',
  'Partage ton wanda, on est là pour ça !',
]

const placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]

const suggestions = [
  'transport', 'travail', 'couple', 'cuisine',
  'école', 'santé', 'techno', 'douala',
  'yaoundé', 'weekend', 'famille', 'argent',
]

const userInitial = computed(() =>
  (authStore.user?.displayName || authStore.user?.username || '?').charAt(0).toUpperCase()
)

const detectedHashtags = computed(() => extractHashtags(content.value))

const canSubmit = computed(() => content.value.trim().length > 0 && content.value.length <= 1000)

const addHashtag = (tag: string) => {
  if (!content.value.includes(`#${tag}`)) {
    content.value = content.value.trimEnd() + (content.value.length ? ' ' : '') + `#${tag} `
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

const handleImageSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    imagePreview.value = await resizeAndConvertToBase64(file, 800)
    expanded.value = true
  } catch (err) {
    console.error('Image select error:', err)
  }
}

const removeImage = () => {
  imagePreview.value = null
}

const submitPost = async () => {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await postsStore.createPost(content.value.trim(), imagePreview.value || undefined)
    content.value = ''
    expanded.value = false
    imagePreview.value = null
    emit('posted')
  } catch (err) {
    console.error('Failed to create post:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hashtag-preview {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(75, 131, 240, 0.15);
  color: #4B83F0;
}

.hashtag-suggestion {
  font-size: 0.75rem;
  color: var(--wanda-text-muted);
  border-color: var(--wanda-border);

  &:hover {
    background: rgba(75, 131, 240, 0.1);
    color: #4B83F0;
    border-color: #4B83F0;
  }
}

.image-preview-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.image-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 0.75rem;
  object-fit: cover;
}

.image-remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.85);
  }
}
</style>
