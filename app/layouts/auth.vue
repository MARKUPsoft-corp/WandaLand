<template>
  <div class="auth-page min-vh-100 d-flex flex-column">
    <!-- Logo centered at top -->
    <div class="text-center pt-5 mb-4">
      <NuxtLink to="/" class="text-decoration-none d-inline-flex align-items-center gap-2">
        <img src="/wandaland_logo.svg" alt="WandaLand" height="40" width="42" />
        <span class="fw-bold fs-4" style="color: #4B83F0;">WandaLand</span>
      </NuxtLink>
    </div>

    <!-- Centered form container -->
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12" style="max-width: 480px;">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  /* Force dark mode */
  background: #0F1117 !important;
  color: #E4E6EB;
  --wanda-bg: #0F1117;
  --wanda-bg-card: #1C1E2A;
  --wanda-bg-surface: #252836;
  --wanda-text: #E4E6EB;
  --wanda-text-secondary: #A0A3B1;
  --wanda-text-muted: #6C6F7F;
  --wanda-border: #2A2D3A;
  --wanda-blue: #4B83F0;

  :deep(.form-control) {
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

  :deep(.form-label) {
    color: #A0A3B1;
  }

  :deep(.text-wanda-muted) {
    color: #6C6F7F !important;
  }

  :deep(.fw-bold),
  :deep(h1) {
    color: #E4E6EB;
  }

  :deep(.input-group-text) {
    background-color: #252836;
    border-color: #2A2D3A;
    color: #A0A3B1;
  }
}
</style>
