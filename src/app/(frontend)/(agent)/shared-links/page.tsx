import { getUserShareLinks } from '@/lib/payload/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ShareLinkActions } from '@/components/share-link-actions'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function SharedLinksPage() {
  const shareLinks = await getUserShareLinks()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Links</h1>
          <p className="text-muted-foreground">
            Manage client share links for your listings
          </p>
        </div>
        <Button asChild>
          <Link href="/mls">
            <Plus className="h-4 w-4 mr-2" />
            Create Share Link
          </Link>
        </Button>
      </div>

      {shareLinks.docs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created any share links yet
              </p>
              <Button asChild>
                <Link href="/mls">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse MLS to Create Share Link
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shareLinks.docs.map((link) => {
            const listing = typeof link.listing === 'object' ? link.listing : null
            const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false
            const isActive = Boolean(link.isActive) && !isExpired

            return (
              <Card key={link.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="line-clamp-1">
                        {listing ? listing.title : 'Unknown Listing'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Link Token:</span>
                      <p className="font-mono text-xs break-all">{link.token}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Share URL:</span>
                      <p className="font-mono text-xs break-all">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/share/${link.token}`
                          : `/share/${link.token}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="text-xs">
                          {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {link.expiresAt && (
                        <div>
                          <span className="text-muted-foreground">Expires:</span>
                          <p className="text-xs">
                            {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <ShareLinkActions
                      linkId={link.id.toString()}
                      token={link.token}
                      isActive={isActive}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
