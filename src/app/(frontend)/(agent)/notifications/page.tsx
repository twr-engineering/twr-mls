'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, Loader2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

type Notification = {
    id: string
    type: string
    message: string
    read: boolean
    createdAt: string
    listing?: {
        id: string
        title: string
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications', { credentials: 'include' })
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.docs || [])
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
                credentials: 'include',
            })
            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
                )
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
                credentials: 'include',
            })
            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
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

    const getNotificationBadge = (type: string) => {
        switch (type) {
            case 'listing_published':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>
            case 'listing_needs_revision':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Needs Revision</Badge>
            case 'listing_rejected':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
            case 'listing_submitted':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Submitted</Badge>
            default:
                return <Badge variant="outline">Info</Badge>
        }
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated on your listing activity
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All as Read ({unreadCount})
                    </Button>
                )}
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No notifications yet</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm">
                            You&apos;ll see updates here when your listings are reviewed, published, or need revisions.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`transition-colors ${!notification.read
                                    ? 'border-blue-200 bg-blue-50/30 shadow-sm'
                                    : 'hover:bg-muted/30'
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 text-2xl mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getNotificationBadge(notification.type)}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                            )}
                                        </div>

                                        <p
                                            className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                                                }`}
                                        >
                                            {notification.message}
                                        </p>

                                        {notification.listing && (
                                            <Link
                                                href={`/listings/${notification.listing.id}`}
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                {notification.listing.title}
                                            </Link>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-xs"
                                            >
                                                Mark read
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
