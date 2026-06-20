<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { initTheme } = useTheme()

onMounted(() => {
  authStore.initAuth()
  initTheme()
})
</script>
