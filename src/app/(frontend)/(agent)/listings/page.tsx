import { getUserListings, getUserListingStats } from '@/lib/payload/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { ListingSearch } from '@/components/listing-search'
import { Badge } from '@/components/ui/badge'
import { ListingGridCard } from '@/components/listing-grid-card'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ status?: string; q?: string }>

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const searchQuery = params.q || ''

  // Parallel fetch: Stats + Filtered Listings
  const [stats, listingsData] = await Promise.all([
    getUserListingStats(),
    getUserListings({
      status: statusFilter,
      search: searchQuery,
      limit: 50,
    }),
  ])

  const listings = listingsData.docs

  // Helper for status colors


  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground">
            Manage and monitor the status of your property entries.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ListingSearch />
          {/* Avatar is handled in layout, but screenshot shows it here? We will trust layout for now or add if needed. */}
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="flex flex-wrap gap-4">
        <FilterCard
          label="ALL"
          count={stats.total}
          active={statusFilter === 'all'}
          href="/listings"
        />
        <FilterCard
          label="DRAFT"
          count={stats.draft}
          active={statusFilter === 'draft'}
          href="/listings?status=draft"
        />
        <FilterCard
          label="SUBMITTED"
          count={stats.submitted}
          active={statusFilter === 'submitted'}
          href="/listings?status=submitted"
        />
        <FilterCard
          label="NEEDS REVISION"
          count={stats.needsRevision}
          active={statusFilter === 'needs_revision'}
          href="/listings?status=needs_revision"
        />
        <FilterCard
          label="PUBLISHED"
          count={stats.published}
          active={statusFilter === 'published'}
          href="/listings?status=published"
        />
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No listings found matching your criteria.</p>
              {statusFilter === 'all' && !searchQuery && (
                <Button asChild>
                  <Link href="/listings/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Listing
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingGridCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Floating Create Button (if specific design needed, or rely on Header action? Screenshot shows button at bottom left of SIDEBAR likely).
           But we can add one here if needed. Layout has sidebar button? No.
       */}
    </div>
  )
}

function FilterCard({
  label,
  count,
  active,
  href,
}: {
  label: string
  count: number
  active: boolean
  href: string
}) {
  return (
    <Link href={href} className="flex-1 min-w-[140px]">
      <Card
        className={`h-full transition-colors hover:bg-muted/50 ${active ? 'border-primary ring-1 ring-primary' : ''
          }`}
      >
        <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold tracking-wider ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
            <Badge variant={active ? 'default' : 'secondary'} className="text-xs">
              {count}
            </Badge>
          </div>
          {/* Optional: Add subtitle text like "Not published" based on label if needed matching screenshot */}
        </CardContent>
      </Card>
    </Link>
  )
}

// Inline ListingGridCard removed. Using imported component.

