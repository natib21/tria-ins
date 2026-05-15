'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@/lib/types'
import { getStoredUser, getStoredToken, clearAuth } from '@/lib/auth'
import { api } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

   useEffect(() => {
    const token = getStoredToken()
    const storedUser = getStoredUser()
    
    console.log('[v0] AuthProvider check - token:', !!token, 'user:', !!storedUser)

    if (token) {
      // Token exists - user is authenticated
      // User object is optional (backend may not return it)
      setUser(storedUser || { id: 'authenticated', name: 'User', email: '' } as User)
    } else if (!pathname.startsWith('/login')) {
      console.log('[v0] No token, redirecting to login')
      router.push('/login')
    }
    setIsLoading(false)
  }, [pathname, router])

  const logout = () => {
    clearAuth()
    setUser(null)
    api.logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
   console.log(isAuthenticated)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
