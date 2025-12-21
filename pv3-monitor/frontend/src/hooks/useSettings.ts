import { useState, useEffect } from 'react'

export interface CollectionSettings {
  collection_mode: 'browser' | 'server'
  collection_interval_seconds: number
  mqtt_host: string
  mqtt_port: number
  device_id: string
}

export function useSettings() {
  const [settings, setSettings] = useState<CollectionSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/collection')
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, refetch: loadSettings }
}

