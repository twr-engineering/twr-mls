import { getUserCuratedLinks } from '@/lib/payload/api'
import { requireAuth } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CuratedLinksList } from '@/components/curated-links-list'

export const dynamic = 'force-dynamic'

export default async function SharedLinksPage() {
  await requireAuth()

  let curatedLinks: Awaited<ReturnType<typeof getUserCuratedLinks>> = { docs: [], totalDocs: 0, totalPages: 0, page: 1, hasPrevPage: false, hasNextPage: false, limit: 100, pagingCounter: 1, prevPage: null, nextPage: null }
  try {
    curatedLinks = await getUserCuratedLinks()
  } catch (error) {
    console.error('Failed to load shared links:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shared Links</h1>
          <p className="text-muted-foreground">
            Manage curated search links for your clients
          </p>
        </div>
        <Button asChild>
          <Link href="/mls">
            <Plus className="h-4 w-4 mr-2" />
            Create Curated Link
          </Link>
        </Button>
      </div>

      <CuratedLinksList initialLinks={curatedLinks.docs} />
    </div>
  )
}
