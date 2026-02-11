'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Listing } from '@/payload-types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Eye, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMediaUrl } from '@/lib/utils'

type AgentListingsGridProps = {
  listings: Listing[]
  showEdit?: boolean
}

export function AgentListingsGrid({ listings, showEdit = true }: AgentListingsGridProps) {
  const [selected, setSelected] = useState<Listing | null>(null)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => {
          // Derive primary image URL from images relationship (if any)
          let primaryImageUrl: string | null = null
          const primaryImageAlt: string | undefined = (listing.images && listing.images.length > 0 && typeof listing.images[0] === 'object' && 'alt' in listing.images[0]) ? listing.images[0].alt || undefined : undefined

          if (Array.isArray(listing.images) && listing.images.length > 0) {
            const first = listing.images[0]
            const url = getMediaUrl(first)
            if (url && !url.includes('placehold.co')) {
              primaryImageUrl = url
            }
          }

          const fallbackAlt = listing.title || 'Listing image'

          return (
            <Card key={listing.id} className="flex flex-col justify-between overflow-hidden">
              {/* Image preview */}
              {primaryImageUrl ? (
                <div className="aspect-video w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImageUrl}
                    alt={primaryImageAlt || fallbackAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-muted text-[11px] text-muted-foreground">
                  No image available
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
                    {listing.title || 'Untitled Listing'}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {listing.status || 'draft'}
                  </Badge>
                </div>
                <CardDescription className="mt-2 text-xs flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {listing.listingType || 'resale'}
                  </Badge>
                  {Array.isArray(listing.transactionType) && listing.transactionType.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {listing.transactionType.join(', ')}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {listing.city && (
                  <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {listing.cityName || 'City N/A'}
                      {listing.barangayName && `, ${listing.barangayName}`}
                    </span>
                  </p>
                )}

                {listing.price && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold">
                      ₱{new Intl.NumberFormat('en-PH', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(Number(listing.price))}
                    </span>
                  </div>
                )}

                {listing.createdAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Created:{' '}
                      {new Date(listing.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(listing)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  {showEdit && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Details Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title || 'Listing Details'}</DialogTitle>
                <DialogDescription>
                  Full details for this listing. For advanced changes, use the admin panel.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm text-foreground">
                {/* Status & Type */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    {selected.status || 'draft'}
                  </Badge>
                  <Badge variant="secondary">{selected.listingType || 'resale'}</Badge>
                  {Array.isArray(selected.transactionType) &&
                    selected.transactionType.length > 0 && (
                      <Badge variant="outline">{selected.transactionType.join(', ')}</Badge>
                    )}
                </div>

                {/* Location */}
                {(selected.city || selected.barangay || selected.fullAddress) && (
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <div className="space-y-1 text-xs text-foreground">
                      {selected.fullAddress && (
                        <p>
                          <strong>Address:</strong> {selected.fullAddress}
                        </p>
                      )}
                      {selected.city && (
                        <p>
                          <strong>City:</strong>{' '}
                          {selected.cityName || 'N/A'}
                        </p>
                      )}
                      {selected.barangay && (
                        <p>
                          <strong>Barangay:</strong>{' '}
                          {selected.barangayName || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Property Details */}
                {(selected.bedrooms ||
                  selected.bathrooms ||
                  selected.floorAreaSqm ||
                  selected.lotAreaSqm) && (
                    <div>
                      <h3 className="font-semibold mb-1">Property Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
                        {selected.bedrooms && (
                          <p>
                            <strong>Bedrooms:</strong> {selected.bedrooms}
                          </p>
                        )}
                        {selected.bathrooms && (
                          <p>
                            <strong>Bathrooms:</strong> {selected.bathrooms}
                          </p>
                        )}
                        {selected.floorAreaSqm && (
                          <p>
                            <strong>Floor Area:</strong> {selected.floorAreaSqm} sqm
                          </p>
                        )}
                        {selected.lotAreaSqm && (
                          <p>
                            <strong>Lot Area:</strong> {selected.lotAreaSqm} sqm
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Pricing */}
                {(selected.price || selected.titleStatus || selected.paymentTerms) && (
                  <div>
                    <h3 className="font-semibold mb-1">Pricing &amp; Terms</h3>
                    <div className="space-y-1 text-xs text-foreground">
                      {selected.price && (
                        <p>
                          <strong>Price:</strong>{' '}
                          ₱{new Intl.NumberFormat('en-PH', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(Number(selected.price))}
                        </p>
                      )}
                      {selected.titleStatus && (
                        <p>
                          <strong>Title Status:</strong> {selected.titleStatus}
                        </p>
                      )}
                      {Array.isArray(selected.paymentTerms) &&
                        selected.paymentTerms.length > 0 && (
                          <p>
                            <strong>Payment Terms:</strong> {selected.paymentTerms.join(', ')}
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-[11px] text-muted-foreground space-y-1">
                  {selected.createdAt && (
                    <p>
                      Created:{' '}
                      {new Date(selected.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  {selected.updatedAt && (
                    <p>
                      Updated:{' '}
                      {new Date(selected.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </Button>
                  {showEdit && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/listings/${selected.id}/edit`}>
                        <FileText className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

