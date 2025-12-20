import { Battery, TrendingUp } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface BatteryHealthDetailCardProps {
  measurements: CurrentMeasurements | null
}

export function BatteryHealthDetailCard({ measurements }: BatteryHealthDetailCardProps) {
  const cellSpread = measurements?.cell_voltage_max && measurements?.cell_voltage_min
    ? measurements.cell_voltage_max - measurements.cell_voltage_min
    : null

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Battery className="w-5 h-5 text-green-500" />
          <h2 className="card-title">Battery Health</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="metric-label">State of Health</span>
          <span className="font-mono text-lg text-green-400">
            {measurements?.soh?.toFixed(0) ?? '-'}%
          </span>
        </div>
        
        {measurements?.soh_min != null && (
          <div className="flex justify-between">
            <span className="metric-label">SOH Min</span>
            <span className="font-mono">{measurements.soh_min.toFixed(0)}%</span>
          </div>
        )}
        
        <div className="border-t border-slate-700 pt-3">
          <div className="flex justify-between">
            <span className="metric-label">Cycles (Avg)</span>
            <span className="font-mono">{measurements?.cycle_count_avg?.toFixed(0) ?? '-'}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="metric-label">Cycles (Max)</span>
            <span className="font-mono">{measurements?.cycle_count_max?.toFixed(0) ?? '-'}</span>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-3">
          <div className="flex justify-between">
            <span className="metric-label">Cell Voltage Range</span>
            <span className="font-mono text-sm">
              {measurements?.cell_voltage_min ?? '-'} - {measurements?.cell_voltage_max ?? '-'} mV
            </span>
          </div>
          {cellSpread !== null && (
            <div className="flex justify-between mt-2">
              <span className="metric-label">Voltage Spread</span>
              <span className={`font-mono ${cellSpread > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                Δ {cellSpread.toFixed(0)} mV
              </span>
            </div>
          )}
        </div>
        
        {measurements?.module_voltage_avg != null && (
          <div className="border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="metric-label">Module Voltage (Avg)</span>
              <span className="font-mono">{measurements.module_voltage_avg.toFixed(2)} V</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

