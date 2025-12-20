import { Home, Zap, Sun } from 'lucide-react'
import type { CurrentMeasurements } from '../../types/measurements'

interface BatteryIconProps {
  soc: number
  usableCapacity: number
  charging: boolean
  discharging: boolean
}

function BatteryVertical({ soc, usableCapacity, charging, discharging }: BatteryIconProps) {
  const clampedSoc = Math.max(0, Math.min(100, soc))
  const clampedUsable = Math.max(0, Math.min(100, usableCapacity))
  
  const getColor = (): string => {
    if (soc >= 50) return '#22c55e'  // green
    if (soc >= 20) return '#eab308'  // yellow
    return '#ef4444'  // red
  }

  const fillColor = getColor()
  const usableColor = '#22c55e'  // bright green for usable portion
  const reservedColor = '#fb923c'  // orange for reserved/unusable portion
  const borderColor = charging ? '#3b82f6' : discharging ? '#22c55e' : '#64748b'

  const tooltipContent = `SoC: ${soc.toFixed(0)}% · Usable: ${usableCapacity.toFixed(0)}% · Reserved: ${(soc - usableCapacity).toFixed(0)}%`

  return (
    <div className="relative inline-block">
      {/* Battery Cap */}
      <div 
        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-5 h-1.5 rounded-t"
        style={{ backgroundColor: borderColor }}
      />
      
      {/* Battery Body */}
      <div 
        className="relative w-12 h-20 rounded border-2 overflow-hidden bg-slate-800/50 cursor-help"
        style={{ borderColor }}
        title={tooltipContent}
      >
        {/* Usable Capacity (bottom layer - bright green) */}
        <div 
          className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
          style={{ 
            height: `${clampedUsable}%`,
            backgroundColor: usableColor,
            opacity: 0.95,
          }}
        />
        
        {/* Reserved/Unusable Capacity (middle layer - orange for contrast) */}
        {clampedSoc > clampedUsable && (
          <div 
            className="absolute left-0 right-0 transition-all duration-500 ease-out"
            style={{ 
              bottom: `${clampedUsable}%`,
              height: `${clampedSoc - clampedUsable}%`,
              backgroundColor: reservedColor,
              opacity: 0.90,
            }}
          />
        )}
      </div>
    </div>
  )
}


interface PowerFlowEnhancedProps {
  measurements: CurrentMeasurements | null
  scheduleName: string
}

