import { Shield } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface EPSStatusCardProps {
  measurements: CurrentMeasurements | null
}

export function EPSStatusCard({ measurements }: EPSStatusCardProps) {
  const epsMode = measurements?.eps_mode === 1 ? 'Enabled' : measurements?.eps_mode === 0 ? 'Disabled' : 'Unknown'
  const modeColor = measurements?.eps_mode === 1 ? 'text-green-400' : 'text-slate-400'

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="card-title">Emergency Power Supply</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="metric-label">EPS Mode</span>
          <span className={`font-mono ${modeColor}`}>
            {epsMode}
          </span>
        </div>
        
        {measurements?.eps_reserve != null && (
          <div className="flex justify-between">
            <span className="metric-label">Reserve SoC</span>
            <span className="font-mono text-lg">
              {measurements.eps_reserve.toFixed(0)}%
            </span>
          </div>
        )}
        
        {measurements?.eps_reserve != null && measurements?.soc != null && (
          <div className="mt-4">
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-green-500/30"
                style={{ width: `${Math.min(100, measurements.soc)}%` }}
              />
              <div 
                className="absolute left-0 top-0 bottom-0 border-r-2 border-blue-400"
                style={{ left: `${Math.min(100, measurements.eps_reserve)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>0%</span>
              <span>Reserve: {measurements.eps_reserve}%</span>
              <span>Current: {measurements.soc.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

