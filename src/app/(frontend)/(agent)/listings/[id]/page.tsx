import { getListingById } from '@/lib/payload/api'
import { requireAuth } from '@/lib/auth/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingTypeBadge } from '@/components/listing-type-badge'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { ListingDocumentsWrapper } from '@/components/listing-documents-wrapper'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Edit, ArrowLeft, MapPin, BedDouble, Bath, Ruler, Car, Calendar, Home } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils'
import { ListingImageGallery } from '@/components/listing-image-gallery'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ViewListingPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()

  let listing;
  try {
    listing = await getListingById(id)
  } catch (error) {
    console.error('Failed to get listing:', error)
  }

  if (!listing) {
    notFound()
  }

  const createdById = typeof listing.createdBy === 'object' && listing.createdBy !== null
    ? listing.createdBy.id
    : listing.createdBy
  const isOwner = !!(user && createdById === user.id)
  const canEdit = isOwner && (listing.status === 'draft' || listing.status === 'needs_revision')
  const userRole = user?.role || 'agent'

  const cityName = listing.cityName || 'N/A'
  const barangayName = listing.barangayName || 'N/A'

  const categoryName =
    listing.propertyCategory && typeof listing.propertyCategory === 'object'
      ? listing.propertyCategory.name
      : null
  const typeName =
    listing.propertyType && typeof listing.propertyType === 'object'
      ? listing.propertyType.name
      : null
  const subtypeName =
    listing.propertySubtype && typeof listing.propertySubtype === 'object'
      ? (listing.propertySubtype as any).name
      : null
  const developmentName =
    listing.development && typeof listing.development === 'object'
      ? listing.development.name
      : null

  // Normalize images
  const images =
    listing.images && Array.isArray(listing.images)
      ? listing.images
        .map((img) => {
          const url = getMediaUrl(img)
          if (url && !url.includes('placehold.co')) {
            return {
              url,
              alt: (typeof img === 'object' && img?.alt) || listing.title,
            }
          }
          return null
        })
        .filter(Boolean) as { url: string; alt: string }[]
      : []

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'needs_revision':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <ListingTypeBadge listingType={listing.listingType} />
            <Badge variant="outline" className={getStatusBadgeClass(listing.status)}>
              {listing.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {categoryName && (
              <Badge variant="secondary" className="text-xs">{categoryName}</Badge>
            )}
            {typeName && (
              <Badge variant="secondary" className="text-xs">{typeName}</Badge>
            )}
            {subtypeName && (
              <Badge variant="secondary" className="text-xs">{subtypeName}</Badge>
            )}
          </div>
        </div>
        {canEdit ? (
          <Button asChild>
            <Link href={`/listings/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        ) : (
          <Button disabled title="Only draft and needs revision listings can be edited">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Images Gallery */}
      <ListingImageGallery images={images} />

      {/* Price + Key Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {listing.price && (
              <div>
                <span className="text-sm text-muted-foreground">Price</span>
                <p className="text-3xl font-bold text-gray-900">₱{listing.price.toLocaleString()}</p>
              </div>
            )}
            {listing.pricePerSqm && (
              <div>
                <span className="text-sm text-muted-foreground">Price per sqm</span>
                <p className="font-semibold text-gray-900">₱{listing.pricePerSqm.toLocaleString()}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Transaction Type</span>
              <p className="font-medium capitalize">
                {Array.isArray(listing.transactionType)
                  ? listing.transactionType.join(', ')
                  : listing.transactionType}
              </p>
            </div>
            {listing.paymentTerms && listing.paymentTerms.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Payment Terms</span>
                <p className="font-medium capitalize">{listing.paymentTerms.join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {listing.bedrooms != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <BedDouble className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold">{listing.bedrooms}</p>
                  </div>
                </div>
              )}
              {listing.bathrooms != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <Bath className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold">{listing.bathrooms}</p>
                  </div>
                </div>
              )}
              {listing.floorAreaSqm != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <Ruler className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Floor Area</p>
                    <p className="font-semibold">{listing.floorAreaSqm} sqm</p>
                  </div>
                </div>
              )}
              {listing.lotAreaSqm != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <Home className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Area</p>
                    <p className="font-semibold">{listing.lotAreaSqm} sqm</p>
                  </div>
                </div>
              )}
              {listing.parkingSlots != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <Car className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parking</p>
                    <p className="font-semibold">{listing.parkingSlots}</p>
                  </div>
                </div>
              )}
              {listing.constructionYear != null && (
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-muted p-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Built</p>
                    <p className="font-semibold">{listing.constructionYear}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Full Address</span>
            <p className="font-medium">{listing.fullAddress}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            <div>
              <span className="text-sm text-muted-foreground">City</span>
              <p className="font-medium">{cityName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Barangay</span>
              <p className="font-medium">{barangayName}</p>
            </div>
            {developmentName && (
              <div>
                <span className="text-sm text-muted-foreground">Development</span>
                <p className="font-medium">{developmentName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Description</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <RichTextRenderer value={listing.description} />
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      {(listing.furnishing || listing.tenure || listing.titleStatus) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {listing.furnishing && (
                <div>
                  <span className="text-sm text-muted-foreground">Furnishing</span>
                  <p className="font-medium capitalize">{listing.furnishing.replace('_', ' ')}</p>
                </div>
              )}
              {listing.tenure && (
                <div>
                  <span className="text-sm text-muted-foreground">Tenure</span>
                  <p className="font-medium capitalize">{listing.tenure}</p>
                </div>
              )}
              {listing.titleStatus && (
                <div>
                  <span className="text-sm text-muted-foreground">Title Status</span>
                  <p className="font-medium capitalize">{listing.titleStatus}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <ListingDocumentsWrapper
        listingId={id}
        isOwner={isOwner}
        userRole={userRole as 'agent' | 'approver' | 'admin'}
      />
    </div>
  )
}
