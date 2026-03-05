'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, BedDouble, Bath, Ruler, Phone, Home } from 'lucide-react'
import type { Listing, User } from '@/payload-types'
import { isUser, isCity, isBarangay } from '@/lib/type-guards'
import Image from 'next/image'
import { ListingPreviewDialog } from './listing-preview-dialog'
import { getMediaUrl } from '@/lib/utils'

/**
 * Component for displaying a single listing in a grid view.
 * Handles rendering listing details, status badges, and preview dialog.
 */
export function ListingGridCard({ listing, readOnly = false, userRole = 'agent' }: { listing: Listing, readOnly?: boolean, userRole?: 'agent' | 'approver' | 'admin' }) {
    const [showPreview, setShowPreview] = useState(false)
    const [imgError, setImgError] = useState(false)

    // Safe image handling
    const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null
    const mainImage = getMediaUrl(firstImage)
    const hasValidImage = !!firstImage && !imgError && !mainImage.includes('placehold.co')

    const statusColors: Record<string, string> = {
        published: 'bg-green-500',
        submitted: 'bg-blue-500',
        draft: 'bg-slate-500',
        needs_revision: 'bg-red-500',
        rejected: 'bg-red-700',
    }

    const badgeColor = statusColors[listing.status] || 'bg-slate-500'

    return (
        <>
            <div
                className="group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer"
                onClick={() => setShowPreview(true)}
            >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    {hasValidImage ? (
                        <Image
                            src={mainImage}
                            alt={listing.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                            <Home className="h-10 w-10 text-slate-400 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">No Image</span>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute left-3 top-3">
                        <Badge className={`${badgeColor} hover:${badgeColor} text-white border-0`}>
                            {listing.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>

                    {/* Call Button (MLS Only) */}
                    {readOnly && (
                        <div className="absolute right-3 top-3">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full shadow-md hover:bg-white"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Properly check for populated User object
                                    const phone = isUser(listing.createdBy)
                                        ? listing.createdBy.phone
                                        : null
                                    if (phone) {
                                        window.location.href = `tel:${phone}`
                                    } else {
                                        alert('No contact number available for this agent.')
                                    }
                                }}
                            >
                                <Phone className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                    )}


                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-4 gap-3">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold leading-tight line-clamp-1 flex-1" title={listing.title}>
                            {listing.title}
                        </h3>
                        <div className="font-bold text-sm whitespace-nowrap">
                            ₱{listing.price?.toLocaleString()}
                            {listing.rentPrice && (
                                <div className="text-xs font-semibold text-muted-foreground">
                                    ₱{listing.rentPrice.toLocaleString()}/mo
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                            {listing.cityName || (isCity(listing.city) ? listing.city.name : null) || 'City N/A'}
                            {listing.barangayName ? `, ${listing.barangayName}` : (isBarangay(listing.barangay) ? `, ${listing.barangay.name}` : '')}
                        </span>
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground border-t">
                        <div className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" />
                            <span>{listing.bedrooms || '-'} Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            <span>{listing.bathrooms || '-'} Baths</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            <span>{listing.floorAreaSqm || '-'} sqm</span>
                        </div>
                    </div>
                </div>
            </div>

            <ListingPreviewDialog
                listing={listing}
                open={showPreview}
                onOpenChange={setShowPreview}
                readOnly={readOnly}
                userRole={userRole}
            />
        </>
    )
}
