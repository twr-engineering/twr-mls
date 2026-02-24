import { NextResponse } from 'next/server'
import { logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Use Payload's logout server function
    await logout({ config })

    // Explicitly remove the cookie to ensure it's cleared with exact matching production flags
    const cookieStore = await cookies()
    cookieStore.set('payload-token', '', {
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to logout' },
      { status: 500 },
    )
  }
}
