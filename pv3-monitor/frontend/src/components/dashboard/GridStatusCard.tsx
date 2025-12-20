import { Zap } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface GridStatusCardProps {
  measurements: CurrentMeasurements | null
}

export function GridStatusCard({ measurements }: GridStatusCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <h2 className="card-title">Grid Status</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="metric-label">Voltage</span>
          <span className="font-mono">
            {measurements?.grid_voltage?.toFixed(1) ?? '-'} V
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="metric-label">Frequency</span>
          <span className="font-mono">
            {measurements?.grid_frequency?.toFixed(2) ?? '-'} Hz
          </span>
        </div>
        
        {measurements?.aux_power != null && (
          <div className="border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="metric-label">AUX1 CT Power</span>
              <span className="font-mono">
                {Math.round(measurements.aux_power)} W
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

