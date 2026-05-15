import type {
  AuthResponse,
  BranchConfiguration,
  BranchTerritory,
  ListResponse,
  Location,
  LocationTypeEntity,
  LoginCredentials,
  Organization,
  OrganizationType,
  Unit,
} from './types'

const API_BASE = 'http://localhost:3010/api'

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Request failed with status ${response.status}`)
    }

    return response.json()
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token)
      // Only store user if the backend returns it
      if (response.user) {
        localStorage.setItem('auth_user', JSON.stringify(response.user))
      }
    }

    return response
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
  }

  // Organization Types
  async getOrganizationTypes(): Promise<OrganizationType[]> {
    const response = await this.request<ListResponse<OrganizationType> | OrganizationType[]>('/organization-types')
    return Array.isArray(response) ? response : response.items
  }

  async getOrganizationType(id: string): Promise<OrganizationType> {
    return this.request<OrganizationType>(`/organization-types/${id}`)
  }

  async createOrganizationType(data: Omit<OrganizationType, 'id'>): Promise<OrganizationType> {
    return this.request<OrganizationType>('/organization-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrganizationType(id: string, data: Partial<OrganizationType>): Promise<OrganizationType> {
    return this.request<OrganizationType>(`/organization-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteOrganizationType(id: string): Promise<void> {
    await this.request<void>(`/organization-types/${id}`, {
      method: 'DELETE',
    })
  }

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const response = await this.request<ListResponse<Organization> | Organization[]>('/organizations')
    return Array.isArray(response) ? response : response.items
  }

  async getOrganization(id: string): Promise<Organization> {
    return this.request<Organization>(`/organizations/${id}`)
  }

  async createOrganization(data: Omit<Organization, 'id'>): Promise<Organization> {
    return this.request<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.request<Organization>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.request<void>(`/organizations/${id}`, {
      method: 'DELETE',
    })
  }

  // Units
  async getUnits(organizationId?: string): Promise<Unit[]> {
    const endpoint = organizationId ? `/units?organizationId=${organizationId}` : '/units'
    const response = await this.request<ListResponse<Unit> | Unit[]>(endpoint)
    return Array.isArray(response) ? response : response.items
  }

  async getUnit(id: string): Promise<Unit> {
    return this.request<Unit>(`/units/${id}`)
  }

  async createUnit(data: Omit<Unit, 'id'>): Promise<Unit> {
    return this.request<Unit>('/units', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUnit(id: string, data: Partial<Unit>): Promise<Unit> {
    return this.request<Unit>(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteUnit(id: string): Promise<void> {
    await this.request<void>(`/units/${id}`, {
      method: 'DELETE',
    })
  }

  // Branch Configurations
  async getBranchConfigurations(): Promise<BranchConfiguration[]> {
    const response = await this.request<ListResponse<BranchConfiguration> | BranchConfiguration[]>('/branch-configurations')
    return Array.isArray(response) ? response : response.items
  }

  async getBranchConfiguration(id: string): Promise<BranchConfiguration> {
    return this.request<BranchConfiguration>(`/branch-configurations/${id}`)
  }

  async createBranchConfiguration(data: Omit<BranchConfiguration, 'id'>): Promise<BranchConfiguration> {
    return this.request<BranchConfiguration>('/branch-configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBranchConfiguration(id: string, data: Partial<BranchConfiguration>): Promise<BranchConfiguration> {
    return this.request<BranchConfiguration>(`/branch-configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBranchConfiguration(id: string): Promise<void> {
    await this.request<void>(`/branch-configurations/${id}`, {
      method: 'DELETE',
    })
  }

  // Locations
  async getLocations(parentId?: string): Promise<Location[]> {
    const endpoint = parentId ? `/locations?parentId=${parentId}` : '/locations'
    const response = await this.request<ListResponse<Location> | Location[]>(endpoint)
    return Array.isArray(response) ? response : response.items
  }

  async getLocation(id: string): Promise<Location> {
    return this.request<Location>(`/locations/${id}`)
  }

  async createLocation(data: Omit<Location, 'id'>): Promise<Location> {
    return this.request<Location>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLocation(id: string, data: Partial<Location>): Promise<Location> {
    return this.request<Location>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLocation(id: string): Promise<void> {
    await this.request<void>(`/locations/${id}`, {
      method: 'DELETE',
    })
  }

  // Location Types
  async getLocationTypes(): Promise<LocationTypeEntity[]> {
    const response = await this.request<ListResponse<LocationTypeEntity> | LocationTypeEntity[]>('/location-types')
    return Array.isArray(response) ? response : response.items
  }

  async createLocationType(data: Omit<LocationTypeEntity, 'id'>): Promise<LocationTypeEntity> {
    return this.request<LocationTypeEntity>('/location-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLocationType(id: string, data: Partial<LocationTypeEntity>): Promise<LocationTypeEntity> {
    return this.request<LocationTypeEntity>(`/location-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLocationType(id: string): Promise<void> {
    await this.request<void>(`/location-types/${id}`, {
      method: 'DELETE',
    })
  }

  // Branch Territories
  async getBranchTerritories(): Promise<BranchTerritory[]> {
    const response = await this.request<ListResponse<BranchTerritory> | BranchTerritory[]>('/branch-territories')
    return Array.isArray(response) ? response : response.items
  }

  async getBranchTerritory(id: string): Promise<BranchTerritory> {
    return this.request<BranchTerritory>(`/branch-territories/${id}`)
  }

  async createBranchTerritory(data: Omit<BranchTerritory, 'id'>): Promise<BranchTerritory> {
    return this.request<BranchTerritory>('/branch-territories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBranchTerritory(id: string, data: Partial<BranchTerritory>): Promise<BranchTerritory> {
    return this.request<BranchTerritory>(`/branch-territories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteBranchTerritory(id: string): Promise<void> {
    await this.request<void>(`/branch-territories/${id}`, {
      method: 'DELETE',
    })
  }

  // Check if KEBELE is already assigned
  async checkKebeleAssignment(locationId: string): Promise<BranchTerritory | null> {
    const territories = await this.getBranchTerritories()
    return territories.find(
      (t) => t.locationId === locationId && t.locationType === 'KEBELE'
    ) || null
  }
}

export const api = new ApiClient()
