import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Dashboard } from './components/dashboard/Dashboard'
import { useWebSocket } from './hooks/useWebSocket'
import { useDeviceData } from './hooks/useDeviceData'
import type { CurrentMeasurements } from './types/measurements'

function App() {
  const [deviceId] = useState('PV001001DEV')
  const { connected, lastMessage } = useWebSocket(deviceId)
  const { data, loading, error, refetch } = useDeviceData(deviceId)
  const [measurements, setMeasurements] = useState<CurrentMeasurements | null>(null)

  // Update measurements from API data
  useEffect(() => {
    if (data) {
      setMeasurements(data)
    }
  }, [data])

  // Update measurements from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'MEASUREMENT_UPDATE') {
      setMeasurements(prev => ({
        ...prev,
        ...lastMessage.data,
        timestamp: new Date().toISOString(),
      } as CurrentMeasurements))
    }
  }, [lastMessage])

  return (
    <div className="min-h-screen">
      <Header 
        deviceId={deviceId}
        connected={connected}
      />
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="card bg-red-900/30 border-red-700/50 mb-6">
            <p className="text-red-400">Error loading data: {error}</p>
            <button 
              type="button"
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        )}
        {!error && (
          <Dashboard 
            deviceId={deviceId}
            measurements={measurements}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}

export default App

