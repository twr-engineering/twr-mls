'use client'

import * as React from 'react'
import {
  LayoutDashboardIcon,
  FileTextIcon,
  SearchIcon,
  PlusCircleIcon,
  ShareIcon,
  UserIcon,
  HomeIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: {
    title: string
    url: string
  }[]
}

type AgentSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AgentSidebar({ user, ...props }: AgentSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: HomeIcon,
    },
    {
      title: 'My Listings',
      url: '/listings',
      icon: FileTextIcon,
    },
    {
      title: 'MLS Search',
      url: '/mls',
      icon: SearchIcon,
    },

    {
      title: 'Shared Links',
      url: '/shared-links',
      icon: ShareIcon,
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: UserIcon,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <LayoutDashboardIcon className="h-5 w-5" />
                <span className="text-base font-semibold">TWR MLS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                const Icon = item.icon

                if (item.items && item.items.length > 0) {
                  return (
                    <Collapsible key={item.title} asChild defaultOpen={isActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => {
                              const isSubActive = pathname === subItem.url
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                  >
                                    <Link href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                      <Link href={item.url}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
