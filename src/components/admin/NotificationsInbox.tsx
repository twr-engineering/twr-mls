'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

type Notification = {
    id: string
    type: string
    message: string
    read: boolean
    createdAt: string
    listing?: {
        id: string
        title: string
        status?: string
        images?: any[]
    }
}

type FilterType = 'all' | 'unread' | 'pending'

export const NotificationsInbox: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [pendingCount, setPendingCount] = useState<number | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            // We use standard fetch. Force-dynamic config on the API Route
            // guarantees this always fetches fresh data, preventing stale Vercel cache bugs.
            const response = await fetch('/api/notifications?depth=2&select[listing]=id,title,status,images', {
                credentials: 'include',
                cache: 'no-store' // Additional safety for App Router
            })
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

    const fetchPendingCount = useCallback(async () => {
        try {
            // We can fetch from standard payload listings endpoint with the submitted query
            const response = await fetch('/api/listings?limit=0&where[and][0][status][equals]=submitted', {
                credentials: 'include',
                cache: 'no-store'
            })
            if (response.ok) {
                const data = await response.json()
                setPendingCount(data.totalDocs ?? 0)
            }
        } catch (error) {
            console.error('Failed to fetch pending count:', error)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        fetchPendingCount()
    }, [fetchNotifications, fetchPendingCount])

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

    const unreadCount = notifications.filter((n) => !n.read).length

    // Filter Logic
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read
        if (filter === 'pending') return notification.type === 'listing_submitted' && notification.listing?.status === 'submitted'
        return true
    })

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 var(--base-gap)' }}>

            {/* Header Area */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>Approver Inbox</h1>
                    <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
                        Manage notifications and review submitted listings.
                    </p>
                </div>

                {/* Left to Review Dashboard Pill */}
                {pendingCount !== null && (
                    <Link
                        href="/admin/collections/listings?where[or][0][and][0][status][equals]=submitted"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: pendingCount > 0 ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
                            border: `1px solid ${pendingCount > 0 ? 'var(--theme-success-200)' : 'var(--theme-elevation-200)'}`,
                            padding: '12px 20px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: 'var(--theme-elevation-800)',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: pendingCount > 0 ? 'var(--theme-success-500)' : 'var(--theme-elevation-400)',
                            color: 'white',
                            height: '32px',
                            minWidth: '32px',
                            padding: '0 8px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            {pendingCount}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '15px' }}>Pending Reviews</div>
                            <div style={{ fontSize: '12px', color: 'var(--theme-elevation-500)' }}>
                                {pendingCount === 0 ? 'All caught up!' : 'Awaiting your approval'}
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            {/* Filter Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'var(--theme-elevation-50)',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'unread', 'pending'] as FilterType[]).map((fType) => (
                        <button
                            key={fType}
                            onClick={() => setFilter(fType)}
                            style={{
                                background: filter === fType ? 'var(--theme-elevation-800)' : 'transparent',
                                color: filter === fType ? 'white' : 'var(--theme-elevation-600)',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: filter === fType ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {fType === 'all' && 'All'}
                            {fType === 'unread' && `Unread (${unreadCount})`}
                            {fType === 'pending' && 'Awaiting Review'}
                        </button>
                    ))}
                </div>

                {unreadCount > 0 && filter === 'all' && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--theme-elevation-200)',
                            color: 'var(--theme-elevation-800)',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500
                        }}
                    >
                        Mark All as Read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div style={{
                border: '1px solid var(--theme-elevation-150)',
                background: 'var(--theme-bg)',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden'
            }}>
                {isLoading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--theme-elevation-400)' }}>
                        Loading inbox...
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div style={{
                        padding: '80px 20px',
                        textAlign: 'center',
                    }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                            {filter === 'unread' ? 'No unread notifications' : filter === 'pending' ? 'No pending reviews right now' : 'Inbox is empty'}
                        </h3>
                        <p style={{ color: 'var(--theme-elevation-500)', margin: 0, fontSize: '15px' }}>
                            You're all caught up! Check back later for new updates.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredNotifications.map((notification, idx) => (
                            <div
                                key={notification.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '16px',
                                    padding: '24px 20px',
                                    background: notification.read ? 'transparent' : 'var(--theme-elevation-50)',
                                    borderBottom: idx < filteredNotifications.length - 1 ? '1px solid var(--theme-elevation-100)' : 'none',
                                    transition: 'background 0.2s ease',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                        {!notification.read && (
                                            <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'var(--theme-success-400)' }} />
                                        )}
                                        <span style={{ fontSize: '13px', color: 'var(--theme-elevation-500)', fontWeight: 500 }}>
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <p style={{
                                        fontSize: '16px',
                                        fontWeight: !notification.read ? 600 : 400,
                                        color: 'var(--theme-elevation-800)',
                                        margin: '0 0 16px 0',
                                        lineHeight: 1.5
                                    }}>
                                        {notification.message}
                                    </p>

                                    {notification.listing && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            background: 'var(--theme-elevation-50)',
                                            border: '1px solid var(--theme-elevation-150)',
                                            padding: '8px 16px 8px 8px',
                                            borderRadius: '8px'
                                        }}>
                                            {notification.listing.images && notification.listing.images.length > 0 && typeof notification.listing.images[0] === 'object' && notification.listing.images[0]?.url && (
                                                <div style={{
                                                    position: 'relative',
                                                    height: '48px',
                                                    width: '48px',
                                                    flexShrink: 0,
                                                    overflow: 'hidden',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--theme-elevation-200)',
                                                    background: 'var(--theme-bg)'
                                                }}>
                                                    <Image
                                                        src={notification.listing.images[0].url}
                                                        alt={notification.listing.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--theme-elevation-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {notification.listing.status === 'submitted' ? 'Pending Approval' : 'Property Listing'}
                                                </span>
                                                <Link
                                                    href={`/admin/collections/listings/${notification.listing.id}/preview`}
                                                    style={{
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        color: 'var(--theme-primary)',
                                                        textDecoration: 'none',
                                                    }}
                                                >
                                                    {notification.listing.title}
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification.id)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--theme-elevation-200)',
                                            borderRadius: '4px',
                                            color: 'var(--theme-elevation-600)',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            padding: '6px 12px',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'var(--theme-elevation-900)'
                                            e.currentTarget.style.borderColor = 'var(--theme-elevation-300)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--theme-elevation-600)'
                                            e.currentTarget.style.borderColor = 'var(--theme-elevation-200)'
                                        }}
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

export default NotificationsInbox
