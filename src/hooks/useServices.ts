"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Service } from '@/types/models'
import { getServicesClient } from '@/services/services.service'

export default function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(() => getServicesClient(), [])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setServices(await fetchServices())
    } catch (err: unknown) {
      setServices([])
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [fetchServices])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const nextServices = await fetchServices()
        if (active) setServices(nextServices)
      } catch (err: unknown) {
        if (active) {
          setServices([])
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [fetchServices])

  return { services, isLoading, error, reload: load }
}
