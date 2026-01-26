import { requireAuth } from '@/lib/auth/actions'
import { AgentNav } from '@/components/AgentNav'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure only agents can access this layout
  await requireAuth(['agent'])

  return (
    <div className="min-h-screen flex flex-col">
      <AgentNav />
      <main className="flex-1 container mx-auto p-4">{children}</main>
    </div>
  )
}
