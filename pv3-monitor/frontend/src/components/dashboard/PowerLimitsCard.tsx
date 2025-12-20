import { Zap, ArrowUp, ArrowDown } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface PowerLimitsCardProps {
  measurements: CurrentMeasurements | null
}

export function PowerLimitsCard({ measurements }: PowerLimitsCardProps) {
  const formatPower = (watts: number | null): string => {
    if (watts === null) return '-'
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(2)} kW`
    }
    return `${Math.round(absWatts)} W`
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="card-title">Power Limits</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-2">Current Limits (M4)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <ArrowDown className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-slate-400">Max Charge</span>
              </div>
              <span className="font-mono text-lg text-blue-400">
                {formatPower(measurements?.max_charge_power ?? null)}
              </span>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-slate-400">Max Discharge</span>
              </div>
              <span className="font-mono text-lg text-green-400">
                {formatPower(measurements?.max_discharge_power ?? null)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 mb-2">Voltage Limits (Pylontech)</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="metric-label">Charge Limit</span>
              <span className="font-mono">
                {measurements?.charge_voltage_limit?.toFixed(2) ?? '-'} V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="metric-label">Discharge Limit</span>
              <span className="font-mono">
                {measurements?.discharge_voltage_limit?.toFixed(2) ?? '-'} V
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 mb-2">Current Limits (Pylontech)</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="metric-label">Charge Limit</span>
              <span className="font-mono">
                {measurements?.charge_current_limit?.toFixed(1) ?? '-'} A
              </span>
            </div>
            <div className="flex justify-between">
              <span className="metric-label">Discharge Limit</span>
              <span className="font-mono">
                {measurements?.discharge_current_limit?.toFixed(1) ?? '-'} A
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

