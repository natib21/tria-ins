'use client'

import { useState, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Building,
  MapPin,
  Map,
  Search,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Location, LocationType } from '@/lib/types'

const LOCATION_ICONS: Record<LocationType, React.ElementType> = {
  CITY: Building2,
  SUBCITY: Building,
  WOREDA: MapPin,
  KEBELE: Map,
}

const LOCATION_COLORS: Record<LocationType, string> = {
  CITY: 'bg-chart-1/10 text-chart-1',
  SUBCITY: 'bg-chart-2/10 text-chart-2',
  WOREDA: 'bg-chart-3/10 text-chart-3',
  KEBELE: 'bg-chart-4/10 text-chart-4',
}

interface LocationTreeProps {
  locations: Location[]
  onSelect?: (location: Location) => void
  selectedId?: string
  onEdit?: (location: Location) => void
  onDelete?: (location: Location) => void
  onCreate?: (parentId: string | null) => void
}

interface TreeNodeProps {
  location: Location
  locations: Location[]
  level: number
  onSelect?: (location: Location) => void
  selectedId?: string
  onEdit?: (location: Location) => void
  onDelete?: (location: Location) => void
  onCreate?: (parentId: string | null) => void
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  searchTerm: string
}

function TreeNode({
  location,
  locations,
  level,
  onSelect,
  selectedId,
  onEdit,
  onDelete,
  onCreate,
  expandedIds,
  toggleExpand,
  searchTerm,
}: TreeNodeProps) {
  const children = useMemo(
    () => locations.filter((l) => l.parentId === location.id),
    [locations, location.id]
  )

  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(location.id)
  const isSelected = selectedId === location.id
  const Icon = LOCATION_ICONS[location.locationType]

  // Highlight matching search
  const matchesSearch =
    searchTerm &&
    (location.names.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.names.am.includes(searchTerm) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 cursor-pointer transition-colors',
          isSelected && 'bg-accent',
          matchesSearch && 'ring-1 ring-primary ring-offset-1'
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect?.(location)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleExpand(location.id)
          }}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded hover:bg-accent',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className={cn('flex h-6 w-6 items-center justify-center rounded', LOCATION_COLORS[location.locationType])}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        <span className="flex-1 truncate text-sm">{location.names.en}</span>

        <Badge variant="outline" className="text-[10px] font-normal">
          {location.locationType}
        </Badge>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCreate && location.locationType !== 'KEBELE' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onCreate(location.id)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(location)
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(location)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              location={child}
              locations={locations}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LocationTree({
  locations,
  onSelect,
  selectedId,
  onEdit,
  onDelete,
  onCreate,
}: LocationTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedIds(newSet)
  }

  const expandAll = () => {
    setExpandedIds(new Set(locations.map((l) => l.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Filter and get root locations
  const filteredLocations = useMemo(() => {
    if (filterType === 'all') return locations
    return locations.filter((l) => l.locationType === filterType)
  }, [locations, filterType])

  const rootLocations = useMemo(
    () =>
      filteredLocations.filter(
        (l) => !l.parentId || !filteredLocations.some((p) => p.id === l.parentId)
      ),
    [filteredLocations]
  )

  // Auto-expand parents of search matches
  useMemo(() => {
    if (!search) return

    const matchingIds = new Set<string>()
    locations.forEach((loc) => {
      if (
        loc.names.en.toLowerCase().includes(search.toLowerCase()) ||
        loc.names.am.includes(search) ||
        loc.code.toLowerCase().includes(search.toLowerCase())
      ) {
        // Add all ancestors
        let current = loc
        while (current) {
          matchingIds.add(current.id)
          const parent = locations.find((l) => l.id === current.parentId)
          if (!parent) break
          current = parent
        }
      }
    })

    if (matchingIds.size > 0) {
      setExpandedIds((prev) => new Set([...prev, ...matchingIds]))
    }
  }, [search, locations])

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CITY">City</SelectItem>
              <SelectItem value="SUBCITY">Subcity</SelectItem>
              <SelectItem value="WOREDA">Woreda</SelectItem>
              <SelectItem value="KEBELE">Kebele</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 ml-auto">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse
            </Button>
          </div>

          {onCreate && (
            <Button size="sm" onClick={() => onCreate(null)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Root
            </Button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {rootLocations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No locations found
          </div>
        ) : (
          rootLocations.map((location) => (
            <TreeNode
              key={location.id}
              location={location}
              locations={filterType === 'all' ? locations : filteredLocations}
              level={0}
              onSelect={onSelect}
              selectedId={selectedId}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              searchTerm={search}
            />
          ))
        )}
      </div>
    </div>
  )
}
