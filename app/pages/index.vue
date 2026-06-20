<template>
  <div>
    <!-- Loading auth state -->
    <div v-if="authStore.loading" class="d-flex align-items-center justify-content-center" style="min-height: 80vh;">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- ============================== -->
    <!-- VISITOR: X-Style Landing Page  -->
    <!-- ============================== -->
    <div v-else-if="!authStore.isAuthenticated" class="landing-page">

      <div class="landing-container">
        <!-- LEFT: Tagline + Auth -->
        <div class="landing-left">
          <h1 class="landing-tagline">Tes <span class="text-wanda-blue">wandas</span> méritent d'être racontés.</h1>

          <h2 class="landing-subtitle">Rejoins <span class="text-wanda-blue">WandaLand</span> maintenant.</h2>

          <!-- Google -->
          <button
            class="landing-btn landing-btn-outline"
            :disabled="googleLoading"
            @click="handleGoogleLogin"
          >
            <span v-if="googleLoading" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-google"></i>
            Continuer avec Google
          </button>

          <!-- Separator -->
          <div class="landing-separator">
            <hr /><span>ou</span><hr />
          </div>

          <!-- Error -->
          <div v-if="error" class="alert alert-danger py-2 small mb-3">
            <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
          </div>

          <!-- Login form fields -->
          <form @submit.prevent="handleLogin">
            <input
              v-model="email"
              type="email"
              class="form-control form-control-lg mb-2"
              placeholder="E-mail"
              required
            />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control form-control-lg mb-3"
              placeholder="Mot de passe"
              required
            />
            <button
              type="submit"
              class="landing-btn landing-btn-primary"
              :disabled="loginLoading"
            >
              <span v-if="loginLoading" class="spinner-border spinner-border-sm"></span>
              Se connecter
            </button>
          </form>

          <p class="landing-terms">
            En vous connectant, vous acceptez nos
            <a href="#">Conditions d'utilisation</a> et notre
            <a href="#">Politique de confidentialité</a>.
          </p>

          <div class="text-center mt-3">
            <NuxtLink to="/register" class="text-primary text-decoration-none fw-medium">
              S'inscrire
            </NuxtLink>
            <span class="text-wanda-muted mx-2">·</span>
            <a href="#" class="text-wanda-muted text-decoration-none">
              Mot de passe oublié ?
            </a>
          </div>
        </div>

        <!-- RIGHT: Giant Logo -->
        <div class="landing-right">
          <img src="/wandaland_logo.svg" alt="WandaLand" class="landing-giant-logo" />
        </div>
      </div>

      <!-- Footer -->
      <footer class="landing-footer">
        <a href="#">À propos</a>
        <a href="#">Aide</a>
        <a href="#">Confidentialité</a>
        <a href="#">Cookies</a>
        <span>© {{ new Date().getFullYear() }} WandaLand</span>
      </footer>
    </div>

    <!-- ============================== -->
    <!-- AUTHENTICATED: Feed            -->
    <!-- ============================== -->
    <template v-else>
      <!-- Create Post Form -->
      <PostForm @posted="onPostCreated" />

      <!-- Active Hashtag Filter -->
      <div v-if="postsStore.hashtag" class="d-flex align-items-center gap-2 mb-3 p-2 rounded-2" style="background: rgba(75, 131, 240, 0.1);">
        <i class="bi bi-hash text-primary"></i>
        <span class="fw-bold text-primary">#{{ postsStore.hashtag }}</span>
        <button class="btn btn-sm btn-link text-wanda-muted ms-auto p-0" @click="postsStore.setHashtag(null)">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Posts Feed -->
      <div v-if="postsStore.loading && postsStore.posts.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="text-wanda-muted mt-3 small">Chargement des wandas...</p>
      </div>

      <template v-else>
        <PostCard
          v-for="(post, i) in postsStore.filteredPosts"
          :key="post.id"
          :post="post"
          :index="i"
          @like="postsStore.toggleLike"
          @delete="postsStore.deletePost"
        />

        <div v-if="postsStore.page < postsStore.totalPages" class="text-center py-3">
          <button
            class="btn btn-outline-primary btn-sm"
            :disabled="postsStore.loading"
            @click="postsStore.loadMore()"
          >
            <span v-if="postsStore.loading" class="spinner-border spinner-border-sm me-2"></span>
            Charger plus de wandas
          </button>
        </div>

        <div v-if="postsStore.posts.length === 0 && !postsStore.loading" class="text-center py-5">
          <i class="bi bi-inbox text-wanda-muted" style="font-size: 2.5rem;"></i>
          <h6 class="fw-bold mt-3">Aucun wanda pour l'instant</h6>
          <p class="text-wanda-muted small">Sois le premier à partager ton wanda !</p>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">


definePageMeta({
  layout: 'default',
})

const authStore = useAuthStore()
const postsStore = usePostsStore()

const googleLoading = ref(false)
const loginLoading = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')



const onPostCreated = () => {}

