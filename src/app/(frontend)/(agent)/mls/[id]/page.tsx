import { getListingById } from '@/lib/payload/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingTypeBadge } from '@/components/listing-type-badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function MLSListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const listing = await getListingById(id)

  if (!listing || listing.status !== 'published') {
    notFound()
  }

  const cityName = typeof listing.city === 'object' ? listing.city.name : 'N/A'
  const barangayName = typeof listing.barangay === 'object' ? listing.barangay.name : 'N/A'
  const developmentName =
    listing.development && typeof listing.development === 'object'
      ? listing.development.name
      : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/mls">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <ListingTypeBadge listingType={listing.listingType} />
            <Badge variant="outline" className="capitalize">{listing.transactionType}</Badge>
          </div>
        </div>
        <Button asChild>
          <Link href={`/shared-links/new?listingId=${id}`}>
            <Share2 className="h-4 w-4 mr-2" />
            Generate Share Link
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Price</span>
              <p className="text-2xl font-bold">₱{listing.price.toLocaleString()}</p>
            </div>
            {listing.pricePerSqm && (
              <div>
                <span className="text-sm text-muted-foreground">Price per sqm</span>
                <p className="font-medium">₱{listing.pricePerSqm.toLocaleString()}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-muted-foreground">Transaction Type</span>
              <p className="font-medium capitalize">{listing.transactionType}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {listing.floorAreaSqm && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Floor Area</span>
                <span className="font-medium">{listing.floorAreaSqm} sqm</span>
              </div>
            )}
            {listing.lotAreaSqm && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lot Area</span>
                <span className="font-medium">{listing.lotAreaSqm} sqm</span>
              </div>
            )}
            {listing.bedrooms && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bedrooms</span>
                <span className="font-medium">{listing.bedrooms}</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Bathrooms</span>
                <span className="font-medium">{listing.bathrooms}</span>
              </div>
            )}
            {listing.parkingSlots && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parking</span>
                <span className="font-medium">{listing.parkingSlots}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Full Address</span>
            <p className="font-medium">{listing.fullAddress}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-sm text-muted-foreground">City</span>
              <p className="font-medium">{cityName}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Barangay</span>
              <p className="font-medium">{barangayName}</p>
            </div>
            {developmentName && (
              <div className="col-span-2">
                <span className="text-sm text-muted-foreground">Development</span>
                <p className="font-medium">{developmentName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {listing.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {/* Render rich text description if needed */}
              <p>{JSON.stringify(listing.description)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {listing.furnishing && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Furnishing</span>
              <span className="font-medium capitalize">{listing.furnishing.replace('_', ' ')}</span>
            </div>
          )}
          {listing.constructionYear && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Construction Year</span>
              <span className="font-medium">{listing.constructionYear}</span>
            </div>
          )}
          {listing.tenure && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tenure</span>
              <span className="font-medium capitalize">{listing.tenure}</span>
            </div>
          )}
          {listing.titleStatus && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Title Status</span>
              <span className="font-medium capitalize">{listing.titleStatus}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
