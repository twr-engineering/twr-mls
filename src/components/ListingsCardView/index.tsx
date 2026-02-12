'use client'

import React, { useState } from 'react'
import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, Edit, Trash2, MapPin, DollarSign, Calendar } from 'lucide-react'
import type { Listing } from '@/payload-types'
import { isCity, isBarangay, isTownship, isEstate } from '@/lib/type-guards'

interface ListingsCardViewProps {
  data?: {
    docs?: Listing[]
  }
}

/**
 * Component for displaying a card view of listings in the admin panel.
 * Provides quick actions for viewing, editing, and deleting listings.
 */
export const ListingsCardView = (props: ListingsCardViewProps) => {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get listings from props (Payload passes data through props)
  const listings = props?.data?.docs || []
  const isAdmin = user?.role === 'admin' || user?.role === 'approver'

  /**
   * Opens the details modal for the selected listing.
   */
  const handleViewDetails = (listing: Listing) => {
    setSelectedListing(listing)
    setIsModalOpen(true)
  }

  /**
   * Navigates to the administrative edit page for the listing.
   */
  const handleEdit = (listingId: number | string) => {
    router.push(`/admin/collections/listings/${listingId}`)
  }

  /**
   * Handles soft deletion (or permanent deletion based on API behavior) of a listing.
   */
  const handleSoftDelete = async (listingId: number | string) => {
    if (!confirm('Are you sure you want to delete this listing? This action can be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete listing')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('An error occurred while deleting the listing')
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Formats a numeric price into PHP currency string.
   */
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  /**
   * Formats a date string into a readable format.
   */
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Returns a Tailwind CSS class string for the listing status badge.
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      needs_revision: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (listings.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No listings found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {listings.map((listing: Listing) => (
          <Card key={listing.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {listing.title || 'Untitled Listing'}
                </CardTitle>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    listing.status || 'draft'
                  )}`}
                >
                  {listing.status || 'draft'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {listing.listingType || 'N/A'}
                </span>
                {listing.transactionType && Array.isArray(listing.transactionType) && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                    {listing.transactionType.join(', ')}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {listing.city && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {isCity(listing.city)
                      ? listing.city.name
                      : 'Location N/A'}
                    {isBarangay(listing.barangay) &&
                      `, ${listing.barangay.name}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatPrice(listing.price)}</span>
                {listing.pricePerSqm && (
                  <span className="text-muted-foreground">
                    ({formatPrice(listing.pricePerSqm)}/sqm)
                  </span>
                )}
              </div>
              {(listing.bedrooms || listing.bathrooms) && (
                <div className="text-sm text-muted-foreground">
                  {listing.bedrooms && `${listing.bedrooms} bed`}
                  {listing.bedrooms && listing.bathrooms && ' • '}
                  {listing.bathrooms && `${listing.bathrooms} bath`}
                  {listing.floorAreaSqm && ` • ${listing.floorAreaSqm} sqm`}
                </div>
              )}
              {listing.updatedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Updated: {formatDate(listing.updatedAt)}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleViewDetails(listing)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(listing.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSoftDelete(listing.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedListing.title || 'Listing Details'}</DialogTitle>
                <DialogDescription>
                  Complete listing information and specifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Status and Type */}
                <div className="flex gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      selectedListing.status || 'draft'
                    )}`}
                  >
                    {selectedListing.status || 'draft'}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                    {selectedListing.listingType || 'N/A'}
                  </span>
                  {selectedListing.transactionType &&
                    Array.isArray(selectedListing.transactionType) && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                        {selectedListing.transactionType.join(', ')}
                      </span>
                    )}
                </div>

                {/* Location */}
                {(selectedListing.city || selectedListing.barangay) && (
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <div className="space-y-1 text-sm">
                      {selectedListing.fullAddress && (
                        <p>
                          <strong>Address:</strong> {selectedListing.fullAddress}
                        </p>
                      )}
                      {selectedListing.city && (
                        <p>
                          <strong>City:</strong>{' '}
                          {isCity(selectedListing.city)
                            ? selectedListing.city.name
                            : 'N/A'}
                        </p>
                      )}
                      {selectedListing.barangay && (
                        <p>
                          <strong>Barangay:</strong>{' '}
                          {isBarangay(selectedListing.barangay)
                            ? selectedListing.barangay.name
                            : 'N/A'}
                        </p>
                      )}
                      {isTownship(selectedListing.township) && (
                        <p>
                          <strong>Township:</strong> {selectedListing.township.name}
                        </p>
                      )}
                      {isEstate(selectedListing.estate) && (
                        <p>
                          <strong>Estate:</strong> {selectedListing.estate.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div>
                  <h3 className="font-semibold mb-2">Pricing</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Price:</strong> {formatPrice(selectedListing.price)}
                    </p>
                    {selectedListing.pricePerSqm && (
                      <p>
                        <strong>Price per sqm:</strong> {formatPrice(selectedListing.pricePerSqm)}
                      </p>
                    )}
                    {selectedListing.paymentTerms &&
                      Array.isArray(selectedListing.paymentTerms) &&
                      selectedListing.paymentTerms.length > 0 && (
                        <p>
                          <strong>Payment Terms:</strong>{' '}
                          {selectedListing.paymentTerms.join(', ')}
                        </p>
                      )}
                  </div>
                </div>

                {/* Property Details */}
                {(selectedListing.bedrooms ||
                  selectedListing.bathrooms ||
                  selectedListing.floorAreaSqm ||
                  selectedListing.lotAreaSqm) && (
                    <div>
                      <h3 className="font-semibold mb-2">Property Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedListing.bedrooms && (
                          <p>
                            <strong>Bedrooms:</strong> {selectedListing.bedrooms}
                          </p>
                        )}
                        {selectedListing.bathrooms && (
                          <p>
                            <strong>Bathrooms:</strong> {selectedListing.bathrooms}
                          </p>
                        )}
                        {selectedListing.floorAreaSqm && (
                          <p>
                            <strong>Floor Area:</strong> {selectedListing.floorAreaSqm} sqm
                          </p>
                        )}
                        {selectedListing.lotAreaSqm && (
                          <p>
                            <strong>Lot Area:</strong> {selectedListing.lotAreaSqm} sqm
                          </p>
                        )}
                        {selectedListing.parkingSlots && (
                          <p>
                            <strong>Parking:</strong> {selectedListing.parkingSlots} slots
                          </p>
                        )}
                        {selectedListing.furnishing && (
                          <p>
                            <strong>Furnishing:</strong> {selectedListing.furnishing}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Description */}
                {selectedListing.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <div className="text-sm prose prose-sm max-w-none">
                      {typeof selectedListing.description === 'string' ? (
                        <p>{selectedListing.description}</p>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: JSON.stringify(selectedListing.description),
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedListing.createdAt && (
                    <p>Created: {formatDate(selectedListing.createdAt)}</p>
                  )}
                  {selectedListing.updatedAt && (
                    <p>Updated: {formatDate(selectedListing.updatedAt)}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                {isAdmin && (
                  <>
                    <Button variant="outline" onClick={() => handleEdit(selectedListing.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsModalOpen(false)
                        handleSoftDelete(selectedListing.id)
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
