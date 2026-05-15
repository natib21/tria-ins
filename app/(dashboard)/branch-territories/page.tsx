'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/data-table/data-table'
import { api } from '@/lib/api'
import type { BranchTerritory, Unit, Location, LocationType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const territorySchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  locationId: z.string().min(1, 'Location is required'),
  locationType: z.enum(['CITY', 'SUBCITY', 'WOREDA', 'KEBELE']),
})

type FormData = z.infer<typeof territorySchema>

export default function BranchTerritoriesPage() {
  const [data, setData] = useState<BranchTerritory[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<BranchTerritory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [filterUnit, setFilterUnit] = useState('all')
  const [filterLocationType, setFilterLocationType] = useState('all')

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(territorySchema),
  })

  const selectedUnitId = watch('unitId')
  const selectedLocationId = watch('locationId')
  const selectedLocationType = watch('locationType')

  const fetchData = async () => {
    try {
      const [territories, unitsData, locationsData] = await Promise.all([
        api.getBranchTerritories(),
        api.getUnits(),
        api.getLocations(),
      ])
      setData(territories)
      setUnits(unitsData)
      setLocations(locationsData)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Check for KEBELE duplicate assignment
  useEffect(() => {
    if (selectedLocationId && selectedLocationType === 'KEBELE') {
      const existing = data.find(
        (t) =>
          t.locationId === selectedLocationId &&
          t.locationType === 'KEBELE' &&
          t.id !== editItem?.id
      )
      if (existing) {
        const unit = units.find((u) => u.id === existing.unitId)
        setDuplicateWarning(
          `This KEBELE is already assigned to unit "${unit?.name || 'Unknown'}"`
        )
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }, [selectedLocationId, selectedLocationType, data, units, editItem])

  // Filter locations by selected type
  const filteredLocations = locations.filter(
    (l) => !selectedLocationType || l.locationType === selectedLocationType
  )

  const filteredData = data.filter((territory) => {
    if (filterUnit !== 'all' && territory.unitId !== filterUnit) return false
    if (filterLocationType !== 'all' && territory.locationType !== filterLocationType)
      return false
    return true
  })

  const openCreate = () => {
    setEditItem(null)
    reset({ unitId: '', locationId: '', locationType: 'KEBELE' })
    setIsDialogOpen(true)
    setError(null)
    setDuplicateWarning(null)
  }

  const openEdit = (item: BranchTerritory) => {
    setEditItem(item)
    setValue('unitId', item.unitId)
    setValue('locationId', item.locationId)
    setValue('locationType', item.locationType)
    setIsDialogOpen(true)
    setError(null)
    setDuplicateWarning(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)

    // Block if KEBELE duplicate
    if (formData.locationType === 'KEBELE') {
      const existing = data.find(
        (t) =>
          t.locationId === formData.locationId &&
          t.locationType === 'KEBELE' &&
          t.id !== editItem?.id
      )
      if (existing) {
        setError('This KEBELE is already assigned to another branch. Each KEBELE can only belong to one branch.')
        return
      }
    }

    try {
      if (editItem) {
        await api.updateBranchTerritory(editItem.id, formData)
      } else {
        await api.createBranchTerritory(formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: BranchTerritory) => {
    try {
      await api.deleteBranchTerritory(item.id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getUnitName = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId)
    return unit?.name || 'Unknown'
  }

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId)
    return location?.names.en || 'Unknown'
  }

  const columns: Column<BranchTerritory>[] = [
    {
      key: 'unitId',
      header: 'Unit',
      cell: (item) => <span className="font-medium">{getUnitName(item.unitId)}</span>,
    },
    {
      key: 'locationId',
      header: 'Location',
      cell: (item) => getLocationName(item.locationId),
    },
    {
      key: 'locationType',
      header: 'Type',
      cell: (item) => (
        <Badge
          variant={item.locationType === 'KEBELE' ? 'default' : 'secondary'}
        >
          {item.locationType}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={filteredData}
        columns={columns}
        searchKey="unitId"
        searchPlaceholder="Search territories..."
        onCreate={openCreate}
        createLabel="Assign Territory"
        onEdit={openEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        filters={[
          {
            key: 'unit',
            label: 'Unit',
            options: units.map((u) => ({ value: u.id, label: u.name })),
            value: filterUnit,
            onChange: setFilterUnit,
          },
          {
            key: 'locationType',
            label: 'Location Type',
            options: [
              { value: 'CITY', label: 'City' },
              { value: 'SUBCITY', label: 'Subcity' },
              { value: 'WOREDA', label: 'Woreda' },
              { value: 'KEBELE', label: 'Kebele' },
            ],
            value: filterLocationType,
            onChange: setFilterLocationType,
          },
        ]}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Territory Assignment' : 'Assign Territory'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the territory assignment details.'
                : 'Assign a location to a branch unit.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {duplicateWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Duplicate Assignment Warning</AlertTitle>
                <AlertDescription>{duplicateWarning}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={selectedUnitId}
                onValueChange={(value) => setValue('unitId', value)}
              >
                <SelectTrigger className={errors.unitId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && (
                <p className="text-sm text-destructive">{errors.unitId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select
                value={selectedLocationType}
                onValueChange={(value) => {
                  setValue('locationType', value as LocationType)
                  setValue('locationId', '') // Reset location when type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITY">City</SelectItem>
                  <SelectItem value="SUBCITY">Subcity</SelectItem>
                  <SelectItem value="WOREDA">Woreda</SelectItem>
                  <SelectItem value="KEBELE">Kebele</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: Each KEBELE can only be assigned to one branch
              </p>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={selectedLocationId}
                onValueChange={(value) => setValue('locationId', value)}
              >
                <SelectTrigger className={errors.locationId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.names.en} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && (
                <p className="text-sm text-destructive">{errors.locationId.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !!duplicateWarning}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editItem ? (
                  'Update'
                ) : (
                  'Assign'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
