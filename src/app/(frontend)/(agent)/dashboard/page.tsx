import { getUser } from '@/lib/auth/actions'
import { getUserListingStats, getUserListings } from '@/lib/payload/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, PlusCircle, Search, AlertCircle } from 'lucide-react'
import { ListingTypeBadge } from '@/components/listing-type-badge'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getUser()
  const stats = await getUserListingStats()
  const recentListings = await getUserListings({ limit: 5 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All your listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">Unsubmitted listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">Live on MLS</p>
          </CardContent>
        </Card>
      </div>

      {stats.needsRevision > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Needs Revision
            </CardTitle>
            <CardDescription className="text-yellow-700">
              You have {stats.needsRevision} listing{stats.needsRevision > 1 ? 's' : ''} requiring revisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-yellow-300">
              <Link href="/listings?status=needs_revision">View Listings</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/listings/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Resale Listing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/listings">
                <FileText className="mr-2 h-4 w-4" />
                View My Listings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/mls">
                <Search className="mr-2 h-4 w-4" />
                Search MLS
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Listings</CardTitle>
            <CardDescription>Your latest listing activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentListings.docs.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No listings yet. Create your first listing!
              </div>
            ) : (
              <div className="space-y-3">
                {recentListings.docs.map((listing) => (
                  <div key={listing.id} className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{listing.title}</p>
                      <div className="flex items-center gap-2">
                        <ListingTypeBadge listingType={listing.listingType} className="text-xs" />
                        <Badge variant="outline" className="text-xs">
                          {listing.status}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/listings/${listing.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
