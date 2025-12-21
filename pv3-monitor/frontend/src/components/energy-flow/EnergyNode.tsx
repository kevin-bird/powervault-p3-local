import type { ReactNode } from 'react'

type EnergyNodeProps = {
  label: string
  colour: string
  powerWatts: number
  icon: ReactNode
  sizePx: number
  ringOverrideColour?: string
}

function formatKilowatts(powerWatts: number): string {
  return `${(Math.abs(powerWatts) / 1000).toFixed(1)} kW`
}

export function EnergyNode({
  label,
  colour,
  powerWatts,
  icon,
  sizePx,
  ringOverrideColour,
}: EnergyNodeProps) {
  const ringColour = ringOverrideColour ?? colour

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="absolute"
        style={{
          width: sizePx,
          height: sizePx,
          filter: `drop-shadow(0 0 8px ${ringColour}66) drop-shadow(0 0 16px ${ringColour}66)`,
        }}
      />

      <div
        className="relative flex flex-col items-center justify-center rounded-full"
        style={{
          width: sizePx,
          height: sizePx,
          border: `4px solid ${ringColour}`,
          background: '#f3f4f6',
        }}
      >
        <div className="flex items-center justify-center" style={{ width: 40, height: 40 }}>
          {icon}
        </div>
        <div className="mt-2 text-lg font-semibold text-slate-700">{formatKilowatts(powerWatts)}</div>
      </div>

      <div className="mt-2 text-sm font-medium text-slate-300">{label}</div>
    </div>
  )
}


