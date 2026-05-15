'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const pathTitles: Record<string, string> = {
  '': 'Dashboard',
  'organization-types': 'Organization Types',
  'organizations': 'Organizations',
  'units': 'Units',
  'branch-configurations': 'Branch Configurations',
  'locations': 'Locations',
  'location-types': 'Location Types',
  'branch-territories': 'Branch Territories',
}

export function Header() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs = [
    { title: 'Dashboard', href: '/' },
    ...segments.map((segment, index) => ({
      title: pathTitles[segment] || segment,
      href: '/' + segments.slice(0, index + 1).join('/'),
    })),
  ]

  const pageTitle = segments.length > 0
    ? pathTitles[segments[segments.length - 1]] || segments[segments.length - 1]
    : 'Dashboard'

  return (
    <div className="mb-6">
      <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          <Home className="h-4 w-4" />
        </Link>
        {segments.length > 0 && breadcrumbs.slice(1).map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            {index === breadcrumbs.length - 2 ? (
              <span className="text-foreground">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.title}
              </Link>
            )}
          </div>
        ))}
      </nav>
      <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
    </div>
  )
}
