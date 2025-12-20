import { Cpu } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface InverterDetailsCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function InverterDetailsCollapsible({ measurements }: InverterDetailsCollapsibleProps) {
  const gridPower = measurements?.grid_power ?? 0
  const batteryPower = measurements?.battery_power ?? 0
  
  const formatPower = (watts: number | null): string => {
    if (watts === null) return '-'
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(2)} kW`
    }
    return `${Math.round(absWatts)} W`
  }

  const getSummary = (): string => {
    const acOutput = Math.abs(gridPower)
    return acOutput > 0 ? `AC Out: ${formatPower(acOutput)}` : 'No data'
  }

  return (
    <CollapsibleCard
      icon={<Cpu className="w-5 h-5 text-cyan-500" />}
      title="Inverter Details"
      summary={getSummary()}
    >
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="metric-label">AC Output</span>
          <span className="font-mono">{formatPower(Math.abs(gridPower))}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="metric-label">Grid CT</span>
          <span className="font-mono">{formatPower(gridPower)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="metric-label">Battery Charge Rate</span>
          <span className="font-mono">{formatPower(batteryPower)}</span>
        </div>
        
        {measurements?.aux_power != null && (
          <div className="border-t border-slate-700 pt-3">
            <p className="text-xs text-slate-500 mb-2">External CT (AUX1)</p>
            <div className="flex justify-between">
              <span className="metric-label">Power</span>
              <span className="font-mono">{formatPower(measurements.aux_power)}</span>
            </div>
          </div>
        )}
        
        {measurements?.grid_frequency != null && (
          <div className="border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="metric-label">Grid Frequency</span>
              <span className="font-mono">{measurements.grid_frequency.toFixed(2)} Hz</span>
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

