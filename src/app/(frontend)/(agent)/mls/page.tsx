import { searchListings, getCities } from '@/lib/payload/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SearchFilters } from '@/components/search-filters'
import Link from 'next/link'
import { ListingGridCard } from '@/components/listing-grid-card'

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
    cityId: params.cityId,
    barangayId: params.barangayId,
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

      <SearchFilters cities={cities} currentFilters={filters} />

      <div className="space-y-4">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.docs.map((listing) => (
              <ListingGridCard key={listing.id} listing={listing} readOnly={true} />
            ))}
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
  )
}