export function PowerFlowEnhanced({ measurements, scheduleName }: PowerFlowEnhancedProps) {
  const formatPower = (watts: number): string => {
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(watts / 1000).toFixed(2)} kW`
    }
    return `${Math.round(watts)} W`
  }

  const gridPower = measurements?.grid_power ?? 0
  const housePower = measurements?.house_power ?? 0
  const batteryPower = measurements?.battery_power ?? 0
  const solarPower = measurements?.solar_power ?? 0
  const soc = measurements?.soc ?? 0
  const usableCapacity = measurements?.battery_capacity ?? soc
  const batteryVoltage = measurements?.battery_voltage ?? 0
  const gridVoltage = measurements?.grid_voltage ?? 0
  const soh = measurements?.soh ?? 0

  // Determine states
  const gridImporting = gridPower > 10
  const gridExporting = gridPower < -10
  const batteryCharging = batteryPower < -10
  const batteryDischarging = batteryPower > 10
  const hasSolar = solarPower > 10

  const getBatteryState = (): string => {
    if (batteryCharging) return 'Charging'
    if (batteryDischarging) return 'Discharging'
    return 'Idle'
  }

  const getGridState = (): string => {
    if (gridImporting) return 'Importing'
    if (gridExporting) return 'Exporting'
    return 'Idle'
  }

  return (
    <div className="space-y-4">
      {/* Solar (if present) */}
      {hasSolar && (
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-yellow-500/20 rounded-full">
              <Sun className="w-9 h-9 text-yellow-400" />
            </div>
            <span className="mt-2 text-sm text-slate-400">Solar</span>
            <span className="font-mono text-xl text-yellow-400 font-bold">
              {formatPower(solarPower)}
            </span>
          </div>
        </div>
      )}

      {/* Main Flow: Grid - House - Battery */}
      <div className="flex items-center justify-between gap-3 px-2 py-4">
        {/* Grid Node */}
        <div className="flex flex-col items-center flex-1">
          <div className={`p-4 rounded-full ${
            gridImporting ? 'bg-purple-500/20' : 
            gridExporting ? 'bg-orange-500/20' : 
            'bg-slate-700/30'
          }`}>
            <Zap className={`w-9 h-9 ${
              gridImporting ? 'text-purple-400' : 
              gridExporting ? 'text-orange-400' : 
              'text-slate-500'
            }`} />
          </div>
          <span className="mt-2 text-sm text-slate-400 font-medium">Grid</span>
          <span className={`font-mono text-xl font-bold ${
            gridImporting ? 'text-purple-400' : 
            gridExporting ? 'text-orange-400' : 
            'text-slate-300'
          }`}>
            {formatPower(gridPower)}
          </span>
          <span className="text-sm text-slate-500">{getGridState()}</span>
          <span className="text-sm text-slate-400 font-mono">
            {gridVoltage > 0 ? `${gridVoltage.toFixed(1)}V` : '-'}
          </span>
        </div>

        {/* Flow Indicator Grid->House */}
        <div className="flex items-center">
          {gridImporting ? (
            <div className="text-purple-400 text-2xl font-bold animate-pulse">→</div>
          ) : gridExporting ? (
            <div className="text-orange-400 text-2xl font-bold animate-pulse">←</div>
          ) : (
            <div className="text-slate-600 text-xl">-</div>
          )}
        </div>

        {/* House Node */}
        <div className="flex flex-col items-center flex-1">
          <div className="p-4 bg-slate-600/30 rounded-full">
            <Home className="w-9 h-9 text-slate-300" />
          </div>
          <span className="mt-2 text-sm text-slate-400 font-medium">House</span>
          <span className="font-mono text-xl font-bold text-slate-200">
            {formatPower(housePower)}
          </span>
          <span className="text-sm text-slate-500">Consuming</span>
        </div>

        {/* Flow Indicator House->Battery */}
        <div className="flex items-center">
          {batteryDischarging ? (
            <div className="text-green-400 text-2xl font-bold animate-pulse">←</div>
          ) : batteryCharging ? (
            <div className="text-blue-400 text-2xl font-bold animate-pulse">→</div>
          ) : (
            <div className="text-slate-600 text-xl">-</div>
          )}
        </div>

        {/* Battery Node */}
        <div className="flex flex-col items-center flex-1">
          <BatteryVertical 
            soc={soc}
            usableCapacity={measurements?.battery_capacity ?? soc}
            charging={batteryCharging}
            discharging={batteryDischarging}
          />
          <span className="mt-2 text-sm text-slate-400">Battery</span>
          <span className={`font-mono text-xl font-bold ${
            soc > 50 ? 'text-green-400' : soc > 20 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(soc)}%
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {batteryVoltage > 0 ? `${batteryVoltage.toFixed(1)}V` : '-'}
          </span>
          <span className="text-xs text-slate-500">{getBatteryState()}</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-lg text-sm mt-4">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Schedule:</span>
          <span className="text-slate-200 font-semibold">{scheduleName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Health:</span>
          <span className={`font-semibold ${soh >= 80 ? 'text-green-400' : soh >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {soh > 0 ? `${Math.round(soh)}%` : '-'}
          </span>
        </div>
        <div className="text-slate-500 hidden sm:block text-xs">
          {measurements?.timestamp ? new Date(measurements.timestamp).toLocaleTimeString() : '-'}
        </div>
      </div>
    </div>
  )
}

