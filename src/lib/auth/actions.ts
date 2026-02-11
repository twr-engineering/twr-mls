'use server'

import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { login, logout as payloadLogout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { User } from '@/payload-types'

export type AuthUser = {
  id: number
  email: string
  role: User['role']
  avatar?: string | null
}

type LoginResult = {
  success: boolean
  error?: string
}

export async function loginAction({
  email,
  password,
}: {
  email: string
  password: string
}): Promise<LoginResult> {
  try {
    const result = await login({
      collection: 'users',
      config,
      email,
      password,
    })

    if (result.user) {
      return { success: true }
    }

    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    }
  }
}

export async function logoutAction(): Promise<void> {
  await payloadLogout({
    config,
  })
  redirect('/')
}

export async function getUser(): Promise<AuthUser | null> {
  try {
    const payload = await getPayload({ config })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (user) {
      // Resolve avatar URL
      let avatarUrl = null
      if (user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar) {
        avatarUrl = user.avatar.url
      }

      return {
        id: user.id,
        email: user.email as string,
        role: user.role,
        avatar: avatarUrl,
      }
    }

    return null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<AuthUser> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return user
}
