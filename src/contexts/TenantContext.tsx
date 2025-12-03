'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Tenant {
  id: string
  name: string
  slug: string
}

interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  tenantId: string
  superuser: boolean
}

interface TenantContextType {
  currentUser: CurrentUser | null
  selectedTenant: Tenant | null
  selectedTenantId: string | null
  tenants: Tenant[]
  switchTenant: (tenantId: string) => Promise<void>
  setSelectedTenantId: (tenantId: string | null) => void
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser?.superuser && tenants.length === 0) {
      fetchTenants()
    }
  }, [currentUser, tenants.length])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        // Set initial selected tenant to user's tenant
        setSelectedTenantId(user.tenantId)

        // Fetch tenant details
        if (user.tenantId) {
          fetchTenantDetails(user.tenantId)
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    }
  }

  const fetchTenantDetails = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTenant(data.tenant)
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error)
    }
  }

  const switchTenant = async (tenantId: string) => {
    try {
      console.log('🔄 [TenantContext] switchTenant called with:', tenantId)
      await fetchTenantDetails(tenantId)
      setSelectedTenantId(tenantId)
      console.log('✅ [TenantContext] Tenant switched successfully')
    } catch (error) {
      console.error('❌ [TenantContext] Error switching tenant:', error)
      throw error
    }
  }

  return (
    <TenantContext.Provider
      value={{
        currentUser,
        selectedTenant,
        selectedTenantId,
        tenants,
        switchTenant,
        setSelectedTenantId,
        isLoading
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
