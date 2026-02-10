'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Copy, Trash2, ExternalLink, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import type { SharedLink } from '@/payload-types'

export const dynamic = 'force-dynamic'

type CuratedLinksListProps = {
    initialLinks: SharedLink[]
}

export function CuratedLinksList({ initialLinks }: CuratedLinksListProps) {
    const [links, setLinks] = useState<SharedLink[]>(initialLinks)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleCopyLink = async (slug: string, id: string) => {
        const baseUrl = typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const shareUrl = `${baseUrl}/shared/${slug}`

        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopiedId(id.toString())
            toast.success('Link copied to clipboard!')
            setTimeout(() => setCopiedId(null), 2000)
        } catch {
            prompt('Copy this link:', shareUrl)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shared link?')) return

        setDeletingId(id.toString())
        try {
            const response = await fetch(`/api/shared-links/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete link')
            }

            setLinks(links.filter(link => link.id.toString() !== id.toString()))
            toast.success('Link deleted successfully')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete link')
        } finally {
            setDeletingId(null)
        }
    }

    const getBaseUrl = () => {
        return typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    }

    if (links.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            You haven&apos;t created any curated links yet
                        </p>
                        <Button asChild>
                            <Link href="/mls">
                                <Plus className="h-4 w-4 mr-2" />
                                Browse MLS to Create Curated Link
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {links.map((link) => {
                const shareUrl = `${getBaseUrl()}/shared/${link.slug}`

                return (
                    <Card key={link.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                    <CardTitle className="text-lg">{link.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Created {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <Badge variant="default">Active</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Share URL:</span>
                                    <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                                        {shareUrl}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyLink(link.slug, link.id.toString())}
                                    className="gap-2"
                                >
                                    {copiedId === link.id.toString() ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy Link
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                        <ExternalLink className="h-4 w-4" />
                                        Preview
                                    </a>
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(link.id.toString())}
                                    disabled={deletingId === link.id.toString()}
                                    className="gap-2 ml-auto"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deletingId === link.id.toString() ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
