import { Gauge } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface PowerLimitsCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function PowerLimitsCollapsible({ measurements }: PowerLimitsCollapsibleProps) {
  const maxCharge = measurements?.max_charge_power
  const maxDischarge = measurements?.max_discharge_power

  const formatPower = (watts: number | null): string => {
    if (watts === null) return '-'
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(1)}kW`
    }
    return `${Math.round(absWatts)}W`
  }

  const getSummary = (): string => {
    const parts = []
    if (maxCharge != null) parts.push(`Chg: ${formatPower(maxCharge)}`)
    if (maxDischarge != null) parts.push(`Dchg: ${formatPower(maxDischarge)}`)
    return parts.length > 0 ? parts.join('  •  ') : 'No data'
  }

  return (
    <CollapsibleCard
      icon={<Gauge className="w-5 h-5 text-yellow-500" />}
      title="Power Limits"
      summary={getSummary()}
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-2">M4 Controller</p>
          <div className="flex justify-between text-sm">
            <span className="metric-label">Max Charge / Discharge</span>
            <span className="font-mono">
              {formatPower(maxCharge)} / {formatPower(maxDischarge)}
            </span>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-slate-500 mb-2">Pylontech BMS</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="metric-label">Voltage Limits (Chg / Dchg)</span>
              <span className="font-mono">
                {measurements?.charge_voltage_limit?.toFixed(1) ?? '-'}V / {measurements?.discharge_voltage_limit?.toFixed(1) ?? '-'}V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="metric-label">Current Limits (Chg / Dchg)</span>
              <span className="font-mono">
                {measurements?.charge_current_limit?.toFixed(0) ?? '-'}A / {measurements?.discharge_current_limit?.toFixed(0) ?? '-'}A
              </span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  )
}

