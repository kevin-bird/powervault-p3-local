import { Heart } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface BatteryHealthCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function BatteryHealthCollapsible({ measurements }: BatteryHealthCollapsibleProps) {
  const soh = measurements?.soh ?? 0
  const cellSpread = measurements?.cell_voltage_max && measurements?.cell_voltage_min
    ? measurements.cell_voltage_max - measurements.cell_voltage_min
    : null

  const getSummary = (): string => {
    const parts = []
    if (soh > 0) parts.push(`${Math.round(soh)}% SOH`)
    if (cellSpread !== null) {
      parts.push(`Δ${cellSpread.toFixed(0)}mV ${cellSpread < 20 ? 'balanced' : cellSpread < 50 ? 'ok' : 'unbalanced'}`)
    }
    return parts.length > 0 ? parts.join('  •  ') : 'No data'
  }

  const getAlertLevel = (): 'normal' | 'warning' | 'error' => {
    if (soh > 0 && soh < 60) return 'error'
    if (soh > 0 && soh < 80) return 'warning'
    if (cellSpread !== null && cellSpread > 50) return 'warning'
    return 'normal'
  }

  const iconColor = soh >= 80 ? 'text-green-500' : soh >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <CollapsibleCard
      icon={<Heart className={`w-5 h-5 ${iconColor}`} />}
      title="Battery Health"
      summary={getSummary()}
      alertLevel={getAlertLevel()}
      defaultExpanded={true}
    >
      <div className="space-y-3">
        {measurements?.cycle_count_avg != null && measurements?.cycle_count_max != null && (
          <div className="flex justify-between">
            <span className="metric-label">Cycles (Avg / Max)</span>
            <span className="font-mono text-sm">
              {Math.round(measurements.cycle_count_avg)} / {Math.round(measurements.cycle_count_max)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="metric-label">Cell Voltage Range</span>
          <span className="font-mono text-sm">
            {measurements?.cell_voltage_min ?? '-'} - {measurements?.cell_voltage_max ?? '-'} mV
          </span>
        </div>
        
        {cellSpread !== null && (
          <div className="flex justify-between">
            <span className="metric-label">Voltage Spread</span>
            <span className={`font-mono ${cellSpread > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              Δ {cellSpread.toFixed(0)} mV
            </span>
          </div>
        )}
        
        {measurements?.module_voltage_avg != null && (
          <div className="flex justify-between">
            <span className="metric-label">Module Voltage</span>
            <span className="font-mono">{measurements.module_voltage_avg.toFixed(2)} V</span>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

