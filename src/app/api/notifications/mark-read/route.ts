import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    // Handle "mark all as read"
    if (notificationId === 'all') {
      const unreadNotifications = await payload.find({
        collection: 'notifications',
        where: {
          and: [
            { recipient: { equals: user.id } },
            { read: { equals: false } },
          ],
        },
        user,
        overrideAccess: false,
      })

      await Promise.all(
        unreadNotifications.docs.map((notification) =>
          payload.update({
            collection: 'notifications',
            id: notification.id,
            data: { read: true },
            user,
            overrideAccess: false,
          })
        )
      )

      return NextResponse.json({ success: true, updated: unreadNotifications.docs.length })
    }

    // Handle single notification — verify ownership first
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      user,
      overrideAccess: false,
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: { read: true },
      user,
      overrideAccess: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark notification as read' },
      { status: 500 },
    )
  }
}
