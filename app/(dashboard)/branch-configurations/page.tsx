'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ExternalLink } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import type { BranchConfiguration, Unit, Location } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const branchSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  basePriceId: z.string().min(1, 'Base price ID is required'),
  physicalLocation: z.string().min(1, 'Physical location is required'),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')),
  email: z.string().email('Must be a valid email'),
  phonePrimary: z.string().min(1, 'Phone is required'),
  tin: z.string().min(1, 'TIN is required'),
  shortCode: z.string().min(1, 'Short code is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormData = z.infer<typeof branchSchema>

export default function BranchConfigurationsPage() {
  const [data, setData] = useState<BranchConfiguration[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<BranchConfiguration | null>(null)
  const [viewItem, setViewItem] = useState<BranchConfiguration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: { status: 'ACTIVE', logoUrl: '' },
  })

  const selectedUnitId = watch('unitId')
  const selectedLocation = watch('physicalLocation')
  const selectedStatus = watch('status')

  const fetchData = async () => {
    try {
      const [branches, unitsData, locationsData] = await Promise.all([
        api.getBranchConfigurations(),
        api.getUnits(),
        api.getLocations(),
      ])
      setData(branches)
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

  const filteredData = filterStatus === 'all'
    ? data
    : data.filter((branch) => branch.status === filterStatus)

  const openCreate = () => {
    setEditItem(null)
    reset({
      unitId: '',
      basePriceId: '',
      physicalLocation: '',
      logoUrl: '',
      email: '',
      phonePrimary: '',
      tin: '',
      shortCode: '',
      status: 'ACTIVE',
    })
    setIsDialogOpen(true)
    setError(null)
  }

  const openEdit = (item: BranchConfiguration) => {
    setEditItem(item)
    setValue('unitId', item.unitId)
    setValue('basePriceId', item.basePriceId)
    setValue('physicalLocation', item.physicalLocation)
    setValue('logoUrl', item.logoUrl || '')
    setValue('email', item.email)
    setValue('phonePrimary', item.phonePrimary)
    setValue('tin', item.tin)
    setValue('shortCode', item.shortCode)
    setValue('status', item.status)
    setIsDialogOpen(true)
    setError(null)
  }

  const onSubmit = async (formData: FormData) => {
    setError(null)
    try {
      if (editItem) {
        await api.updateBranchConfiguration(editItem.id, formData)
      } else {
        await api.createBranchConfiguration(formData)
      }
      setIsDialogOpen(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const onDelete = async (item: BranchConfiguration) => {
    try {
      await api.deleteBranchConfiguration(item.id)
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

  const columns: Column<BranchConfiguration>[] = [
    {
      key: 'shortCode',
      header: 'Code',
      cell: (item) => (
        <Badge variant="secondary" className="font-mono">
          {item.shortCode}
        </Badge>
      ),
    },
    {
      key: 'unitId',
      header: 'Unit',
      cell: (item) => <span className="font-medium">{getUnitName(item.unitId)}</span>,
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'phonePrimary',
      header: 'Phone',
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
    {
      key: 'actions',
      header: '',
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setViewItem(item)
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <DataTable
        data={filteredData}
        columns={columns}
        searchKey="shortCode"
        searchPlaceholder="Search by code..."
        onCreate={openCreate}
        createLabel="Add Branch"
        onEdit={openEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        getRowId={(item) => item.id}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ],
            value: filterStatus,
            onChange: setFilterStatus,
          },
        ]}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Edit Branch Configuration' : 'Create Branch Configuration'}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Update the branch configuration details below.'
                : 'Enter the details for the new branch configuration.'}
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
                <Label htmlFor="basePriceId">Base Price ID</Label>
                <Input
                  id="basePriceId"
                  {...register('basePriceId')}
                  placeholder="e.g., BP001"
                  className={errors.basePriceId ? 'border-destructive' : ''}
                />
                {errors.basePriceId && (
                  <p className="text-sm text-destructive">{errors.basePriceId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Physical Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={(value) => setValue('physicalLocation', value)}
                >
                  <SelectTrigger className={errors.physicalLocation ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.names.en} ({loc.locationType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.physicalLocation && (
                  <p className="text-sm text-destructive">{errors.physicalLocation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortCode">Short Code</Label>
                <Input
                  id="shortCode"
                  {...register('shortCode')}
                  placeholder="e.g., BR001"
                  className={errors.shortCode ? 'border-destructive' : ''}
                />
                {errors.shortCode && (
                  <p className="text-sm text-destructive">{errors.shortCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="branch@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phonePrimary">Primary Phone</Label>
                <Input
                  id="phonePrimary"
                  {...register('phonePrimary')}
                  placeholder="+251 xxx xxx xxx"
                  className={errors.phonePrimary ? 'border-destructive' : ''}
                />
                {errors.phonePrimary && (
                  <p className="text-sm text-destructive">{errors.phonePrimary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  {...register('tin')}
                  placeholder="Tax Identification Number"
                  className={errors.tin ? 'border-destructive' : ''}
                />
                {errors.tin && (
                  <p className="text-sm text-destructive">{errors.tin.message}</p>
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

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                <Input
                  id="logoUrl"
                  {...register('logoUrl')}
                  placeholder="https://example.com/logo.png"
                  className={errors.logoUrl ? 'border-destructive' : ''}
                />
                {errors.logoUrl && (
                  <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
                )}
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

      {/* Detail Sheet */}
      <Sheet open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Branch Details</SheetTitle>
            <SheetDescription>
              View complete branch configuration information
            </SheetDescription>
          </SheetHeader>

          {viewItem && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Short Code</span>
                    <Badge variant="secondary" className="font-mono">
                      {viewItem.shortCode}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="font-medium">{getUnitName(viewItem.unitId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={viewItem.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {viewItem.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{viewItem.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{viewItem.phonePrimary}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TIN</span>
                    <span className="font-mono">{viewItem.tin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price ID</span>
                    <span>{viewItem.basePriceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{getLocationName(viewItem.physicalLocation)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewItem(null)
                    openEdit(viewItem)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    onDelete(viewItem)
                    setViewItem(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
