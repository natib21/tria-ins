'use client'

import {
  Building2,
  Building,
  Users,
  MapPin,
  Map,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  'flex items-center gap-0.5',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  stats: {
    organizations: number
    units: number
    branches: number
    locations: number
    territories: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCardProps[] = [
    {
      title: 'Total Organizations',
      value: stats.organizations,
      icon: Building,
      description: 'Active organizations',
    },
    {
      title: 'Total Units',
      value: stats.units,
      icon: Users,
      description: 'Registered units',
    },
    {
      title: 'Branch Configurations',
      value: stats.branches,
      icon: Building2,
      description: 'Configured branches',
    },
    {
      title: 'Locations',
      value: stats.locations,
      icon: MapPin,
      description: 'Geographic locations',
    },
    {
      title: 'Territories',
      value: stats.territories,
      icon: Map,
      description: 'Assigned territories',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  )
}
