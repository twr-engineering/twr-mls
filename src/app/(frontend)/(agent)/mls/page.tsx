import { searchListings, getCities } from '@/lib/payload/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingTypeBadge } from '@/components/listing-type-badge'
import { SearchFilters } from '@/components/search-filters'
import Link from 'next/link'
import { Eye, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  listingType?: string
  transactionType?: string
  cityId?: string
  barangayId?: string
  developmentId?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  bathrooms?: string
  page?: string
}>

export default async function MLSSearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const filters = {
    listingType: (params.listingType as 'resale' | 'preselling' | 'both') || 'both',
    transactionType: params.transactionType as 'sale' | 'rent' | undefined,
    cityId: params.cityId ? parseInt(params.cityId) : undefined,
    barangayId: params.barangayId ? parseInt(params.barangayId) : undefined,
    developmentId: params.developmentId ? parseInt(params.developmentId) : undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    bedrooms: params.bedrooms ? parseInt(params.bedrooms) : undefined,
    bathrooms: params.bathrooms ? parseInt(params.bathrooms) : undefined,
    page: params.page ? parseInt(params.page) : 1,
  }

  const listings = await searchListings(filters)
  const cities = await getCities()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MLS Search</h1>
        <p className="text-muted-foreground">
          Browse all published listings across the network
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <SearchFilters cities={cities} currentFilters={filters} />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {listings.totalDocs} listing{listings.totalDocs !== 1 ? 's' : ''}
            </p>
            {listings.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {listings.page} of {listings.totalPages}
                </span>
              </div>
            )}
          </div>

          {listings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No listings found matching your search criteria
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {listings.docs.map((listing) => {
                const cityName = typeof listing.city === 'object' ? listing.city.name : 'N/A'
                const barangayName =
                  typeof listing.barangay === 'object' ? listing.barangay.name : 'N/A'
                const developmentName =
                  listing.development && typeof listing.development === 'object'
                    ? listing.development.name
                    : null

                return (
                  <Card key={listing.id}>
                    <CardHeader>
                      <div className="space-y-2">
                        <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <ListingTypeBadge listingType={listing.listingType} className="text-xs" />
                          <Badge variant="outline" className="text-xs capitalize">
                            {listing.transactionType}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Price</span>
                          <p className="text-xl font-bold">₱{listing.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Location</span>
                          <p className="text-sm font-medium">
                            {developmentName && `${developmentName}, `}
                            {barangayName}, {cityName}
                          </p>
                        </div>
                        {(listing.bedrooms || listing.bathrooms || listing.floorAreaSqm) && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2">
                            {listing.bedrooms && <span>{listing.bedrooms} BR</span>}
                            {listing.bathrooms && <span>{listing.bathrooms} BA</span>}
                            {listing.floorAreaSqm && <span>{listing.floorAreaSqm} sqm</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/mls/${listing.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        <Button asChild variant="default" size="sm" className="flex-1">
                          <Link href={`/shared-links/new?listingId=${listing.id}`}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {listings.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {listings.hasPrevPage && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/mls?${new URLSearchParams({
                      ...params,
                      page: (filters.page - 1).toString(),
                    }).toString()}`}
                  >
                    Previous
                  </Link>
                </Button>
              )}
              {listings.hasNextPage && (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/mls?${new URLSearchParams({
                      ...params,
                      page: (filters.page + 1).toString(),
                    }).toString()}`}
                  >
                    Next
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
