'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { TechAdminOrganizationsSchema } from '@/schemas/techAdmin'

const STORAGE_KEY = 'tech-admin-selected-organization'

type Organization = typeof TechAdminOrganizationsSchema._output[number]
type DomainState = {
  userId: string
  organizations: Organization[]
  selectedOrganizationIds: string[]
  error: string
}

type TechAdminDomainContextValue = {
  isTechAdmin: boolean
  organizations: Organization[]
  selectedOrganizationIds: string[]
  selectOrganizations: (organizationIds: string[]) => void
  loading: boolean
  error: string
}

const emptyContext: TechAdminDomainContextValue = {
  isTechAdmin: false,
  organizations: [],
  selectedOrganizationIds: [],
  selectOrganizations: () => {},
  loading: false,
  error: '',
}

const TechAdminDomainContext = createContext(emptyContext)

function responseError(body: unknown): string {
  return body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
    ? body.error
    : 'Impossible de charger les domaines.'
}

export function useTechAdminDomain(): TechAdminDomainContextValue {
  return useContext(TechAdminDomainContext)
}

export default function TechAdminDomainProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isTechAdmin = session?.user?.accountType === 'STAFF' && session.user.role === 'TECH_ADMIN'
  const userId = isTechAdmin ? session.user.id || 'current-tech-admin' : ''
  const [domainState, setDomainState] = useState<DomainState>({
    userId: '',
    organizations: [],
    selectedOrganizationIds: [],
    error: '',
  })
  const hasCurrentDomainState = Boolean(userId) && domainState.userId === userId
  const organizations = hasCurrentDomainState ? domainState.organizations : []
  const selectedOrganizationIds = hasCurrentDomainState ? domainState.selectedOrganizationIds : []
  const loading = isTechAdmin && !hasCurrentDomainState
  const error = hasCurrentDomainState ? domainState.error : ''

  useEffect(() => {
    if (!isTechAdmin || status === 'loading' || !userId) return
    let active = true
    void (async () => {
      let nextOrganizations: Organization[] = []
      let nextSelectedOrganizationIds: string[] = []
      let nextError = ''
      try {
        const response = await fetch('/api/tech-admin/organizations', { cache: 'no-store' })
        const body: unknown = await response.json()
        if (!response.ok) throw new Error(responseError(body))
        const parsed = TechAdminOrganizationsSchema.safeParse(body)
        if (!parsed.success) throw new Error('La liste des domaines reçue est invalide.')
        nextOrganizations = parsed.data
        let storedSelection: string | null = null
        try {
          storedSelection = window.localStorage.getItem(STORAGE_KEY)
        } catch {
          nextError = 'Impossible de restaurer les domaines précédemment sélectionnés.'
        }
        let storedValue: unknown = storedSelection
        if (storedSelection) {
          try {
            storedValue = JSON.parse(storedSelection)
          } catch {
            // The previous version stored one organization ID without JSON encoding.
          }
        }
        const storedIds = typeof storedValue === 'string'
          ? [storedValue]
          : Array.isArray(storedValue)
            ? storedValue.filter((id): id is string => typeof id === 'string')
            : []
        const availableIds = new Set(parsed.data.map(({ id }) => id))
        nextSelectedOrganizationIds = [...new Set(storedIds.filter((id) => availableIds.has(id)))]
      } catch (cause: unknown) {
        nextError = cause instanceof Error ? cause.message : 'Impossible de charger les domaines.'
      }
      if (active) {
        setDomainState({
          userId,
          organizations: nextOrganizations,
          selectedOrganizationIds: nextSelectedOrganizationIds,
          error: nextError,
        })
      }
    })()

    return () => {
      active = false
    }
  }, [isTechAdmin, status, userId])

  const selectOrganizations = useCallback((organizationIds: string[]) => {
    const availableIds = new Set(
      domainState.userId === userId ? domainState.organizations.map(({ id }) => id) : [],
    )
    const selectedIds = [...new Set(organizationIds.filter((id) => availableIds.has(id)))]
    setDomainState((current) => current.userId === userId
      ? { ...current, selectedOrganizationIds: selectedIds, error: '' }
      : current)
    try {
      if (selectedIds.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      setDomainState((current) => current.userId === userId
        ? { ...current, error: 'Les domaines sont sélectionnés, mais ce choix ne pourra pas être conservé.' }
        : current)
    }
  }, [domainState.organizations, domainState.userId, userId])

  return (
    <TechAdminDomainContext.Provider value={{
      isTechAdmin,
      organizations,
      selectedOrganizationIds,
      selectOrganizations: isTechAdmin ? selectOrganizations : emptyContext.selectOrganizations,
      loading,
      error,
    }}>
      {children}
    </TechAdminDomainContext.Provider>
  )
}
