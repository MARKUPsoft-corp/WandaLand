<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop-custom" @click.self="$emit('close')">
      <div class="modal-content-custom">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h5 class="fw-bold mb-0">Modifier le profil</h5>
          <button class="btn-close" @click="$emit('close')"></button>
        </div>

        <form @submit.prevent="handleSave">
          <div class="mb-3">
            <label class="form-label small fw-medium">Nom d'affichage</label>
            <input
              v-model="form.displayName"
              type="text"
              class="form-control"
              placeholder="Ton nom"
              required
            />
          </div>

          <div class="mb-3">
            <label class="form-label small fw-medium">Nom d'utilisateur</label>
            <div class="input-group">
              <span class="input-group-text">@</span>
              <input
                v-model="form.username"
                type="text"
                class="form-control"
                placeholder="username"
                required
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label small fw-medium">Bio</label>
            <textarea
              v-model="form.bio"
              class="form-control"
              rows="3"
              placeholder="Parle-nous de toi..."
              maxlength="160"
            ></textarea>
            <small class="text-wanda-muted">{{ form.bio?.length || 0 }}/160</small>
          </div>

          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary fw-bold" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref as dbRef, update } from 'firebase/database'
import { getFirebaseRtdb } from '~/utils/firebase'
import type { User } from '~/types'

const props = defineProps<{
  show: boolean
  user: User
}>()

const emit = defineEmits<{
  close: []
  saved: [user: Partial<User>]
}>()

const saving = ref(false)

const form = reactive({
  displayName: props.user.displayName,
  username: props.user.username,
  bio: props.user.bio || '',
})

watch(() => props.show, (val) => {
  if (val) {
    form.displayName = props.user.displayName
    form.username = props.user.username
    form.bio = props.user.bio || ''
  }
})

const handleSave = async () => {
  saving.value = true
  try {
    const rtdb = getFirebaseRtdb()
    const updates = {
      displayName: form.displayName,
      username: form.username.toLowerCase(),
      bio: form.bio,
    }
    await update(dbRef(rtdb, `users/${props.user.id}`), updates)
    emit('saved', updates)
    emit('close')
  } catch (err) {
    console.error('Error updating profile:', err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1060;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content-custom {
  background: var(--wanda-bg-card);
  border: 1px solid var(--wanda-border);
  border-radius: 1rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}
</style>
