import { useState, useEffect } from 'react'
import { api } from '../services/api'

export interface AlarmStatus {
  device_id: string
  active_count: number
  active_alarms: string[]
  all_alarms: Record<string, boolean>
  updated_at: string
}

export function useAlarms(deviceId: string) {
  const [alarmStatus, setAlarmStatus] = useState<AlarmStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlarms = async () => {
    try {
      const status = await api.getAlarmStatus(deviceId)
      setAlarmStatus(status)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch alarms'
      setError(errorMessage)
      console.error('Error fetching alarms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlarms()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlarms, 30000)
    
    return () => clearInterval(interval)
  }, [deviceId])

  return { alarmStatus, loading, error, refetch: fetchAlarms }
}

