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
import type { Unit, Organization } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const unitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormData = z.infer<typeof unitSchema>

export default function UnitsPage() {
  const [data, setData] = useState<Unit[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Unit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterOrg, setFilterOrg] = useState('all')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: { status: 'ACTIVE' },
  })

  const selectedOrgId = watch('organizationId')
  const selectedStatus = watch('status')

  const fetchData = async () => {
    try {
      const [units, orgs] = await Promise.all([
        api.getUnits(),
        api.getOrganizations(),
      ])
      setData(units)
      setOrganizations(orgs)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredData = filterOrg === 'all'
    ? data
    : data.filter((unit) => unit.organizationId === filterOrg)

  const openCreate = () => {
    setEditItem(null)
    reset({ name: '', organizationId: '', status: 'ACTIVE' })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: Unit) => {
    setEditItem(item)
    setValue('name', item.name)
    setValue('organizationId', item.organizationId)
    setValue('status', item.status)
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      if (editItem) {
        await api.updateUnit(editItem.id, formData)
      } else {
        await api.createUnit(formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: Unit) => {
    try {
      await api.deleteUnit(item.id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const getOrgName = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId)
    return org?.name || 'Unknown'
  }

  const columns: Column<Unit>[] = [
    {
      key: 'name',
      header: 'Unit Name',
      cell: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'organizationId',
      header: 'Organization',
      cell: (item) => getOrgName(item.organizationId),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={filteredData}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search units..."
        onCreate={openCreate}
        createLabel="Add Unit"
        onEdit={openEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        filters={[
          {
            key: 'organization',
            label: 'Organization',
            options: organizations.map((org) => ({
              value: org.id,
              label: org.name,
            })),
            value: filterOrg,
            onChange: setFilterOrg,
          },
        ]}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the unit details below.'
                : 'Enter the details for the new unit.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Unit Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Finance Department"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={selectedOrgId}
                onValueChange={(value) => setValue('organizationId', value)}
              >
                <SelectTrigger className={errors.organizationId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organizationId && (
                <p className="text-sm text-destructive">{errors.organizationId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
