"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Customer } from '@/types/models'
import { getCustomersClient } from '@/services/customers.service'

export default function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(() => getCustomersClient(), [])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setCustomers(await fetchCustomers())
    } catch (err: unknown) {
      setCustomers([])
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [fetchCustomers])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const nextCustomers = await fetchCustomers()
        if (active) setCustomers(nextCustomers)
      } catch (err: unknown) {
        if (active) {
          setCustomers([])
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [fetchCustomers])

  return { customers, isLoading, error, reload: load }
}
