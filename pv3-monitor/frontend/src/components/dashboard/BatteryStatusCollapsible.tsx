import { Activity } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface BatteryStatusCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function BatteryStatusCollapsible({ measurements }: BatteryStatusCollapsibleProps) {
  const current = measurements?.battery_current ?? measurements?.battery_current_total ?? 0
  const capacity = measurements?.battery_capacity ?? 0

  const getSummary = (): string => {
    const parts = []
    if (current !== 0) parts.push(`${Math.abs(current).toFixed(1)}A`)
    if (capacity > 0) parts.push(`${Math.round(capacity)}% usable`)
    return parts.length > 0 ? parts.join('  •  ') : 'No data'
  }

  const formatPower = (watts: number | null): string => {
    if (watts === null) return '-'
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(2)} kW`
    }
    return `${Math.round(absWatts)} W`
  }

  return (
    <CollapsibleCard
      icon={<Activity className="w-5 h-5 text-blue-500" />}
      title="Battery Status"
      summary={getSummary()}
      defaultExpanded={true}
    >
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="metric-label">Current</span>
          <span className="font-mono">{current.toFixed(1)} A</span>
        </div>
        
        <div className="flex justify-between">
          <span className="metric-label">Usable Capacity</span>
          <span className="font-mono">{capacity > 0 ? `${Math.round(capacity)}%` : '-'}</span>
        </div>
        
        {measurements?.max_charge_power != null && (
          <div className="flex justify-between">
            <span className="metric-label">Max Charge Power</span>
            <span className="font-mono text-blue-400">{formatPower(measurements.max_charge_power)}</span>
          </div>
        )}
        
        {measurements?.max_discharge_power != null && (
          <div className="flex justify-between">
            <span className="metric-label">Max Discharge Power</span>
            <span className="font-mono text-green-400">{formatPower(measurements.max_discharge_power)}</span>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

