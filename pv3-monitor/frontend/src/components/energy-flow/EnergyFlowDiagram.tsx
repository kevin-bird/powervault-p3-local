import { FlowHeader } from './FlowHeader'
import { CentralHub } from './CentralHub'
import { EnergyLine } from './EnergyLine'
import { EnergyNode } from './EnergyNode'
import { BatteryIcon } from './icons/BatteryIcon'
import { GridIcon } from './icons/GridIcon'
import { HouseIcon } from './icons/HouseIcon'
import { SolarIcon } from './icons/SolarIcon'
import { calculateSolarPower } from './utils/calculateSolar'
import { getHouseColour } from './utils/getHouseColour'

type EnergyFlowDiagramProps = {
  socPercent: number
  gridPower: number
  batteryPower: number
  housePower: number
  gridVoltage?: number
  batteryVoltage?: number
  scheduleName: string
  healthPercent?: number
}

const GRID_COLOUR = '#ef4444'
const SOLAR_COLOUR = '#eab308'
const BATTERY_COLOUR = '#3b82f6'
const HOUSE_COLOUR = '#22c55e'

export function EnergyFlowDiagram({
  socPercent,
  gridPower,
  batteryPower,
  housePower,
  scheduleName,
  healthPercent,
}: EnergyFlowDiagramProps) {
  const solarPower = calculateSolarPower(gridPower, housePower, batteryPower)
  const houseRingColour = getHouseColour(solarPower, batteryPower, gridPower)

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  const containerSize = isMobile ? 300 : 400
  const nodeSize = isMobile ? 90 : 120
  const hubSize = isMobile ? 40 : 50

  const svgSize = containerSize
  const scale = svgSize / 400

  const gridDirection = gridPower > 0 ? 'toHub' : gridPower < 0 ? 'fromHub' : 'none'
  const solarDirection = solarPower > 0 ? 'toHub' : 'none'
  const batteryDirection =
    batteryPower < 0 ? 'toHub' : batteryPower > 0 ? 'fromHub' : 'none'
  const houseDirection = housePower > 0 ? 'fromHub' : 'none'

  return (
    <div className="space-y-4">
      <style>
        {`
@keyframes pv3FlowToHub { from { stroke-dashoffset: 18; } to { stroke-dashoffset: 0; } }
@keyframes pv3FlowFromHub { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 18; } }
@media (prefers-reduced-motion: reduce) {
  path { animation: none !important; }
}
        `}
      </style>

      <FlowHeader socPercent={socPercent} />

      <div className="flex items-center justify-between text-sm text-slate-300">
        <div>
          <span className="text-slate-500">Schedule:</span> <span className="font-semibold">{scheduleName}</span>
        </div>
        <div>
          <span className="text-slate-500">Health:</span>{' '}
          <span className="font-semibold">{healthPercent === undefined ? '-' : `${Math.round(healthPercent)}%`}</span>
        </div>
      </div>

      <div className="mx-auto relative" style={{ width: containerSize, height: containerSize }}>
        {/* Lines */}
        <svg
          viewBox="0 0 400 400"
          width={svgSize}
          height={svgSize}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <g transform={`scale(${scale})`}>
            <EnergyLine
              path="M 70 150 Q 70 200 175 200"
              colour={GRID_COLOUR}
              powerWatts={gridPower}
              direction={gridDirection}
            />
            <EnergyLine
              path="M 330 150 Q 330 200 225 200"
              colour={SOLAR_COLOUR}
              powerWatts={solarPower}
              direction={solarDirection}
            />
            <EnergyLine
              path="M 70 250 Q 70 200 175 200"
              colour={BATTERY_COLOUR}
              powerWatts={batteryPower}
              direction={batteryDirection}
            />
            <EnergyLine
              path="M 330 250 Q 330 200 225 200"
              colour={HOUSE_COLOUR}
              powerWatts={housePower}
              direction={houseDirection}
            />
          </g>
        </svg>

        {/* Nodes + Hub (absolute positioned to match geometry) */}
        <div className="absolute" style={{ left: 70 * scale - nodeSize / 2, top: 90 * scale - nodeSize / 2 }}>
          <EnergyNode
            label="Grid"
            colour={GRID_COLOUR}
            powerWatts={gridPower}
            sizePx={nodeSize}
            icon={<GridIcon title="Grid" />}
          />
        </div>

        <div className="absolute" style={{ left: 330 * scale - nodeSize / 2, top: 90 * scale - nodeSize / 2 }}>
          <EnergyNode
            label="Solar"
            colour={SOLAR_COLOUR}
            powerWatts={solarPower}
            sizePx={nodeSize}
            icon={<SolarIcon title="Solar" />}
          />
        </div>

        <div className="absolute" style={{ left: 70 * scale - nodeSize / 2, top: 310 * scale - nodeSize / 2 }}>
          <EnergyNode
            label="Battery"
            colour={BATTERY_COLOUR}
            powerWatts={batteryPower}
            sizePx={nodeSize}
            icon={<BatteryIcon title="Battery" />}
          />
        </div>

        <div className="absolute" style={{ left: 330 * scale - nodeSize / 2, top: 310 * scale - nodeSize / 2 }}>
          <EnergyNode
            label="House"
            colour={HOUSE_COLOUR}
            ringOverrideColour={houseRingColour}
            powerWatts={housePower}
            sizePx={nodeSize}
            icon={<HouseIcon title="House" />}
          />
        </div>

        <div
          className="absolute"
          style={{ left: 200 * scale - hubSize / 2, top: 200 * scale - hubSize / 2 }}
        >
          <CentralHub sizePx={hubSize} />
        </div>
      </div>
    </div>
  )
}