const handleGoogleLogin = async () => {
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

const handleLogin = async () => {
  error.value = ''
  loginLoading.value = true
  try {
    await authStore.login(email.value, password.value)
    navigateTo('/')
  } catch (err: any) {
    const { getFirebaseErrorMessage } = await import('~/types')
    error.value = getFirebaseErrorMessage(err?.code || '')
  } finally {
    loginLoading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    postsStore.loadSeenPosts()
    if (postsStore.posts.length === 0) {
      postsStore.fetchPosts(true)
    }
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    postsStore.loadSeenPosts()
    postsStore.fetchPosts(true)
  }
})

// Mark posts as seen after they've been displayed for 2 seconds
let seenTimer: ReturnType<typeof setTimeout> | null = null
watch(() => postsStore.filteredPosts, (posts) => {
  if (seenTimer) clearTimeout(seenTimer)
  seenTimer = setTimeout(() => {
    if (posts.length > 0) {
      postsStore.markAsSeen(posts.map(p => p.id))
    }
  }, 2000)
}, { immediate: true })
</script>

<style scoped lang="scss">
.text-wanda-blue {
  color: #4B83F0;
}
/* X-Style Landing Page — always dark */
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  /* Force dark mode regardless of theme */
  background: #0F1117;
  color: #E4E6EB;
  --wanda-bg: #0F1117;
  --wanda-bg-card: #1C1E2A;
  --wanda-bg-surface: #252836;
  --wanda-text: #E4E6EB;
  --wanda-text-secondary: #A0A3B1;
  --wanda-text-muted: #6C6F7F;
  --wanda-border: #2A2D3A;
  --wanda-blue: #4B83F0;
}

.landing-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 4rem 2rem;
}

/* LEFT — Auth section */
.landing-left {
  flex: 0 0 480px;
  max-width: 480px;
  padding-right: 2rem;

  .form-control {
    background-color: #1C1E2A;
    border-color: #2A2D3A;
    color: #E4E6EB;

    &::placeholder {
      color: #6C6F7F;
    }

    &:focus {
      background-color: #252836;
      border-color: #4B83F0;
      color: #E4E6EB;
      box-shadow: 0 0 0 2px rgba(75, 131, 240, 0.15);
    }
  }

  .landing-tagline {
    font-size: 2.5rem;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--wanda-text);
    margin-bottom: 2.5rem;
  }

  .landing-subtitle {
    font-size: 1.3rem;
    font-weight: 800;
    color: var(--wanda-text);
    margin-bottom: 1.5rem;
  }
}

/* RIGHT — Giant logo */
.landing-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;

  .landing-giant-logo {
    width: clamp(300px, 45vw, 500px);
    height: auto;
    user-select: none;
    pointer-events: none;
  }
}

/* Buttons */
.landing-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: background 0.15s, opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.landing-btn-outline {
  background: transparent;
  border: 1px solid var(--wanda-border);
  color: var(--wanda-text);

  &:hover {
    background: var(--wanda-bg-surface);
  }
}

.landing-btn-primary {
  background: var(--wanda-blue);
  color: #fff;

  &:hover {
    opacity: 0.9;
  }
}

.landing-btn-signup {
  background: #2da44e;
  color: #fff;

  &:hover {
    background: #258b3e;
  }
}

.landing-btn-login {
  background: transparent;
  border: 1px solid var(--wanda-blue);
  color: var(--wanda-blue);

  &:hover {
    background: rgba(75, 131, 240, 0.08);
  }
}

/* Separator */
.landing-separator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;

  hr {
    flex: 1;
    border: none;
    border-top: 1px solid var(--wanda-border);
    margin: 0;
  }

  span {
    color: var(--wanda-text-muted);
    font-size: 0.8rem;
  }
}

/* Terms */
.landing-terms {
  font-size: 0.7rem;
  color: var(--wanda-text-muted);
  margin-top: 0.5rem;
  line-height: 1.5;

  a {
    color: var(--wanda-blue);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* Login section */
.landing-login-section {
  margin-top: 2.5rem;

  .landing-login-label {
    font-size: 1rem;
    font-weight: 700;
    color: var(--wanda-text);
    margin-bottom: 0.75rem;
  }
}

/* Footer */
.landing-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1.25rem 2rem;
  font-size: 0.75rem;
  color: var(--wanda-text-muted);

  a {
    color: var(--wanda-text-muted);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* Responsive (mobile stacked) */
@media (max-width: 991.98px) {
  .landing-container {
    flex-direction: column-reverse;
    padding: 2rem 1.5rem;
    gap: 1rem;
  }

  .landing-left {
    flex: none;
    max-width: 100%;
    width: 100%;
    padding-right: 0;
    text-align: center;

    .landing-tagline {
      font-size: 2rem;
      margin-bottom: 1.5rem;
    }

    .landing-subtitle {
      font-size: 1.2rem;
    }

    .landing-btn {
      max-width: 340px;
      margin-left: auto;
      margin-right: auto;
    }

    .landing-terms {
      text-align: center;
    }

    .landing-login-section {
      text-align: center;

      .landing-btn {
        max-width: 340px;
        margin-left: auto;
        margin-right: auto;
      }
    }
  }

  .landing-right {
    min-height: auto;
    padding: 1rem 0;

    .landing-giant-logo {
      width: 120px;
    }
  }
}
</style>
