'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/data-table/data-table'
import { api } from '@/lib/api'
import type { LocationTypeEntity } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const locationTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  level: z.coerce.number().min(1, 'Level must be at least 1'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof locationTypeSchema>

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-chart-1 text-white',
  2: 'bg-chart-2 text-white',
  3: 'bg-chart-3 text-white',
  4: 'bg-chart-4 text-white',
}

export default function LocationTypesPage() {
  const [data, setData] = useState<LocationTypeEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<LocationTypeEntity | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(locationTypeSchema),
  })

  const fetchData = async () => {
    try {
      const result = await api.getLocationTypes()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch location types:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditItem(null)
    reset({ name: '', level: 1, description: '' })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: LocationTypeEntity) => {
    setEditItem(item)
    setValue('name', item.name)
    setValue('level', item.level)
    setValue('description', item.description || '')
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      if (editItem) {
        await api.updateLocationType(editItem.id, formData)
      } else {
        await api.createLocationType(formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: LocationTypeEntity) => {
    try {
      await api.deleteLocationType(item.id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const columns: Column<LocationTypeEntity>[] = [
    {
      key: 'level',
      header: 'Level',
      cell: (item) => (
        <Badge className={LEVEL_COLORS[item.level] || 'bg-muted'}>
          Level {item.level}
        </Badge>
      ),
      className: 'w-[100px]',
    },
    {
      key: 'name',
      header: 'Name',
      cell: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (item) => (
        <span className="text-muted-foreground">{item.description || '-'}</span>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={data.sort((a, b) => a.level - b.level)}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search location types..."
        onCreate={openCreate}
        createLabel="Add Type"
        onEdit={openEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        getRowId={(item) => item.id}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Location Type' : 'Create Location Type'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the location type details below.'
                : 'Define a new location type in the hierarchy.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., CITY, SUBCITY, WOREDA, KEBELE"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="number"
                min={1}
                {...register('level')}
                placeholder="Hierarchy level (1 = top)"
                className={errors.level ? 'border-destructive' : ''}
              />
              {errors.level && (
                <p className="text-sm text-destructive">{errors.level.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Lower numbers are higher in the hierarchy (1 = City, 2 = Subcity, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Brief description of this location type"
              />
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
    </div>
  )
}
