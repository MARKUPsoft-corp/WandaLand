<template>
  <div class="d-flex flex-column min-vh-100">
    <!-- Top Navbar (authenticated only) -->
    <LayoutNavbar v-if="authStore.isAuthenticated" />

    <!-- Main Content Area -->
    <!-- Authenticated: 3-column layout -->
    <div v-if="authStore.isAuthenticated" class="container-fluid flex-grow-1">
      <div class="row g-0">
        <div class="col-lg-2 sidebar p-3">
          <LayoutSidebar />
        </div>
        <main class="col-12 col-lg-7 main-content pt-3 px-2 px-lg-4">
          <slot />
        </main>
        <div class="col-lg-3 sidebar p-3 d-none d-lg-block">
          <LayoutTrendsSidebar />
        </div>
      </div>
    </div>

    <!-- Visitor: Full-width, no sidebars -->
    <div v-else class="flex-grow-1">
      <slot />
    </div>

    <!-- Mobile Trends Sheet (hidden on lg+) -->
    <Teleport to="body">
      <div
        v-if="showMobileTrends"
        class="mobile-sheet-backdrop d-lg-none"
        @click="showMobileTrends = false"
      ></div>
      <div
        class="mobile-sheet d-lg-none"
        :class="{ open: showMobileTrends }"
      >
        <div class="mobile-sheet-handle" @click="showMobileTrends = false">
          <div class="handle-bar"></div>
        </div>
        <div class="mobile-sheet-content">
          <LayoutTrendsSidebar />
        </div>
      </div>
    </Teleport>

    <!-- Mobile Search Bar (sits above bottom nav, hidden on lg+) -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showMobileSearch"
          class="mobile-search-panel d-lg-none"
        >
          <div class="d-flex align-items-center gap-2 px-3 py-2">
            <div class="wanda-search flex-grow-1" style="max-width: none;">
              <i class="bi bi-search wanda-search-icon"></i>
              <input
                type="search"
                class="wanda-search-input"
                placeholder="Rechercher un wanda..."
                v-model="searchQuery"
                autofocus
                @keydown.esc="showMobileSearch = false"
              />
            </div>
            <button class="btn-icon flex-shrink-0" @click="showMobileSearch = false">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Post Creation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="postModal.show.value" class="post-modal-overlay" @click.self="postModal.close()">
          <div class="post-modal-card">
            <div class="post-modal-header">
              <h6 class="fw-bold mb-0"><i class="bi bi-pencil-square me-2 text-primary"></i>Nouveau Wanda</h6>
              <button class="btn btn-link text-wanda-muted p-0" @click="postModal.close()">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="post-modal-body">
              <PostForm @posted="postModal.close()" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Bottom Nav (mobile + tablet, hidden on lg+) — auth only -->
    <LayoutBottomNav
      v-if="authStore.isAuthenticated"
      @show-trends="showMobileTrends = !showMobileTrends"
      @show-search="showMobileSearch = !showMobileSearch"
    />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const postModal = usePostModal()
const showMobileTrends = ref(false)
const showMobileSearch = ref(false)
const searchQuery = ref('')
</script>

<style scoped lang="scss">
// Mobile bottom sheet for trends
.mobile-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1040;
  animation: fadeIn 0.2s ease;
}

.mobile-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  background: var(--wanda-bg-card);
  border-top-left-radius: 1rem;
  border-top-right-radius: 1rem;
  border-top: 1px solid var(--wanda-border);
  max-height: 65vh;
  transform: translateY(100%);
  transition: transform 0.3s ease;

  &.open {
    transform: translateY(0);
  }

  .mobile-sheet-handle {
    display: flex;
    justify-content: center;
    padding: 0.75rem 0 0.5rem;
    cursor: pointer;

    .handle-bar {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--wanda-border);
    }
  }

  .mobile-sheet-content {
    padding: 0 1rem 2rem;
    overflow-y: auto;
    max-height: calc(65vh - 2.5rem);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Search panel — sits just above the bottom nav
.mobile-search-panel {
  position: fixed;
  bottom: 60px; // above the bottom nav
  left: 0;
  right: 0;
  z-index: 1025;
  background: var(--wanda-bg-card);
  border-top: 1px solid var(--wanda-border);
}

// Slide-up animation
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

// Post Creation Modal
.post-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1060;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.post-modal-card {
  background: var(--wanda-bg);
  border: 1px solid var(--wanda-border);
  border-radius: 1rem;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.post-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--wanda-border);
}

.post-modal-body {
  overflow-y: auto;
  padding: 0;

  // Remove the card border/background from PostForm inside modal
  :deep(.card) {
    border: none !important;
    margin-bottom: 0 !important;
    background: transparent !important;
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
