import { Home, Zap, Battery, Sun } from 'lucide-react'

interface PowerFlowSimpleProps {
  gridPower: number
  housePower: number
  batteryPower: number
  solarPower: number
}

export function PowerFlowSimple({ 
  gridPower, 
  housePower, 
  batteryPower, 
  solarPower 
}: PowerFlowSimpleProps) {
  const formatPower = (watts: number): string => {
    const absWatts = Math.abs(watts)
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(2)} kW`
    }
    return `${Math.round(absWatts)} W`
  }

  // Determine flow directions
  const gridImporting = gridPower > 50
  const gridExporting = gridPower < -50
  const batteryCharging = batteryPower < -50
  const batteryDischarging = batteryPower > 50
  const hasSolar = solarPower > 50

  return (
    <div className="flex flex-col items-center py-6">
      {/* Solar (if present) */}
      {hasSolar && (
        <div className="mb-6">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <Sun className="w-8 h-8 text-yellow-400" />
            </div>
            <span className="mt-2 text-sm text-slate-400">Solar</span>
            <span className="font-mono text-lg text-yellow-400">
              {formatPower(solarPower)}
            </span>
          </div>
        </div>
      )}

      {/* Main Row: Grid - House - Battery */}
      <div className="flex items-center justify-center gap-8 w-full">
        {/* Grid */}
        <div className="flex flex-col items-center">
          <div className={`p-3 rounded-full ${
            gridImporting ? 'bg-purple-500/20' : 
            gridExporting ? 'bg-orange-500/20' : 
            'bg-slate-700/50'
          }`}>
            <Zap className={`w-8 h-8 ${
              gridImporting ? 'text-purple-400' : 
              gridExporting ? 'text-orange-400' : 
              'text-slate-400'
            }`} />
          </div>
          <span className="mt-2 text-sm text-slate-400">Grid</span>
          <span className={`font-mono text-lg ${
            gridImporting ? 'text-purple-400' : 
            gridExporting ? 'text-orange-400' : 
            'text-slate-300'
          }`}>
            {gridImporting && '+'}{formatPower(gridPower)}
          </span>
          <span className="text-xs text-slate-500">
            {gridImporting ? 'Importing' : gridExporting ? 'Exporting' : 'Idle'}
          </span>
        </div>

        {/* Flow Arrows */}
        <div className="flex flex-col gap-2">
          {gridImporting && (
            <div className="text-purple-400">→→→</div>
          )}
          {gridExporting && (
            <div className="text-orange-400">←←←</div>
          )}
          {!gridImporting && !gridExporting && (
            <div className="text-slate-600">---</div>
          )}
        </div>

        {/* House */}
        <div className="flex flex-col items-center">
          <div className="p-3 bg-slate-600/30 rounded-full">
            <Home className="w-8 h-8 text-slate-300" />
          </div>
          <span className="mt-2 text-sm text-slate-400">House</span>
          <span className="font-mono text-lg text-slate-200">
            {formatPower(housePower)}
          </span>
          <span className="text-xs text-slate-500">Consuming</span>
        </div>

        {/* Flow Arrows */}
        <div className="flex flex-col gap-2">
          {batteryDischarging && (
            <div className="text-green-400">←←←</div>
          )}
          {batteryCharging && (
            <div className="text-blue-400">→→→</div>
          )}
          {!batteryDischarging && !batteryCharging && (
            <div className="text-slate-600">---</div>
          )}
        </div>

        {/* Battery */}
        <div className="flex flex-col items-center">
          <div className={`p-3 rounded-full ${
            batteryDischarging ? 'bg-green-500/20' : 
            batteryCharging ? 'bg-blue-500/20' : 
            'bg-slate-700/50'
          }`}>
            <Battery className={`w-8 h-8 ${
              batteryDischarging ? 'text-green-400' : 
              batteryCharging ? 'text-blue-400' : 
              'text-slate-400'
            }`} />
          </div>
          <span className="mt-2 text-sm text-slate-400">Battery</span>
          <span className={`font-mono text-lg ${
            batteryDischarging ? 'text-green-400' : 
            batteryCharging ? 'text-blue-400' : 
            'text-slate-300'
          }`}>
            {formatPower(batteryPower)}
          </span>
          <span className="text-xs text-slate-500">
            {batteryDischarging ? 'Discharging' : batteryCharging ? 'Charging' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  )
}

