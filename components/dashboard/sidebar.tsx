'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Building,
  Users,
  MapPin,
  Map,
  LayoutGrid,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  GitBranch,
  Layers,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutGrid },
    ],
  },
  {
    title: 'Organization',
    items: [
      { title: 'Organization Types', href: '/organization-types', icon: Building2 },
      { title: 'Organizations', href: '/organizations', icon: Building },
      { title: 'Units', href: '/units', icon: Users },
      { title: 'Branch Config', href: '/branch-configurations', icon: Settings },
    ],
  },
  {
    title: 'Location',
    items: [
      { title: 'Locations', href: '/locations', icon: MapPin },
      { title: 'Location Types', href: '/location-types', icon: Layers },
      { title: 'Territories', href: '/branch-territories', icon: Map },
    ],
  },
]

function SidebarNav() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <GitBranch className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">GPMS Admin</span>
              <span className="text-xs text-sidebar-foreground/60">Enterprise</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={logout} className="w-full">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {state === 'expanded' && user && (
          <div className="px-2 py-2 text-xs text-sidebar-foreground/60">
            Signed in as {user.email}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
