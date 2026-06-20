// ========================================
// Types — WandaLand
// ========================================

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  postsCount?: number
  followersCount?: number
  followingCount?: number
  createdAt: string
}

export interface PostAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

export interface Post {
  id: string
  content: string
  imageUrl?: string
  hashtags: string[]
  author: PostAuthor
  createdAt: string
  _count: {
    comments: number
    likes: number
  }
  isLiked?: boolean
}

export interface Comment {
  id: string
  content: string
  author: PostAuthor
  createdAt: string
  parentId?: string
  replyToUsername?: string
  likesCount?: number
  likes?: Record<string, boolean>
}

/**
 * Extract hashtags from text content.
 * Matches #word patterns (supports accented chars).
 * Returns lowercase tags without the # prefix.
 */
export const extractHashtags = (text: string): string[] => {
  const matches = text.match(/#[\wÀ-ÿ]+/g)
  if (!matches) return []
  // Deduplicate and lowercase
  const unique = [...new Set(matches.map(m => m.slice(1).toLowerCase()))]
  return unique
}

// Firebase error codes → french messages
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Cette adresse e-mail est déjà utilisée.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/user-not-found': 'Aucun compte trouvé avec cette adresse e-mail.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.',
  'auth/network-request-failed': 'Erreur de connexion. Vérifie ta connexion internet.',
}

export const getFirebaseErrorMessage = (code: string): string => {
  return FIREBASE_ERROR_MESSAGES[code] || 'Une erreur est survenue. Réessaie.'
}
