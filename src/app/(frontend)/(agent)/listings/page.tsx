import { getUserListings } from '@/lib/payload/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListingTypeBadge } from '@/components/listing-type-badge'
import Link from 'next/link'
import { Plus, Eye, Edit } from 'lucide-react'
import { ListingActions } from '@/components/listing-actions'
import type { Listing } from '@/payload-types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ status?: string }>

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const statusFilter = params.status

  const allListings = await getUserListings()
  const draftListings = await getUserListings({ status: 'draft' })
  const submittedListings = await getUserListings({ status: 'submitted' })
  const publishedListings = await getUserListings({ status: 'published' })
  const needsRevisionListings = await getUserListings({ status: 'needs_revision' })

  const getStatusBadgeVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'published':
        return 'default'
      case 'submitted':
        return 'secondary'
      case 'needs_revision':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const canEdit = listing.status === 'draft' || listing.status === 'needs_revision'

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="truncate">{listing.title}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <ListingTypeBadge listingType={listing.listingType} className="text-xs" />
                <Badge variant={getStatusBadgeVariant(listing.status)} className="text-xs">
                  {listing.status.replace('_', ' ')}
                </Badge>
                {listing.propertyType && typeof listing.propertyType === 'object' && (
                  <Badge variant="outline" className="text-xs">
                    {listing.propertyType.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {listing.price && (
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-medium">₱{listing.price.toLocaleString()}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Transaction:</span>
                <p className="font-medium capitalize">{listing.transactionType}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium truncate">
                  {listing.township && typeof listing.township === 'object'
                    ? `${listing.township.name}, `
                    : ''}
                  {typeof listing.city === 'object' ? listing.city.name : 'N/A'},{' '}
                  {typeof listing.barangay === 'object' ? listing.barangay.name : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button asChild variant="outline" size="sm">
                <Link href={`/listings/${listing.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              {canEdit ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/listings/${listing.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Only draft and needs revision listings can be edited"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {listing.status === 'draft' && (
                <ListingActions listingId={listing.id.toString()} status={listing.status} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Listing
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={statusFilter || 'all'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({allListings.totalDocs})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftListings.totalDocs})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submittedListings.totalDocs})</TabsTrigger>
          <TabsTrigger value="needs_revision">
            Needs Revision ({needsRevisionListings.totalDocs})
          </TabsTrigger>
          <TabsTrigger value="published">Published ({publishedListings.totalDocs})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allListings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t created any listings yet
                  </p>
                  <Button asChild>
                    <Link href="/listings/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Listing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allListings.docs.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftListings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">No draft listings</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {draftListings.docs.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedListings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">No submitted listings</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {submittedListings.docs.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needs_revision" className="space-y-4">
          {needsRevisionListings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No listings needing revision
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {needsRevisionListings.docs.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedListings.docs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">No published listings</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publishedListings.docs.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
