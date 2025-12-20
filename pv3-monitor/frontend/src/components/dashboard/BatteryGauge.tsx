interface BatteryGaugeProps {
  soc: number
  soh: number | null
}

export function BatteryGauge({ soc, soh }: BatteryGaugeProps) {
  // Determine color based on SoC level
  const getColor = (level: number): string => {
    if (level >= 50) return '#22c55e' // green
    if (level >= 20) return '#eab308' // yellow
    return '#ef4444' // red
  }

  const color = getColor(soc)
  const clampedSoc = Math.max(0, Math.min(100, soc))

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Battery Visual */}
      <div className="relative">
        {/* Battery Body */}
        <div className="w-32 h-56 border-4 border-slate-500 rounded-lg relative overflow-hidden bg-slate-800">
          {/* Fill Level */}
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out"
            style={{ 
              height: `${clampedSoc}%`,
              backgroundColor: color,
              opacity: 0.8,
            }}
          />
          
          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-4xl font-bold font-mono"
              style={{ color }}
            >
              {Math.round(soc)}%
            </span>
          </div>
        </div>
        
        {/* Battery Cap */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-slate-500 rounded-t-lg" />
      </div>

      {/* Labels */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-slate-200">State of Charge</p>
        {soh !== null && (
          <p className="text-sm text-slate-400">
            Health: <span className="font-mono text-slate-300">{soh}%</span>
          </p>
        )}
      </div>
    </div>
  )
}

