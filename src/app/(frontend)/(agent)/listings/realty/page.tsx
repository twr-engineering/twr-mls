import Link from 'next/link'
import { requireAuth } from '@/lib/auth/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Listing } from '@/payload-types'
import { AgentListingsGrid } from '@/components/AgentListingsGrid'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseSearchParams, searchListings } from '@/utilities/search'

export const dynamic = 'force-dynamic'

type RealtyListingsPageProps = {
  searchParams: Promise<{
    transactionType?: string
    cityId?: string
    priceMin?: string
    priceMax?: string
    bedroomsMin?: string
    bathroomsMin?: string
    floorAreaMin?: string
    lotAreaMin?: string
  }>
}

export default async function RealtyListingsPage({ searchParams }: RealtyListingsPageProps) {
  await requireAuth(['agent'])

  const payload = await getPayload({ config })

  // Build filters using shared admin-style search utility
  const urlParams = new URLSearchParams()
  const sp = await searchParams || {}
  Object.entries(sp).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      urlParams.set(key, String(value).trim())
    }
  })

  // Always ensure we're only seeing published listings in Realty view
  urlParams.set('status', 'published')

  const filters = parseSearchParams(urlParams)
  const searchResult = await searchListings(payload, filters)
  const listings = searchResult.docs as Listing[]

  const transactionTypeFilter = sp?.transactionType || ''
  const cityFilter = sp?.cityId || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Realty Listings</h1>
          <p className="text-sm text-muted-foreground">
            All published listings across the brokerage, visible to agents for collaboration and
            matching clients.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/create">Create Resale Listing</Link>
        </Button>
      </div>

      {/* Filter bar (shareable via URL) */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs bg-black/60 text-white border-white/40 px-3 py-1"
            >
              Showing published listings only
            </Badge>
            <span className="text-xs text-muted-foreground">
              Filters are encoded in the URL – share this page to share the same filtered view.
            </span>
          </div>

          {/* Transaction type filter chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { value: '', label: 'All Types' },
              { value: 'sale', label: 'For Sale' },
              { value: 'rent', label: 'For Rent' },
            ].map((opt) => {
              const isActive = opt.value === transactionTypeFilter
              const href =
                opt.value === ''
                  ? '/listings/realty'
                  : `/listings/realty?transactionType=${encodeURIComponent(opt.value)}`
              return (
                <Link key={opt.value || 'all'} href={href}>
                  <Badge
                    variant={isActive ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs px-3 py-1 border transition-colors ${isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground hover:bg-white hover:text-foreground'
                      }`}
                  >
                    {opt.label}
                  </Badge>
                </Link>
              )
            })}
          </div>

          {/* Structured filters: city, price range, bedrooms, bathrooms, areas */}
          <form
            action="/listings/realty"
            method="get"
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 items-end"
          >
            {/* Preserve transactionType in query when using other filters */}
            {transactionTypeFilter && (
              <input type="hidden" name="transactionType" value={transactionTypeFilter} />
            )}

            <div className="space-y-1">
              <Label htmlFor="cityId">City</Label>
              <select
                id="cityId"
                name="cityId"
                defaultValue={cityFilter}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Cities</option>
                {/* Admin search utilities expect cityId as a number (ID) */}
                {/* For simplicity, you can either hydrate options here via Payload or hard-code key cities */}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="priceMin">Min Price</Label>
              <Input
                id="priceMin"
                name="priceMin"
                type="number"
                min={0}
                defaultValue={sp?.priceMin || ''}
                placeholder="e.g. 1000000"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="priceMax">Max Price</Label>
              <Input
                id="priceMax"
                name="priceMax"
                type="number"
                min={0}
                defaultValue={sp?.priceMax || ''}
                placeholder="e.g. 5000000"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bedroomsMin">Min Bedrooms</Label>
              <Input
                id="bedroomsMin"
                name="bedroomsMin"
                type="number"
                min={0}
                defaultValue={sp?.bedroomsMin || ''}
                placeholder="e.g. 2"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bathroomsMin">Min Bathrooms</Label>
              <Input
                id="bathroomsMin"
                name="bathroomsMin"
                type="number"
                min={0}
                defaultValue={sp?.bathroomsMin || ''}
                placeholder="e.g. 1"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="floorAreaMin">Min Floor Area (sqm)</Label>
              <Input
                id="floorAreaMin"
                name="floorAreaMin"
                type="number"
                min={0}
                defaultValue={sp?.floorAreaMin || ''}
                placeholder="e.g. 50"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lotAreaMin">Min Lot Area (sqm)</Label>
              <Input
                id="lotAreaMin"
                name="lotAreaMin"
                type="number"
                min={0}
                defaultValue={sp?.lotAreaMin || ''}
                placeholder="e.g. 100"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <Button type="submit" variant="default">
                Apply Filters
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/listings/realty">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>No published listings match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <AgentListingsGrid listings={listings as Listing[]} showEdit={false} />
      )}
    </div>
  )
}

