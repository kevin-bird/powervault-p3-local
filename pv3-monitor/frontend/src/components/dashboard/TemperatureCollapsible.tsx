import { Thermometer } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface TemperatureCollapsibleProps {
  measurements: CurrentMeasurements | null
}

export function TemperatureCollapsible({ measurements }: TemperatureCollapsibleProps) {
  const cellAvg = measurements?.cell_temp_avg
  const cellMin = measurements?.cell_temp_min
  const cellMax = measurements?.cell_temp_max

  const getSummary = (): string => {
    if (cellMin != null && cellMax != null) {
      return `${cellMin.toFixed(1)} - ${cellMax.toFixed(1)}°C (cells)`
    }
    if (cellAvg != null) {
      return `${cellAvg.toFixed(1)}°C (cells)`
    }
    return 'No data'
  }

  const formatTemp = (temp: number | null): string => {
    return temp != null ? `${temp.toFixed(1)}°C` : '-'
  }

  return (
    <CollapsibleCard
      icon={<Thermometer className="w-5 h-5 text-orange-500" />}
      title="Temperatures"
      summary={getSummary()}
      defaultExpanded={true}
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-2">Battery Cells</p>
          <div className="flex justify-between text-sm">
            <span className="metric-label">Avg / Max / Min</span>
            <span className="font-mono">
              {formatTemp(cellAvg)} / {formatTemp(cellMax)} / {formatTemp(cellMin)}
            </span>
          </div>
        </div>
        
        {measurements?.bms_temp_avg != null && (
          <div className="flex justify-between text-sm">
            <span className="metric-label">BMS</span>
            <span className="font-mono">{formatTemp(measurements.bms_temp_avg)}</span>
          </div>
        )}
        
        {(measurements?.inverter_temp != null || measurements?.boost_temp != null || measurements?.inner_temp != null) && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Inverter</p>
            <div className="flex justify-between text-sm">
              <span className="metric-label">Inv / Boost / Inner</span>
              <span className="font-mono">
                {formatTemp(measurements?.inverter_temp ?? null)} / {formatTemp(measurements?.boost_temp ?? null)} / {formatTemp(measurements?.inner_temp ?? null)}
              </span>
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

