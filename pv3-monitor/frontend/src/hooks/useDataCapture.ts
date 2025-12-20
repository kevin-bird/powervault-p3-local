import { useEffect, useRef, useState } from 'react'
import { addMeasurement, cleanupOldData, type MeasurementRecord } from '../services/db'
import type { CurrentMeasurements } from '../types/measurements'

const CAPTURE_INTERVAL = 60 * 1000 // 1 minute

interface UseDataCaptureOptions {
  measurements: CurrentMeasurements | null
  paused?: boolean
}

export function useDataCapture({ measurements, paused = false }: UseDataCaptureOptions) {
  const lastCaptureRef = useRef<number>(0)
  const [recordCount, setRecordCount] = useState(0)

  useEffect(() => {
    if (paused || !measurements) return

    const now = Date.now()
    
    // Check if enough time has passed since last capture
    if (now - lastCaptureRef.current >= CAPTURE_INTERVAL) {
      const record: Omit<MeasurementRecord, 'id'> = {
        timestamp: new Date(),
        grid_power: measurements.grid_power ?? 0,
        house_power: measurements.house_power ?? 0,
        battery_power: measurements.battery_power ?? 0,
        battery_soc: measurements.soc ?? 0,
        battery_voltage: measurements.battery_voltage ?? 0,
        grid_voltage: measurements.grid_voltage ?? 0,
        cell_temp_avg: measurements.cell_temp_avg,
        cell_temp_max: measurements.cell_temp_max,
        cell_temp_min: measurements.cell_temp_min,
        bms_temp: measurements.bms_temp_avg,
      }

      addMeasurement(record)
        .then(() => {
          lastCaptureRef.current = now
          setRecordCount(prev => prev + 1)
        })
        .catch(err => console.error('Failed to store measurement:', err))
    }
  }, [measurements, paused])

  // Cleanup old data on mount
  useEffect(() => {
    cleanupOldData().catch(err => console.error('Failed to cleanup old data:', err))
  }, [])

  return { recordCount }
}

