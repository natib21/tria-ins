// Location Types
export type LocationType = 'CITY' | 'SUBCITY' | 'WOREDA' | 'KEBELE'

export interface Location {
  id: string
  parentId: string | null
  locationType: LocationType
  names: {
    am: string
    en: string
  }
  code: string
  latitude: number
  longitude: number
  area: number
  boundaryJson: string
  children?: Location[]
}

export interface LocationTypeEntity {
  id: string
  name: string
  level: number
  description?: string
}

// Organization Types
export interface OrganizationType {
  id: string
  name: {
    am: string
    en: string
  }
  key: string
}

// Organizations
export interface Organization {
  id: string
  name: {
    am: string
    en: string
  }
  key: string
  isSuperAdmin: boolean
  isGovernmentOrganization: boolean
  status: 'Active' | 'Inactive'
  parentId: string | null
  organizationTypeId: string
  organizationType?: OrganizationType
  createdAt?: string
  updatedAt?: string
}

// Units
export interface Unit {
  id: string
  name: string
  organizationId: string
  organization?: Organization
  status: 'ACTIVE' | 'INACTIVE'
}

// Branch Configuration
export interface BranchConfiguration {
  id: string
  unitId: string
  unit?: Unit
  basePriceId: string
  physicalLocation: string
  physicalLocationDetails?: Location
  logoUrl: string
  email: string
  phonePrimary: string
  tin: string
  shortCode: string
  status: 'ACTIVE' | 'INACTIVE'
}

// Branch Territory
export interface BranchTerritory {
  id: string
  unitId: string
  unit?: Unit
  locationId: string
  location?: Location
  locationType: LocationType
}

// Auth Types
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API List Response (count + items format)
export interface ListResponse<T> {
  count: number
  items: T[]
}

export interface ApiError {
  message: string
  statusCode: number
}

// Form Types
export interface OrganizationTypeFormData {
  name: {
    am: string
    en: string
  }
  key: string
}

export interface OrganizationFormData {
  name: string
  organizationTypeId: string
}

export interface UnitFormData {
  name: string
  organizationId: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface BranchConfigurationFormData {
  unitId: string
  basePriceId: string
  physicalLocation: string
  logoUrl: string
  email: string
  phonePrimary: string
  tin: string
  shortCode: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface BranchTerritoryFormData {
  unitId: string
  locationId: string
  locationType: LocationType
}

export interface LocationFormData {
  parentId: string | null
  locationType: LocationType
  names: {
    am: string
    en: string
  }
  code: string
  latitude: number
  longitude: number
  area: number
  boundaryJson: string
}

// Dashboard Stats
export interface DashboardStats {
  totalOrganizations: number
  totalUnits: number
  totalBranches: number
  totalLocations: number
  totalTerritories: number
}
