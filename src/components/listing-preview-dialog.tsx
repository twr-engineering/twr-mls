'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BedDouble,
    Bath,
    Ruler,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Listing } from '@/payload-types'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ListingPreviewDialogProps {
    listing: Listing
    open: boolean
    onOpenChange: (open: boolean) => void
    readOnly?: boolean
}

export function ListingPreviewDialog({
    listing,
    open,
    onOpenChange,
    readOnly = false,
}: ListingPreviewDialogProps) {
    const router = useRouter()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // Normalize images
    const images =
        listing.images && Array.isArray(listing.images)
            ? listing.images
                .map((img) => {
                    if (typeof img === 'object' && img?.url) {
                        return {
                            url: img.url.startsWith('/api/media/file/')
                                ? img.url.replace('/api/media/file/', '/media/')
                                : img.url,
                            alt: img.alt || listing.title,
                        }
                    }
                    return null
                })
                .filter(Boolean) as { url: string; alt: string }[]
            : []

    const hasImages = images.length > 0
    const currentImage = hasImages ? images[currentImageIndex] : null

    const nextImage = () => {
        if (!hasImages) return
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        if (!hasImages) return
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            try {
                const res = await fetch(`/api/listings/${listing.id}`, {
                    method: 'DELETE',
                })
                if (res.ok) {
                    onOpenChange(false)
                    router.refresh()
                } else {
                    alert('Failed to delete listing')
                }
            } catch (error) {
                console.error('Failed to delete listing:', error)
                alert('Error deleting listing')
            }
        }
    }

    const handleSubmit = async () => {
        if (confirm('Are you sure you want to submit this listing for review? You wont be able to edit it while it is under review.')) {
            try {
                const res = await fetch(`/api/listings/${listing.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'submitted',
                    }),
                })

                if (res.ok) {
                    onOpenChange(false)
                    router.refresh()
                    alert('Listing submitted for review!')
                } else {
                    const data = await res.json()
                    alert(data.message || 'Failed to submit listing')
                }
            } catch (error) {
                console.error('Failed to submit listing:', error)
                alert('Error submitting listing')
            }
        }
    }

    // Helper for status badge
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-500'
            case 'submitted': return 'bg-blue-500'
            case 'needs_revision': return 'bg-orange-500'
            case 'rejected': return 'bg-red-500'
            case 'draft':
            default: return 'bg-slate-500'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0 sm:rounded-xl">
                <DialogTitle className="sr-only">
                    {listing.title}
                </DialogTitle>
                <div className="flex flex-col md:flex-row h-[90vh] md:h-[600px]">
                    {/* LEFT: Image Carousel */}
                    <div className="relative w-full md:w-1/2 bg-black/5 h-64 md:h-full">
                        {currentImage ? (
                            <Image
                                src={currentImage.url}
                                alt={currentImage.alt}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No Image Available
                            </div>
                        )}

                        {/* Status Badge Overlay */}
                        <div className="absolute top-4 left-4">
                            <Badge className={cn("text-white px-3 py-1 font-semibold hover:bg-opacity-90", getStatusColor(listing.status))}>
                                {listing.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                        </div>

                        {/* Image Controls */}
                        {hasImages && images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                {/* Counter Badge */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                    {currentImageIndex + 1} of {images.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT: Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-y-auto bg-white dark:bg-zinc-950">
                        {/* Header Info */}
                        <div className="space-y-4 mb-6">
                            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                {typeof listing.propertyCategory === 'object' ? listing.propertyCategory?.name : 'Property'}
                                {typeof listing.propertyType === 'object' ? ` • ${listing.propertyType?.name}` : ''}
                            </div>

                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                {listing.title}
                            </h2>

                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ₱{listing.price?.toLocaleString() || '—'}
                            </div>

                            <div className="flex items-center text-muted-foreground gap-2 text-sm">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span className="line-clamp-1">
                                    {listing.fullAddress ||
                                        `${listing.cityName || (typeof listing.city === 'object' ? (listing.city as any)?.name : null) || 'Location N/A'}, ${listing.barangayName || (typeof listing.barangay === 'object' ? (listing.barangay as any)?.name : '')}`}
                                </span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                <BedDouble className="h-5 w-5 mb-1 text-gray-700 dark:text-gray-300" />
                                <span className="font-bold text-sm">{listing.bedrooms || '-'}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Beds</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                <Bath className="h-5 w-5 mb-1 text-gray-700 dark:text-gray-300" />
                                <span className="font-bold text-sm">{listing.bathrooms || '-'}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Baths</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                                <Ruler className="h-5 w-5 mb-1 text-gray-700 dark:text-gray-300" />
                                <span className="font-bold text-sm">{listing.floorAreaSqm || '-'}</span>
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">sqm</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8 flex-1">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Property Description</h3>
                            <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed overflow-y-auto max-h-[150px] pr-2 scrollbar-thin">
                                {/* Render description safely - if it's Lexical JSON, we might need a renderer, but for now simple text handling */}
                                {/* Assuming description might be complex object (Lexical) or string. Just putting a fallback msg if object */}
                                {typeof listing.description === 'string' ? listing.description : 'Description available in details view.'}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        {/* Actions Footer - Only show if not readOnly */}
                        {!readOnly && (
                            <div className="mt-auto flex flex-col gap-3 pt-4 border-t">
                                {listing.status === 'draft' && (
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Submit for Review
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => router.push(`/listings/${listing.id}/edit`)}
                                        // Disable edit if listing is not in draft or needs_revision (already handled by page but good for UI)
                                        disabled={listing.status !== 'draft' && listing.status !== 'needs_revision'}
                                        className="bg-zinc-900 hover:bg-zinc-800 text-white"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Listing
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleDelete}
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Listing
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
