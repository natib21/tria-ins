'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { api } from '@/lib/api'
import type { Organization, Unit, BranchConfiguration, Location, BranchTerritory } from '@/lib/types'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    organizations: 0,
    units: 0,
    branches: 0,
    locations: 0,
    territories: 0,
  })
  const [locationsByType, setLocationsByType] = useState<{ name: string; count: number }[]>([])
  const [branchStatus, setBranchStatus] = useState<{ name: string; value: number }[]>([])
  const [unitsByOrg, setUnitsByOrg] = useState<{ name: string; units: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [organizations, units, branches, locations, territories] = await Promise.all([
          api.getOrganizations().catch(() => [] as Organization[]),
          api.getUnits().catch(() => [] as Unit[]),
          api.getBranchConfigurations().catch(() => [] as BranchConfiguration[]),
          api.getLocations().catch(() => [] as Location[]),
          api.getBranchTerritories().catch(() => [] as BranchTerritory[]),
        ])

        setStats({
          organizations: organizations.length,
          units: units.length,
          branches: branches.length,
          locations: locations.length,
          territories: territories.length,
        })

        // Group locations by type
        const locByType = locations.reduce((acc, loc) => {
          acc[loc.locationType] = (acc[loc.locationType] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        setLocationsByType(
          Object.entries(locByType).map(([name, count]) => ({ name, count }))
        )

        // Branch status distribution
        const activeCount = branches.filter((b) => b.status === 'ACTIVE').length
        const inactiveCount = branches.filter((b) => b.status === 'INACTIVE').length
        setBranchStatus([
          { name: 'Active', value: activeCount },
          { name: 'Inactive', value: inactiveCount },
        ])

        // Units by organization (top 5)
        const unitsByOrgMap = units.reduce((acc, unit) => {
          const orgName = unit.organization?.name || 'Unknown'
          acc[orgName] = (acc[orgName] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        setUnitsByOrg(
          Object.entries(unitsByOrgMap)
            .map(([name, units]) => ({ name, units }))
            .sort((a, b) => b.units - a.units)
            .slice(0, 5)
        )
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Locations by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Locations by Type</CardTitle>
            <CardDescription>Distribution of locations across different types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              {locationsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationsByType} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No location data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Branch Status */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Status</CardTitle>
            <CardDescription>Active vs inactive branch configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75">
              {branchStatus.some((s) => s.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={branchStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {branchStatus.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No branch data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Units by Organization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Units by Organization</CardTitle>
            <CardDescription>Top 5 organizations by number of units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-75]">
              {unitsByOrg.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitsByOrg}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="units" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No unit data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
