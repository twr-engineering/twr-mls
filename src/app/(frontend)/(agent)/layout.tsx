import { requireAuth } from '@/lib/auth/actions'
import { AgentSidebar } from '@/components/agent-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { NotificationBell } from '@/components/notification-bell'
import { SessionGuard } from '@/components/session-guard'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure only agents (and admins/approvers) can access this layout
  const user = await requireAuth(['agent', 'admin', 'approver'])

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0]

  return (
    <SidebarProvider>
      <AgentSidebar
        user={{
          name: displayName,
          email: user.email,
          avatar: (user.avatar as string) || '',
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
        <SessionGuard />
      </SidebarInset>
    </SidebarProvider>
  )
}
