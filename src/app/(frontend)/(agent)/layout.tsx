import { requireAuth } from '@/lib/auth/actions'
import { AgentSidebar } from '@/components/agent-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { NotificationBell } from '@/components/notification-bell'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  type AvatarMedia = {
    url?: string
    filename?: string
  }

  // Ensure only agents (and admins/approvers) can access this layout
  const user = await requireAuth(['agent', 'admin', 'approver'])

  return (
    <SidebarProvider>
      <AgentSidebar
        user={{
          name: user.email.split('@')[0],
          email: user.email,
          avatar: (() => {
            const avatar = user.avatar
            if (!avatar) return '/default.png'
            if (typeof avatar === 'string') return avatar

            if (typeof avatar === 'object' && 'url' in avatar) {
              const media = avatar as AvatarMedia
              const url = media.url
              if (url && url.startsWith('http')) return url

              // Fallback for S3/Supabase - similar to ListingGridCard fix
              // Use filename if available, otherwise try to use the URL path
              const filename = media.filename
              if (filename) {
                return `https://mxjqvqqtjjvfcimfzoxs.supabase.co/storage/v1/object/public/media/${filename}`
              }

              return url || '/default.png' // fallback to relative if no filename
            }
            return '/default.png'
          })(),
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Agent Portal</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
