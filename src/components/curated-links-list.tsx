'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Copy, Trash2, ExternalLink, Check, Pencil } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SharedLink } from '@/payload-types'

export const dynamic = 'force-dynamic'

type CuratedLinksListProps = {
    initialLinks: SharedLink[]
}

export function CuratedLinksList({ initialLinks }: CuratedLinksListProps) {
    const [links, setLinks] = useState<SharedLink[]>(initialLinks)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [editingLink, setEditingLink] = useState<SharedLink | null>(null)
    const [newTitle, setNewTitle] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

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

    const startEditing = (link: SharedLink) => {
        setEditingLink(link)
        setNewTitle(link.title)
    }

    const handleUpdate = async () => {
        if (!editingLink) return
        if (!newTitle.trim()) {
            toast.error('Title cannot be empty')
            return
        }

        setIsUpdating(true)
        try {
            const response = await fetch(`/api/shared-links/${editingLink.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: newTitle,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update link')
            }

            const updatedLink = await response.json()

            setLinks(links.map(link =>
                link.id === editingLink.id ? { ...link, title: updatedLink.title } : link
            ))

            toast.success('Link updated successfully')
            setEditingLink(null)
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update link')
        } finally {
            setIsUpdating(false)
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
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(link)}
                                    className="gap-2"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
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

            <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Shared Link</DialogTitle>
                        <DialogDescription>
                            Update the title for this shared link.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Enter a descriptive title"
                                className="text-foreground"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingLink(null)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating || !newTitle.trim()}
                        >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
