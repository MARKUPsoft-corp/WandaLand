<template>
  <nav class="bottom-nav d-lg-none">
    <div class="d-flex justify-content-around align-items-center">
      <NuxtLink
        to="/"
        class="bottom-nav-item text-center text-decoration-none"
        :class="{ active: route.path === '/' }"
      >
        <i class="bi fs-5 d-block" :class="route.path === '/' ? 'bi-house-fill' : 'bi-house'"></i>
        <span class="bottom-nav-label">Accueil</span>
      </NuxtLink>

      <button
        class="bottom-nav-item text-center"
        @click="$emit('showSearch')"
      >
        <i class="bi bi-search fs-5 d-block"></i>
        <span class="bottom-nav-label">Rechercher</span>
      </button>

      <!-- Center Create Button -->
      <button
        v-if="authStore.isAuthenticated"
        class="bottom-nav-create"
        @click="postModal.open()"
      >
        <i class="bi bi-plus-lg"></i>
      </button>

      <button
        class="bottom-nav-item text-center"
        @click="$emit('showTrends')"
      >
        <i class="bi bi-fire fs-5 d-block"></i>
        <span class="bottom-nav-label">Wandaful</span>
      </button>

      <template v-if="authStore.isAuthenticated">
        <NuxtLink
          :to="`/profile/${authStore.user?.id || ''}`"
          class="bottom-nav-item text-center text-decoration-none"
          :class="{ active: route.path.startsWith('/profile') }"
        >
          <i class="bi fs-5 d-block" :class="route.path.startsWith('/profile') ? 'bi-person-fill' : 'bi-person'"></i>
          <span class="bottom-nav-label">Profil</span>
        </NuxtLink>
      </template>
      <template v-else>
        <NuxtLink
          to="/"
          class="bottom-nav-item text-center text-decoration-none"
          :class="{ active: route.path === '/' }"
        >
          <i class="bi bi-box-arrow-in-right fs-5 d-block"></i>
          <span class="bottom-nav-label">Connexion</span>
        </NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const postModal = usePostModal()

defineEmits(['showTrends', 'showSearch'])
</script>

<style scoped lang="scss">
.bottom-nav-item {
  color: var(--wanda-text-muted);
  transition: color 0.15s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0;
  min-height: 44px;
  border: none;
  background: none;
  cursor: pointer;

  &.active, &:hover {
    color: var(--wanda-blue);
  }
}

.bottom-nav-label {
  font-size: 0.6rem;
  font-weight: 600;
  margin-top: 0.125rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.bottom-nav-create {
  width: 44px;
  height: 44px;
  background: var(--wanda-blue, #2563EB);
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-top: -1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:active {
    transform: scale(0.93);
  }
}
</style>
