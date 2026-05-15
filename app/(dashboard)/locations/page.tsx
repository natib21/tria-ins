'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MapPin, Navigation } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LocationTree } from '@/components/locations/location-tree'
import { api } from '@/lib/api'
import type { Location, LocationType } from '@/lib/types'

const locationSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAm: z.string().min(1, 'Amharic name is required'),
  code: z.string().min(1, 'Code is required'),
  locationType: z.enum(['CITY', 'SUBCITY', 'WOREDA', 'KEBELE']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  area: z.coerce.number().min(0),
  boundaryJson: z.string().optional(),
})

type FormData = z.infer<typeof locationSchema>

const TYPE_HIERARCHY: LocationType[] = ['CITY', 'SUBCITY', 'WOREDA', 'KEBELE']

function getNextType(parentType: LocationType | null): LocationType {
  if (!parentType) return 'CITY'
  const index = TYPE_HIERARCHY.indexOf(parentType)
  return TYPE_HIERARCHY[Math.min(index + 1, TYPE_HIERARCHY.length - 1)]
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Location | null>(null)
  const [parentId, setParentId] = useState<string | null>(null)
  const [deleteItem, setDeleteItem] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      latitude: 9.03,
      longitude: 38.74,
      area: 0,
      boundaryJson: '',
    },
  })

  const selectedType = watch('locationType')

  const fetchData = async () => {
    try {
      const result = await api.getLocations()
      setLocations(result)
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = (pId: string | null) => {
    setEditItem(null)
    setParentId(pId)
    const parent = pId ? locations.find((l) => l.id === pId) : null
    const nextType = getNextType(parent?.locationType ?? null)
    reset({
      nameEn: '',
      nameAm: '',
      code: '',
      locationType: nextType,
      latitude: parent?.latitude ?? 9.03,
      longitude: parent?.longitude ?? 38.74,
      area: 0,
      boundaryJson: '',
    })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: Location) => {
    setEditItem(item)
    setParentId(item.parentId)
    setValue('nameEn', item.names.en)
    setValue('nameAm', item.names.am)
    setValue('code', item.code)
    setValue('locationType', item.locationType)
    setValue('latitude', item.latitude)
    setValue('longitude', item.longitude)
    setValue('area', item.area)
    setValue('boundaryJson', item.boundaryJson || '')
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      const payload = {
        parentId,
        locationType: formData.locationType,
        names: { en: formData.nameEn, am: formData.nameAm },
        code: formData.code,
        latitude: formData.latitude,
        longitude: formData.longitude,
        area: formData.area,
        boundaryJson: formData.boundaryJson || '',
      }

      if (editItem) {
        await api.updateLocation(editItem.id, payload)
      } else {
        await api.createLocation(payload)
      }

      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await api.deleteLocation(deleteItem.id)
      if (selectedLocation?.id === deleteItem.id) {
        setSelectedLocation(null)
      }
      setDeleteItem(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="grid h-[calc(100vh-200px)] gap-6 lg:grid-cols-[1fr_350px]">
      {/* Tree View */}
      <Card className="overflow-hidden">
        <LocationTree
          locations={locations}
          selectedId={selectedLocation?.id}
          onSelect={setSelectedLocation}
          onEdit={openEdit}
          onDelete={setDeleteItem}
          onCreate={openCreate}
        />
      </Card>

      {/* Detail Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLocation ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name (English)</p>
                <p className="font-medium">{selectedLocation.names.en}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name (Amharic)</p>
                <p className="font-medium">{selectedLocation.names.am}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge>{selectedLocation.locationType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <Badge variant="secondary" className="font-mono">
                    {selectedLocation.code}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Navigation className="h-4 w-4" />
                  Coordinates
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude: </span>
                    <span className="font-mono">{selectedLocation.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude: </span>
                    <span className="font-mono">{selectedLocation.longitude.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Area</p>
                <p className="font-medium">{selectedLocation.area.toLocaleString()} sq km</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEdit(selectedLocation)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setDeleteItem(selectedLocation)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Select a location to view details
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Location' : 'Create Location'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the location details below.'
                : parentId
                ? `Add a new location under ${locations.find((l) => l.id === parentId)?.names.en}`
                : 'Create a new root location.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English)</Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  placeholder="e.g., Addis Ababa"
                  className={errors.nameEn ? 'border-destructive' : ''}
                />
                {errors.nameEn && (
                  <p className="text-sm text-destructive">{errors.nameEn.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAm">Name (Amharic)</Label>
                <Input
                  id="nameAm"
                  {...register('nameAm')}
                  placeholder="e.g., አዲስ አበባ"
                  className={errors.nameAm ? 'border-destructive' : ''}
                />
                {errors.nameAm && (
                  <p className="text-sm text-destructive">{errors.nameAm.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  {...register('code')}
                  placeholder="e.g., AA01"
                  className={errors.code ? 'border-destructive' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Location Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setValue('locationType', value as LocationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CITY">City</SelectItem>
                    <SelectItem value="SUBCITY">Subcity</SelectItem>
                    <SelectItem value="WOREDA">Woreda</SelectItem>
                    <SelectItem value="KEBELE">Kebele</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude')}
                  className={errors.latitude ? 'border-destructive' : ''}
                />
                {errors.latitude && (
                  <p className="text-sm text-destructive">{errors.latitude.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude')}
                  className={errors.longitude ? 'border-destructive' : ''}
                />
                {errors.longitude && (
                  <p className="text-sm text-destructive">{errors.longitude.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="area">Area (sq km)</Label>
                <Input
                  id="area"
                  type="number"
                  step="any"
                  {...register('area')}
                  className={errors.area ? 'border-destructive' : ''}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="boundaryJson">Boundary JSON (optional)</Label>
                <Textarea
                  id="boundaryJson"
                  {...register('boundaryJson')}
                  placeholder="GeoJSON boundary data..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editItem ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.names.en}&quot;? This action cannot
              be undone and will also delete all child locations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
