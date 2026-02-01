import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Handle "mark all as read"
    if (notificationId === 'all') {
      // Find all unread notifications for this user
      const unreadNotifications = await payload.find({
        collection: 'notifications',
        where: {
          and: [
            {
              recipient: {
                equals: user.id,
              },
            },
            {
              read: {
                equals: false,
              },
            },
          ],
        },
        user,
        overrideAccess: false,
      })

      // Update each notification
      const updatePromises = unreadNotifications.docs.map((notification) =>
        payload.update({
          collection: 'notifications',
          id: notification.id,
          data: {
            read: true,
          },
          user,
          overrideAccess: false,
        })
      )

      await Promise.all(updatePromises)

      return NextResponse.json({
        success: true,
        updated: unreadNotifications.docs.length,
      })
    }

    // Handle single notification
    // First verify the notification belongs to this user
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      user,
      overrideAccess: false,
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Update the notification
    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        read: true,
      },
      user,
      overrideAccess: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
