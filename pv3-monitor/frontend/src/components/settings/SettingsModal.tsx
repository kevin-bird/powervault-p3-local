import { useState, useEffect } from 'react'
import { X, Server, Globe } from 'lucide-react'

interface Settings {
  collection_mode: 'browser' | 'server'
  collection_interval_seconds: number
  mqtt_host: string
  mqtt_port: number
  device_id: string
  postgres_user: string
  postgres_db: string
  api_host: string
  api_port: number
  vite_api_url: string
  vite_ws_url: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError('Failed to load settings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/settings/collection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_mode: settings.collection_mode,
          collection_interval_seconds: settings.collection_interval_seconds,
          mqtt_host: settings.mqtt_host,
          mqtt_port: settings.mqtt_port,
          device_id: settings.device_id,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-slate-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-slate-400">Loading settings...</p>
          ) : settings ? (
            <>
              {/* Data Collection Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Data Collection</h3>
                
                {/* Collection Mode */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <input
                      type="radio"
                      name="collection_mode"
                      value="browser"
                      checked={settings.collection_mode === 'browser'}
                      onChange={(e) => setSettings({...settings, collection_mode: e.target.value as 'browser'})}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-slate-200">Browser Mode</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Data collected while browser is open. Stored locally in IndexedDB.
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <input
                      type="radio"
                      name="collection_mode"
                      value="server"
                      checked={settings.collection_mode === 'server'}
                      onChange={(e) => setSettings({...settings, collection_mode: e.target.value as 'server'})}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-slate-200">Server Mode</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Data collected 24/7 by server. Stored in PostgreSQL database.
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Collection Interval */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Collection Interval: {settings.collection_interval_seconds}s
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.collection_interval_seconds}
                    onChange={(e) => setSettings({...settings, collection_interval_seconds: Number.parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1s (high frequency)</span>
                    <span>60s (low frequency)</span>
                  </div>
                </div>
              </div>

              {/* MQTT Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">MQTT Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      MQTT Host
                    </label>
                    <input
                      type="text"
                      value={settings.mqtt_host}
                      onChange={(e) => setSettings({...settings, mqtt_host: e.target.value})}
                      disabled={settings.collection_mode === 'browser'}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      MQTT Port
                    </label>
                    <input
                      type="number"
                      value={settings.mqtt_port}
                      onChange={(e) => setSettings({...settings, mqtt_port: Number.parseInt(e.target.value)})}
                      disabled={settings.collection_mode === 'browser'}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 disabled:opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    P3 Device ID
                  </label>
                  <input
                    type="text"
                    value={settings.device_id}
                    onChange={(e) => setSettings({...settings, device_id: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Read-only Info */}
              <div className="space-y-3 text-sm">
                <h3 className="text-lg font-semibold text-slate-200">System Info</h3>
                <div className="grid grid-cols-2 gap-3 text-slate-400">
                  <div>
                    <span className="block text-xs text-slate-500">Database</span>
                    <span className="font-mono">{settings.postgres_user}@{settings.postgres_db}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">API</span>
                    <span className="font-mono">{settings.api_host}:{settings.api_port}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          ) : (
            <p className="text-red-400">Failed to load settings</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !settings}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

