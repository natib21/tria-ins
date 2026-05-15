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
import type { OrganizationType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const organizationTypeSchema = z.object({
  nameAm: z.string().min(1, 'Amharic name is required'),
  nameEn: z.string().min(1, 'English name is required'),
  key: z.string().min(1, 'Key is required').regex(/^[A-Z_]+$/, 'Key must be uppercase with underscores'),
})

type FormData = z.infer<typeof organizationTypeSchema>

export default function OrganizationTypesPage() {
  const [data, setData] = useState<OrganizationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<OrganizationType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(organizationTypeSchema),
  })

  const fetchData = async () => {
    try {
      const result = await api.getOrganizationTypes()
      setData(result)
    } catch (err) {
      console.error('Failed to fetch organization types:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditItem(null)
    reset({ nameAm: '', nameEn: '', key: '' })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: OrganizationType) => {
    setEditItem(item)
    setValue('nameAm', item.name.am)
    setValue('nameEn', item.name.en)
    setValue('key', item.key)
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      const payload = {
        name: { am: formData.nameAm, en: formData.nameEn },
        key: formData.key,
      }

      if (editItem) {
        await api.updateOrganizationType(editItem.id, payload)
      } else {
        await api.createOrganizationType(payload)
      }

      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: OrganizationType) => {
    try {
      await api.deleteOrganizationType(item.id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const columns: Column<OrganizationType>[] = [
    {
      key: 'name.en',
      header: 'Name (English)',
      cell: (item) => <span className="font-medium">{item.name.en}</span>,
    },
    {
      key: 'name.am',
      header: 'Name (Amharic)',
      cell: (item) => item.name.am,
    },
    {
      key: 'key',
      header: 'Key',
      cell: (item) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {item.key}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        searchKey="name.en"
        searchPlaceholder="Search organization types..."
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
              {editItem ? 'Edit Organization Type' : 'Create Organization Type'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the organization type details below.'
                : 'Enter the details for the new organization type.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nameEn">Name (English)</Label>
              <Input
                id="nameEn"
                {...register('nameEn')}
                placeholder="e.g., Government Agency"
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
                placeholder="e.g., የመንግስት ኤጀንሲ"
                className={errors.nameAm ? 'border-destructive' : ''}
              />
              {errors.nameAm && (
                <p className="text-sm text-destructive">{errors.nameAm.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                {...register('key')}
                placeholder="e.g., GOVERNMENT_AGENCY"
                className={errors.key ? 'border-destructive' : ''}
              />
              {errors.key && (
                <p className="text-sm text-destructive">{errors.key.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Uppercase letters and underscores only
              </p>
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
