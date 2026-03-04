'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, RotateCcw, XCircle } from 'lucide-react'

interface ListingReviewActionsProps {
    listingId: string | number
    currentStatus: string
}

export function ListingReviewActions({ listingId, currentStatus }: ListingReviewActionsProps) {
    const router = useRouter()
    const [updating, setUpdating] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    if (currentStatus !== 'submitted') return null

    const handleAction = async (newStatus: string) => {
        const labels: Record<string, string> = {
            published: 'Publish',
            needs_revision: 'Request Revision',
            rejected: 'Reject',
        }

        if (!confirm(`Are you sure you want to ${labels[newStatus]?.toLowerCase() || 'update'} this listing?`)) return

        setUpdating(true)
        setMessage(null)
        try {
            const res = await fetch(`/api/listings/${listingId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (res.ok) {
                setMessage({ type: 'success', text: `Listing ${labels[newStatus]?.toLowerCase()} successfully!` })
                setTimeout(() => router.refresh(), 1000)
            } else {
                const data = await res.json().catch(() => ({}))
                setMessage({ type: 'error', text: data.errors?.[0]?.message || `Failed to ${labels[newStatus]?.toLowerCase()}.` })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setUpdating(false)
        }
    }

    return (
        <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-base">Review Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    This listing is awaiting your review. Choose an action below.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => handleAction('published')}
                        disabled={updating}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {updating ? 'Processing...' : 'Approve & Publish'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAction('needs_revision')}
                        disabled={updating}
                        className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Needs Revision
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleAction('rejected')}
                        disabled={updating}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                </div>
                {message && (
                    <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {message.text}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
