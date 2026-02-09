import { getUserCuratedLinks } from '@/lib/payload/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { CuratedLinksList } from '@/components/curated-links-list'

export const dynamic = 'force-dynamic'

export default async function SharedLinksPage() {
  const curatedLinks = await getUserCuratedLinks()

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
