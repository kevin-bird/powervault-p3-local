import { Thermometer } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface TemperatureCardProps {
  measurements: CurrentMeasurements | null
}

export function TemperatureCard({ measurements }: TemperatureCardProps) {
  const getTempColor = (temp: number | null): string => {
    if (temp === null) return 'text-slate-400'
    if (temp > 40) return 'text-red-400'
    if (temp > 30) return 'text-yellow-400'
    return 'text-green-400'
  }

  const formatTemp = (temp: number | null): string => {
    return temp !== null ? `${temp.toFixed(1)}°C` : '-'
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-orange-500" />
          <h2 className="card-title">Temperatures</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-2">Battery Cells</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="metric-label">Average</span>
              <span className={`font-mono ${getTempColor(measurements?.cell_temp_avg ?? null)}`}>
                {formatTemp(measurements?.cell_temp_avg ?? null)}
              </span>
            </div>
            {measurements?.cell_temp_max != null && (
              <div className="flex justify-between">
                <span className="metric-label">Maximum</span>
                <span className={`font-mono ${getTempColor(measurements.cell_temp_max)}`}>
                  {formatTemp(measurements.cell_temp_max)}
                </span>
              </div>
            )}
            {measurements?.cell_temp_min != null && (
              <div className="flex justify-between">
                <span className="metric-label">Minimum</span>
                <span className={`font-mono ${getTempColor(measurements.cell_temp_min)}`}>
                  {formatTemp(measurements.cell_temp_min)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {measurements?.bms_temp_avg != null && (
          <div className="border-t border-slate-700 pt-3">
            <p className="text-xs text-slate-500 mb-2">BMS</p>
            <div className="flex justify-between">
              <span className="metric-label">BMS Temperature</span>
              <span className={`font-mono ${getTempColor(measurements.bms_temp_avg)}`}>
                {formatTemp(measurements.bms_temp_avg)}
              </span>
            </div>
          </div>
        )}
        
        <div className="border-t border-slate-700 pt-3">
          <p className="text-xs text-slate-500 mb-2">Inverter</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="metric-label">Inverter</span>
              <span className={`font-mono ${getTempColor(measurements?.inverter_temp ?? null)}`}>
                {formatTemp(measurements?.inverter_temp ?? null)}
              </span>
            </div>
            {measurements?.boost_temp != null && (
              <div className="flex justify-between">
                <span className="metric-label">Boost</span>
                <span className={`font-mono ${getTempColor(measurements.boost_temp)}`}>
                  {formatTemp(measurements.boost_temp)}
                </span>
              </div>
            )}
            {measurements?.inner_temp != null && (
              <div className="flex justify-between">
                <span className="metric-label">Inner</span>
                <span className={`font-mono ${getTempColor(measurements.inner_temp)}`}>
                  {formatTemp(measurements.inner_temp)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

