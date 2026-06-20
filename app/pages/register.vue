<template>
  <div class="pb-5">
    <!-- Title Section -->
    <div class="text-center mb-4">
      <h1 class="fw-bold mb-2" style="font-size: 1.75rem;">Créer un compte</h1>
      <p class="text-wanda-muted" style="line-height: 1.6;">
        Rejoins la communauté et partage tes wandas du quotidien.
      </p>
    </div>

    <form @submit.prevent="handleRegister">
      <!-- Error Alert -->
      <div v-if="error" class="alert alert-danger rounded-2 small mb-4" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
      </div>

      <!-- Display Name -->
      <div class="mb-3">
        <label for="registerDisplayName" class="form-label fw-semibold">
          Nom d'affichage <span class="text-danger">*</span>
        </label>
        <input
          id="registerDisplayName"
          v-model="displayName"
          type="text"
          class="form-control form-control-lg"
          required
          autocomplete="name"
        />
        <div class="form-text">Le nom qui sera affiché sur ton profil.</div>
      </div>

      <!-- Username -->
      <div class="mb-3">
        <label for="registerUsername" class="form-label fw-semibold">
          Nom d'utilisateur <span class="text-danger">*</span>
        </label>
        <input
          id="registerUsername"
          v-model="username"
          type="text"
          class="form-control form-control-lg"
          required
          autocomplete="username"
        />
        <div class="form-text">Tu peux utiliser des lettres, des chiffres et des tirets bas.</div>
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label for="registerEmail" class="form-label fw-semibold">
          Adresse e-mail <span class="text-danger">*</span>
        </label>
        <input
          id="registerEmail"
          v-model="email"
          type="email"
          class="form-control form-control-lg"
          required
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="mb-3">
        <label for="registerPassword" class="form-label fw-semibold">
          Mot de passe <span class="text-danger">*</span>
        </label>
        <input
          id="registerPassword"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="form-control form-control-lg"
          required
          minlength="8"
          autocomplete="new-password"
        />
        <!-- Password strength -->
        <div class="mt-2">
          <div class="progress" style="height: 3px;">
            <div
              class="progress-bar"
              :class="passwordStrengthClass"
              :style="{ width: `${passwordStrength}%` }"
            ></div>
          </div>
          <div class="form-text">{{ passwordStrengthLabel || 'Minimum 8 caractères' }}</div>
        </div>
      </div>

      <!-- Password Confirm -->
      <div class="mb-4">
        <label for="registerPasswordConfirm" class="form-label fw-semibold">
          Confirmation du mot de passe
        </label>
        <input
          id="registerPasswordConfirm"
          v-model="passwordConfirm"
          :type="showPassword ? 'text' : 'password'"
          class="form-control form-control-lg"
          autocomplete="new-password"
        />
        <div class="form-check mt-2">
          <input
            id="showPasswordCheck"
            v-model="showPassword"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label small text-wanda-muted" for="showPasswordCheck">
            Afficher le mot de passe
          </label>
        </div>
      </div>

      <!-- Terms -->
      <div class="form-check mb-4">
        <input
          id="acceptTerms"
          v-model="acceptedTerms"
          class="form-check-input"
          type="checkbox"
          required
        />
        <label class="form-check-label small" for="acceptTerms">
          J'ai lu et j'accepte les <a href="#" class="text-primary">conditions d'utilisation</a>
          et la <a href="#" class="text-primary">politique de confidentialité</a>
        </label>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="btn btn-primary btn-lg w-100 fw-bold mb-3"
        :disabled="loading || !acceptedTerms"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        S'inscrire
      </button>
    </form>

    <!-- Google Separator -->
    <div class="d-flex align-items-center gap-3 my-3">
      <hr class="flex-grow-1 m-0" />
      <span class="text-wanda-muted small">ou</span>
      <hr class="flex-grow-1 m-0" />
    </div>

    <!-- Google Sign-In -->
    <button
      class="btn btn-outline-secondary btn-lg w-100 d-flex align-items-center justify-content-center gap-2 mb-4"
      :disabled="googleLoading"
      @click="handleGoogleRegister"
    >
      <span v-if="googleLoading" class="spinner-border spinner-border-sm"></span>
      <i v-else class="bi bi-google"></i>
      Continuer avec Google
    </button>

    <!-- Bottom Links -->
    <div class="text-center">
      <span class="text-wanda-muted">Déjà un compte ?</span>
      <NuxtLink to="/" class="text-primary text-decoration-none fw-medium ms-1">
        Se connecter
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const authStore = useAuthStore()

const displayName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const acceptedTerms = ref(false)
const loading = ref(false)
const error = ref('')
const googleLoading = ref(false)

const passwordStrength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score += 25
  if (/[A-Z]/.test(p)) score += 25
  if (/[0-9]/.test(p)) score += 25
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score += 25
  return score
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value <= 25) return 'bg-danger'
  if (passwordStrength.value <= 50) return 'bg-warning'
  if (passwordStrength.value <= 75) return 'bg-info'
  return 'bg-success'
})

const passwordStrengthLabel = computed(() => {
  if (password.value.length === 0) return ''
  if (passwordStrength.value <= 25) return 'Faible'
  if (passwordStrength.value <= 50) return 'Moyen'
  if (passwordStrength.value <= 75) return 'Bon'
  return 'Excellent'
})

const handleRegister = async () => {
  error.value = ''

  if (passwordConfirm.value && password.value !== passwordConfirm.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true
  try {
    await authStore.register(username.value, email.value, password.value, displayName.value)
    navigateTo('/')
  } catch (err: any) {
    const { getFirebaseErrorMessage } = await import('~/types')
    error.value = getFirebaseErrorMessage(err?.code || '')
  } finally {
    loading.value = false
  }
}

const handleGoogleRegister = async () => {
  error.value = ''
  googleLoading.value = true
  try {
    await authStore.loginWithGoogle()
    navigateTo('/')
  } catch (err: any) {
    const { getFirebaseErrorMessage } = await import('~/types')
    error.value = getFirebaseErrorMessage(err?.code || '')
  } finally {
    googleLoading.value = false
  }
}
</script>
