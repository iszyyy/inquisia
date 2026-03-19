import type { User, UserRole } from './types'

export function getDefaultRouteForRole(role?: UserRole | null, userId?: string | null): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'student':
    case 'supervisor':
      return '/dashboard'
    case 'public':
      return userId ? `/profile/${userId}` : '/projects'
    default:
      return '/'
  }
}

export function getDefaultRouteForUser(user?: User | null): string {
  return getDefaultRouteForRole(user?.role, user?.id)
}

export function getLoginRedirect(pathname: string): string {
  return `/login?redirect=${encodeURIComponent(pathname)}`
}

export function getSafeRedirect(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback
  if (!candidate.startsWith('/')) return fallback
  if (candidate.startsWith('//')) return fallback
  return candidate
}
