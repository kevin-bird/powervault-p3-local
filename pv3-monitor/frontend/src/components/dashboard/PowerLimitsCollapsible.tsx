import { Gauge } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface PowerLimitsCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function PowerLimitsCollapsible({ measurements }: PowerLimitsCollapsibleProps) {
  return (
    <CollapsibleCard
      icon={<Gauge className="w-5 h-5 text-yellow-500" />}
      title="Power Limits"
      summary="Pylontech BMS"
    >
      <div className="space-y-3">
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

