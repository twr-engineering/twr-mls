'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

type ListingImage = {
  id: string | number
  url?: string
  filename?: string
  alt?: string
}

type Notification = {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
  listing?: {
    id: string
    title: string
    fullAddress?: string
    price?: number
    images?: (ListingImage | string | number)[]
  }
}

function getImageUrl(img: ListingImage | string | number): string | null {
  if (typeof img === 'string' || typeof img === 'number') return null
  if (img.url) {
    if (img.url.startsWith('http')) return img.url
    if (img.filename) {
      return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${img.filename}`
    }
    return img.url
  }
  if (img.filename) {
    return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${img.filename}`
  }
  return null
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.docs || [])
        setUnreadCount(data.docs?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all' }),
      })
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'listing_published':
        return '🎉'
      case 'listing_needs_revision':
        return '✏️'
      case 'listing_rejected':
        return '❌'
      case 'listing_submitted':
        return '📤'
      default:
        return '🔔'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'listing_published':
        return <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] px-1.5 py-0">Published</Badge>
      case 'listing_needs_revision':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] px-1.5 py-0">Revision</Badge>
      case 'listing_rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] px-1.5 py-0">Rejected</Badge>
      case 'listing_submitted':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] px-1.5 py-0">Submitted</Badge>
      default:
        return null
    }
  }

  // Get the first valid image URL from listing images
  const getListingThumbnail = (notification: Notification): string | null => {
    if (!notification.listing?.images || notification.listing.images.length === 0) return null
    for (const img of notification.listing.images) {
      const url = getImageUrl(img)
      if (url) return url
    }
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/notifications">View all</Link>
            </Button>
          </div>
        </div>

        {/* List */}
        <ScrollArea className="h-[440px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Updates about your listings will appear here
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const thumbnail = getListingThumbnail(notification)

                return (
                  <div
                    key={notification.id}
                    className={`border-b last:border-b-0 transition-colors ${!notification.read
                        ? 'bg-blue-50/50'
                        : 'hover:bg-muted/40'
                      }`}
                  >
                    <div className="p-3">
                      <div className="flex gap-3">
                        {/* Thumbnail or icon */}
                        {thumbnail ? (
                          <div className="flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border bg-muted">
                            <img
                              src={thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Top row: badge + time + unread dot */}
                          <div className="flex items-center gap-1.5">
                            {getTypeBadge(notification.type)}
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            {!notification.read && (
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 ml-auto" />
                            )}
                          </div>

                          {/* Message */}
                          <p
                            className={`text-[13px] leading-snug ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-600'
                              }`}
                          >
                            {notification.message}
                          </p>

                          {/* Listing link + Mark read */}
                          <div className="flex items-center gap-2 pt-0.5">
                            {notification.listing && (
                              <Link
                                href={`/listings/${notification.listing.id}`}
                                onClick={() => {
                                  if (!notification.read) markAsRead(notification.id)
                                  setIsOpen(false)
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {notification.listing.title}
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
