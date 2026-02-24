/* eslint-disable @typescript-eslint/no-explicit-any */
import { getListingById } from '@/lib/payload/api'
import { requireAuth } from '@/lib/auth/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ListingTypeBadge } from '@/components/listing-type-badge'
import { ShareLinkForm } from '@/components/share-link-form'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ listingId?: string }>

export default async function NewShareLinkPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAuth()

  const params = await searchParams
  const listingId = params.listingId

  if (!listingId) {
    redirect('/mls')
  }

  let listing: Awaited<ReturnType<typeof getListingById>> = null
  try {
    listing = await getListingById(listingId)
  } catch (error) {
    console.error('Failed to load listing:', error)
  }

  if (!listing || listing.status !== 'published') {
    notFound()
  }

  const cityName = typeof listing.city === 'object' ? (listing.city as any).name : 'N/A'
  const barangayName =
    typeof listing.barangay === 'object' ? (listing.barangay as any).name : 'N/A'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Share Link</h1>
        <p className="text-muted-foreground">
          Create a shareable link for your client to view this listing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
          <div className="flex items-center gap-2">
            <ListingTypeBadge listingType={listing.listingType} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {listing.price && (
            <div>
              <span className="text-sm text-muted-foreground">Price</span>
              <p className="text-xl font-bold">₱{listing.price.toLocaleString()}</p>
            </div>
          )}
          <div>
            <span className="text-sm text-muted-foreground">Location</span>
            <p className="text-sm font-medium">
              {barangayName}, {cityName}
            </p>
          </div>
        </CardContent>
      </Card>

      <ShareLinkForm listingId={listingId} />
    </div>
  )
}
