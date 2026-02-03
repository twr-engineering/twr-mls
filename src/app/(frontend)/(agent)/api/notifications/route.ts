import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch notifications for current user
    const notifications = await payload.find({
      collection: 'notifications',
      where: {
        recipient: {
          equals: user.id,
        },
      },
      sort: '-createdAt',
      limit: 50,
      user,
      overrideAccess: false,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
