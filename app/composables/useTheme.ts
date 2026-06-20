// ========================================
// useTheme — Dark/Light mode toggle
// With circular propagation animation
// ========================================

export const useTheme = () => {
  const colorMode = useState<'light' | 'dark'>('theme-mode', () => 'light')

  const isDark = computed(() => colorMode.value === 'dark')

  const toggleTheme = (event?: MouseEvent) => {
    const newMode = colorMode.value === 'light' ? 'dark' : 'light'

    // If View Transitions API is not supported, apply directly
    if (
      !import.meta.client ||
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      colorMode.value = newMode
      applyTheme()
      return
    }

    // Get the click origin (center of the toggle button)
    let x = window.innerWidth / 2
    let y = 0
    if (event) {
      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    // Calculate the max radius to cover the entire screen from the click point
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // Start the view transition
    const transition = document.startViewTransition(() => {
      colorMode.value = newMode
      applyTheme()
    })

    // Animate the circular clip-path on the new view (behind content)
    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` },
        ],
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  const setTheme = (mode: 'light' | 'dark') => {
    colorMode.value = mode
    applyTheme()
  }

  const applyTheme = () => {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-bs-theme', colorMode.value)
      localStorage.setItem('wandaland-theme', colorMode.value)
    }
  }

  const initTheme = () => {
    if (import.meta.client) {
      const saved = localStorage.getItem('wandaland-theme') as 'light' | 'dark' | null
      if (saved) {
        colorMode.value = saved
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        colorMode.value = prefersDark ? 'dark' : 'light'
      }
      applyTheme()
    }
  }

  return {
    colorMode,
    isDark,
    toggleTheme,
    setTheme,
    initTheme,
  }
}
