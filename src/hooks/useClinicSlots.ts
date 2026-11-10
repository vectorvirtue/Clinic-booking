import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import type { AppointmentSlot, SlotsResponse } from '../lib/clinic'

export function useClinicSlots() {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  const refresh = useCallback(() => {
    setIsLoading(true)
    setError('')
    setReloadVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<SlotsResponse>('/slots', { signal: controller.signal })
      .then(({ slots: loadedSlots }) => setSlots(loadedSlots))
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setError(requestError instanceof Error ? requestError.message : 'Unable to load clinic slots.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [reloadVersion])

  return { slots, isLoading, error, refresh }
}
