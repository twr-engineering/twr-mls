import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
    }

    if (notificationId === 'all') {
      // Mark all unread notifications for this user as read
      const unread = await payload.find({
        collection: 'notifications',
        where: {
          recipient: { equals: user.id },
          read: { equals: false },
        },
        limit: 500,
        depth: 0,
        overrideAccess: false,
        user,
      })

      await Promise.all(
        unread.docs.map((notification) =>
          payload.update({
            collection: 'notifications',
            id: notification.id,
            data: { read: true },
            overrideAccess: false,
            user,
          }),
        ),
      )

      return NextResponse.json({ success: true, updated: unread.docs.length })
    }

    // Mark a single notification as read — verify it belongs to the current user
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      depth: 0,
      overrideAccess: false,
      user,
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const updated = await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: { read: true },
      overrideAccess: false,
      user,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark notification as read' },
      { status: 500 },
    )
  }
}
