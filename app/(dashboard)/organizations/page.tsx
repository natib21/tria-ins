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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/data-table/data-table'
import { api } from '@/lib/api'
import type { Organization, OrganizationType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organizationTypeId: z.string().min(1, 'Organization type is required'),
})

type FormData = z.infer<typeof organizationSchema>

export default function OrganizationsPage() {
  const [data, setData] = useState<Organization[]>([])
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(organizationSchema),
  })

  const selectedTypeId = watch('organizationTypeId')

  const fetchData = async () => {
    try {
      const [orgs, types] = await Promise.all([
        api.getOrganizations(),
        api.getOrganizationTypes(),
      ])
      setData(orgs)
      setOrgTypes(types)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditItem(null)
    reset({ name: '', organizationTypeId: '' })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: Organization) => {
    setEditItem(item)
    setValue('name', item.name)
    setValue('organizationTypeId', item.organizationTypeId)
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      if (editItem) {
        await api.updateOrganization(editItem.id, formData)
      } else {
        await api.createOrganization(formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: Organization) => {
    try {
      await api.deleteOrganization(item.id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getTypeName = (typeId: string) => {
    const type = orgTypes.find((t) => t.id === typeId)
    console.log(type)
    return type?.name.en || 'Unknown'
  }

  const columns: Column<Organization>[] = [
    {
      key: 'name',
      header: 'Organization Name',
      cell: (item) => <span className="font-medium">{item.name?.en}</span>,
    },
    {
      key: 'organizationTypeId',
      header: 'Type',
      cell: (item) => (
        <Badge variant="outline">{getTypeName(item.organizationTypeId)}</Badge>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={data}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search organizations..."
        onCreate={openCreate}
        createLabel="Add Organization"
        onEdit={openEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        getRowId={(item) => item.id}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Organization' : 'Create Organization'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the organization details below.'
                : 'Enter the details for the new organization.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Ministry of Finance"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Organization Type</Label>
              <Select
                value={selectedTypeId}
                onValueChange={(value) => setValue('organizationTypeId', value)}
              >
                <SelectTrigger className={errors.organizationTypeId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                 <SelectContent>
                  {orgTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name.en}
                    </SelectItem>
                  ))}
                </SelectContent> 
              </Select>
              {errors.organizationTypeId && (
                <p className="text-sm text-destructive">{errors.organizationTypeId.message}</p>
              )}
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
