import type { User } from './types'

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userJson = localStorage.getItem('auth_user')
  if (!userJson) return null
  
  try {
    return JSON.parse(userJson) as User
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}
