// Shared state for the post creation modal (used across Sidebar, BottomNav, PostForm)
const showPostModal = ref(false)

export const usePostModal = () => {
  const open = () => { showPostModal.value = true }
  const close = () => { showPostModal.value = false }

  return {
    show: showPostModal,
    open,
    close,
  }
}
