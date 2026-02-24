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
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
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
      // Reject deactivated accounts even if their JWT is still valid
      if (user.isActive === false) {
        return null
      }

      // Resolve avatar URL
      let avatarUrl: string | null = null

      if (user.avatar) {
        if (typeof user.avatar === 'object' && 'url' in user.avatar) {
          // Avatar is already populated as a Media object
          const media = user.avatar as { url?: string; filename?: string }
          if (media.url && media.url.startsWith('http')) {
            avatarUrl = media.url
          } else if (media.filename) {
            const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID
            if (projectId) {
              avatarUrl = `https://${projectId}.supabase.co/storage/v1/object/public/media/${media.filename}`
            }
          } else if (media.url) {
            avatarUrl = media.url
          }
        } else if (typeof user.avatar === 'number' || typeof user.avatar === 'string') {
          // Avatar is just an ID - fetch the media record
          try {
            const media = await payload.findByID({
              collection: 'media',
              id: user.avatar,
              depth: 0,
            })
            if (media) {
              if (media.url && media.url.startsWith('http')) {
                avatarUrl = media.url
              } else if (media.filename) {
                const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID
                if (projectId) {
                  avatarUrl = `https://${projectId}.supabase.co/storage/v1/object/public/media/${media.filename}`
                }
              } else if (media.url) {
                avatarUrl = media.url
              }
            }
          } catch {
            // Media not found, leave as null
          }
        }
      }

      return {
        id: user.id,
        email: user.email as string,
        role: user.role,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        phone: user.phone || null,
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
