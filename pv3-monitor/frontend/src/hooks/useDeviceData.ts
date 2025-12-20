import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type { CurrentMeasurements } from '../types/measurements'

interface UseDeviceDataReturn {
  data: CurrentMeasurements | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDeviceData(deviceId: string): UseDeviceDataReturn {
  const [data, setData] = useState<CurrentMeasurements | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const measurements = await api.getCurrentMeasurements(deviceId)
      setData(measurements)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to fetch data'
      setError(errorMessage)
      console.error('Error fetching device data:', e)
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchData()

    // Refresh data every 30 seconds as backup to WebSocket
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

