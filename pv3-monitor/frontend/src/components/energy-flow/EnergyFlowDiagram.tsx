import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FlowHeader } from './FlowHeader'
import { EnergyLine } from './EnergyLine'
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
  solarPower?: number
  solarGardenRoomPower?: number
  solarLoftPower?: number
  batteryVoltage?: number
  batteryCurrentAmps?: number
  cycleCount?: number
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
  solarPower,
  solarGardenRoomPower,
  solarLoftPower,
  batteryVoltage,
  batteryCurrentAmps,
  cycleCount,
  scheduleName,
  healthPercent,
}: EnergyFlowDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const batteryNodeRef = useRef<SVGGElement | null>(null)
  const batteryTooltipRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 400,
    height: 450,
  })
  const [hoveredNode, setHoveredNode] = useState<'battery' | 'solar' | null>(null)

  const clipIdRaw = useId()
  const clipId = useMemo(() => clipIdRaw.replaceAll(':', '-'), [clipIdRaw])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateDimensions = () => {
      const { width } = element.getBoundingClientRect()
      const w = Math.max(280, Math.round(width))
      const h = Math.round(w * 1.125)
      setDimensions({ width: w, height: h })
    }

    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!batteryNodeRef.current) return
      if (!batteryTooltipRef.current) return
      if (!(event.target instanceof Node)) return

      const isInsideBatteryNode = batteryNodeRef.current.contains(event.target)
      const isInsideTooltip = batteryTooltipRef.current.contains(event.target)
      if (!isInsideBatteryNode && !isInsideTooltip) setHoveredNode(null)
    }

    document.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true } as AddEventListenerOptions)
  }, [])

  const layout = useMemo(() => {
    const { width, height } = dimensions
    const nodeRadius = width * 0.15
    const hubRadius = width * 0.0625
    const hub = { x: width / 2, y: height / 2 }
    const hubDotRadius = 15

    // Ensure top labels (above Grid/Solar) never get clipped.
    // Top label baselines sit at y - nodeRadius - 45.
    // Reduced the previous increase by ~50% to tighten spacing while staying safe.
    const topNodeY = Math.max(height * 0.22, nodeRadius + 66)
    // Ensure bottom labels (below Battery/House) don't clip near the bottom edge.
    const bottomNodeY = Math.min(height * 0.78, height - nodeRadius - 72)

    return {
      width,
      height,
      nodeRadius,
      hubRadius,
      hub,
      grid: { x: width * 0.25, y: topNodeY },
      solar: { x: width * 0.75, y: topNodeY },
      battery: { x: width * 0.25, y: bottomNodeY },
      house: { x: width * 0.75, y: bottomNodeY },
      cornerRadius: Math.round(width * 0.0375),
      lineWidth: Math.max(5, Math.round(width * 0.015)),
      // More gap between dashes so the line reads as "- - - - -" while animating
      dashArray: `${Math.round(width * 0.018)} ${Math.round(width * 0.032)}`,
      hubDotRadius,
      hubGap: Math.max(hubDotRadius + 6, Math.round(width * 0.02)),
      // Separate top/bottom horizontal runs so colours don't overlap near the hub
      hubLaneOffset: Math.max(8, Math.round(width * 0.02)),
    }
  }, [dimensions])

  const houseAbs = Math.abs(housePower)
  const solarPowerUsed =
    solarPower === undefined ? calculateSolarPower(gridPower, houseAbs, batteryPower) : Math.max(0, solarPower)
  const houseRingColour = getHouseColour(solarPowerUsed, batteryPower, gridPower)

  const gridStatus = gridPower > 10 ? 'Importing' : gridPower < -10 ? 'Exporting' : 'Idle'
  const solarStatus = solarPowerUsed > 10 ? 'Generating' : 'Idle'
  // batteryPower: positive = discharging, negative = charging
  const batteryStatus = batteryPower > 10 ? 'Discharging' : batteryPower < -10 ? 'Charging' : 'Idle'
  const houseStatus = houseAbs > 10 ? 'Consuming' : 'Idle'

  const gridDirection = gridPower > 10 ? 'toHub' : gridPower < -10 ? 'fromHub' : 'none'
  const solarDirection = solarPowerUsed > 10 ? 'toHub' : 'none'
  const batteryDirection = batteryPower > 10 ? 'toHub' : batteryPower < -10 ? 'fromHub' : 'none'
  const houseDirection = houseAbs > 10 ? 'fromHub' : 'none'

  const hubYTop = layout.hub.y - layout.hubLaneOffset
  const hubYBottom = layout.hub.y + layout.hubLaneOffset

  const gridPath = `M ${layout.grid.x} ${layout.grid.y + layout.nodeRadius} L ${layout.grid.x} ${
    hubYTop - layout.cornerRadius
  } Q ${layout.grid.x} ${hubYTop} ${layout.grid.x + layout.cornerRadius} ${hubYTop} L ${
    layout.hub.x - layout.hubGap
  } ${hubYTop}`

  const solarPath = `M ${layout.solar.x} ${layout.solar.y + layout.nodeRadius} L ${layout.solar.x} ${
    hubYTop - layout.cornerRadius
  } Q ${layout.solar.x} ${hubYTop} ${layout.solar.x - layout.cornerRadius} ${hubYTop} L ${
    layout.hub.x + layout.hubGap
  } ${hubYTop}`

  const batteryPath = `M ${layout.battery.x} ${layout.battery.y - layout.nodeRadius} L ${layout.battery.x} ${
    hubYBottom + layout.cornerRadius
  } Q ${layout.battery.x} ${hubYBottom} ${layout.battery.x + layout.cornerRadius} ${hubYBottom} L ${
    layout.hub.x - layout.hubGap
  } ${hubYBottom}`

  const housePath = `M ${layout.house.x} ${layout.house.y - layout.nodeRadius} L ${layout.house.x} ${
    hubYBottom + layout.cornerRadius
  } Q ${layout.house.x} ${hubYBottom} ${layout.house.x - layout.cornerRadius} ${hubYBottom} L ${
    layout.hub.x + layout.hubGap
  } ${hubYBottom}`

  const socClamped = Math.max(0, Math.min(100, socPercent))
  const fillHeight = (socClamped / 100) * (layout.nodeRadius * 1.6)
  const fillY = layout.battery.y + layout.nodeRadius * 0.8 - fillHeight
  const batteryFillColour = socClamped > 60 ? '#22c55e' : socClamped > 30 ? '#eab308' : '#ef4444'

  const formatKw = (power: number) => `${(Math.abs(power) / 1000).toFixed(1)} kW`

  const solarTotalKw = formatKw(solarPowerUsed)
  const solarGardenKw =
    solarGardenRoomPower === undefined ? '—' : formatKw(Math.max(0, solarGardenRoomPower))
  const solarLoftKw = solarLoftPower === undefined ? '—' : formatKw(Math.max(0, solarLoftPower))

  const tooltipLeft = Math.min(Math.max(8, layout.battery.x - 110), layout.width - 220 - 8)
  const tooltipTop = Math.max(8, layout.battery.y - layout.nodeRadius - 130)
  const solarTooltipLeft = Math.min(Math.max(8, layout.solar.x - 110), layout.width - 220 - 8)
  const solarTooltipTop = Math.max(8, layout.solar.y - layout.nodeRadius - 130)

  return (
    <div className="space-y-4">
      <style>
        {`
@keyframes pv3FlowToHub { from { stroke-dashoffset: 18; } to { stroke-dashoffset: 0; } }
@keyframes pv3FlowFromHub { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 18; } }
@media (prefers-reduced-motion: reduce) {
  .pv3-flow-line { animation: none !important; }
}
        `}
      </style>

      <FlowHeader socPercent={socPercent} />

      <div className="flex items-center justify-between text-sm text-slate-300">
        <div>
          <span className="text-slate-500">Schedule:</span>{' '}
          <span className="font-semibold">{scheduleName}</span>
        </div>
        <div>
          <span className="text-slate-500">Health:</span>{' '}
          <span className="font-semibold">
            {healthPercent === undefined ? '-' : `${Math.round(healthPercent)}%`}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="w-full max-w-lg mx-auto relative">
        {hoveredNode === 'battery' && (
          <div
            ref={batteryTooltipRef}
            className="absolute z-20 bg-slate-900 rounded-lg p-3 text-sm text-white shadow-xl border border-slate-700"
            style={{ left: tooltipLeft, top: tooltipTop, width: 220 }}
          >
            <div className="font-semibold text-blue-400 mb-2">Battery Details</div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-slate-400">SOC:</span>
              <span className="text-right">{Math.round(socClamped)}%</span>
              <span className="text-slate-400">Voltage:</span>
              <span className="text-right">
                {batteryVoltage === undefined ? '-' : `${batteryVoltage.toFixed(1)}V`}
              </span>
              <span className="text-slate-400">Health:</span>
              <span className="text-right">
                {healthPercent === undefined ? '-' : `${Math.round(healthPercent)}%`}
              </span>
              <span className="text-slate-400">Cycles:</span>
              <span className="text-right">
                {cycleCount === undefined ? '-' : Math.round(cycleCount).toString()}
              </span>
              <span className="text-slate-400">Current:</span>
              <span className="text-right">
                {batteryCurrentAmps === undefined ? '-' : `${batteryCurrentAmps.toFixed(1)}A`}
              </span>
              <span className="text-slate-400">Status:</span>
              <span className="text-right">{batteryStatus}</span>
            </div>
          </div>
        )}

        {hoveredNode === 'solar' && (
          <div
            className="absolute z-20 bg-slate-900 rounded-lg p-3 text-sm text-white shadow-xl border border-slate-700"
            style={{ left: solarTooltipLeft, top: solarTooltipTop, width: 220 }}
          >
            <div className="font-semibold text-yellow-400 mb-2">Solar</div>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-slate-400">Total:</span>
              <span className="text-right">{solarTotalKw}</span>
              <span className="text-slate-400">Garden Room:</span>
              <span className="text-right">{solarGardenKw}</span>
              <span className="text-slate-400">Loft:</span>
              <span className="text-right">{solarLoftKw}</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
        >
          <defs>
            <clipPath id={`${clipId}-battery`}>
              <circle cx={layout.battery.x} cy={layout.battery.y} r={layout.nodeRadius - 4} />
            </clipPath>
          </defs>

          <g>
            <EnergyLine
              path={gridPath}
              colour={GRID_COLOUR}
              powerWatts={gridPower}
              direction={gridDirection}
              strokeWidth={layout.lineWidth}
              dashArray={layout.dashArray}
            />
            <EnergyLine
              path={solarPath}
              colour={SOLAR_COLOUR}
              powerWatts={solarPowerUsed}
              direction={solarDirection}
              strokeWidth={layout.lineWidth}
              dashArray={layout.dashArray}
            />
            <EnergyLine
              path={batteryPath}
              colour={BATTERY_COLOUR}
              powerWatts={batteryPower}
              direction={batteryDirection}
              strokeWidth={layout.lineWidth}
              dashArray={layout.dashArray}
            />
            <EnergyLine
              path={housePath}
              colour={HOUSE_COLOUR}
              powerWatts={houseAbs}
              direction={houseDirection}
              strokeWidth={layout.lineWidth}
              dashArray={layout.dashArray}
            />
          </g>

          {/* Hub dot */}
          <circle cx={layout.hub.x} cy={layout.hub.y} r={layout.hubDotRadius} fill="#d1d5db" />

          {/* Grid */}
          <g>
            <circle
              cx={layout.grid.x}
              cy={layout.grid.y}
              r={layout.nodeRadius}
              fill="#f3f4f6"
              stroke={GRID_COLOUR}
              strokeWidth={4}
              style={{
                filter:
                  Math.abs(gridPower) > 10
                    ? `drop-shadow(0 0 10px ${GRID_COLOUR}) drop-shadow(0 0 20px ${GRID_COLOUR}66)`
                    : 'none',
              }}
            />
            <GridIcon title="Grid" x={layout.grid.x - 20} y={layout.grid.y - 30} size={40} />
            <text x={layout.grid.x} y={layout.grid.y + 25} textAnchor="middle" fontSize={20} fontWeight={600} fill="#374151">
              {formatKw(gridPower)}
            </text>
            <text
              x={layout.grid.x}
              // Match bottom spacing by mirroring offsets above the circle:
              // bottom label uses +25/+45, so top uses -45/-25.
              y={layout.grid.y - layout.nodeRadius - 45}
              textAnchor="middle"
              fontSize={14}
              fontWeight={500}
              fill="#d1d5db"
            >
              Grid
            </text>
            <text
              x={layout.grid.x}
              y={layout.grid.y - layout.nodeRadius - 25}
              textAnchor="middle"
              fontSize={12}
              fill={GRID_COLOUR}
            >
              {gridStatus}
            </text>
            {/* Grid voltage intentionally omitted */}
          </g>

          {/* Solar */}
          <g
            onPointerEnter={() => setHoveredNode('solar')}
            onPointerLeave={() => setHoveredNode(null)}
            onPointerDown={() =>
              setHoveredNode((prev: 'battery' | 'solar' | null) => (prev === 'solar' ? null : 'solar'))
            }
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={layout.solar.x}
              cy={layout.solar.y}
              r={layout.nodeRadius}
              fill="#f3f4f6"
              stroke={SOLAR_COLOUR}
              strokeWidth={4}
              style={{
                filter:
                  Math.abs(solarPowerUsed) > 10
                    ? `drop-shadow(0 0 10px ${SOLAR_COLOUR}) drop-shadow(0 0 20px ${SOLAR_COLOUR}66)`
                    : 'none',
              }}
            />
            <SolarIcon title="Solar" x={layout.solar.x - 20} y={layout.solar.y - 30} size={40} />
            <text x={layout.solar.x} y={layout.solar.y + 25} textAnchor="middle" fontSize={20} fontWeight={600} fill="#374151">
              {formatKw(solarPowerUsed)}
            </text>
            <text
              x={layout.solar.x}
              y={layout.solar.y - layout.nodeRadius - 45}
              textAnchor="middle"
              fontSize={14}
              fontWeight={500}
              fill="#d1d5db"
            >
              Solar
            </text>
            <text
              x={layout.solar.x}
              y={layout.solar.y - layout.nodeRadius - 25}
              textAnchor="middle"
              fontSize={12}
              fill={SOLAR_COLOUR}
            >
              {solarStatus}
            </text>
          </g>

          {/* Battery */}
          <g
            ref={batteryNodeRef}
            onPointerEnter={() => setHoveredNode('battery')}
            onPointerLeave={() => setHoveredNode(null)}
            onPointerDown={() =>
              setHoveredNode((prev: 'battery' | 'solar' | null) => (prev === 'battery' ? null : 'battery'))
            }
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={layout.battery.x}
              cy={layout.battery.y}
              r={layout.nodeRadius}
              fill="#f3f4f6"
              stroke={BATTERY_COLOUR}
              strokeWidth={4}
              style={{
                filter:
                  Math.abs(batteryPower) > 10
                    ? `drop-shadow(0 0 10px ${BATTERY_COLOUR}) drop-shadow(0 0 20px ${BATTERY_COLOUR}66)`
                    : 'none',
              }}
            />
            <rect
              x={layout.battery.x - layout.nodeRadius + 4}
              y={fillY}
              width={(layout.nodeRadius - 4) * 2}
              height={fillHeight}
              fill={batteryFillColour}
              opacity={0.3}
              clipPath={`url(#${clipId}-battery)`}
            />
            <BatteryIcon title="Battery" x={layout.battery.x - 20} y={layout.battery.y - 30} size={40} />
            <text x={layout.battery.x} y={layout.battery.y + 25} textAnchor="middle" fontSize={20} fontWeight={600} fill="#374151">
              {formatKw(batteryPower)}
            </text>
            <text x={layout.battery.x} y={layout.battery.y + layout.nodeRadius + 25} textAnchor="middle" fontSize={14} fontWeight={500} fill="#d1d5db">
              Battery
            </text>
            <text x={layout.battery.x} y={layout.battery.y + layout.nodeRadius + 45} textAnchor="middle" fontSize={12} fill={BATTERY_COLOUR}>
              {batteryStatus}
            </text>
            {batteryVoltage !== undefined && batteryVoltage > 0 && (
              <text x={layout.battery.x} y={layout.battery.y + layout.nodeRadius + 63} textAnchor="middle" fontSize={12} fill="#9ca3af">
                {batteryVoltage.toFixed(1)}V
              </text>
            )}

            {/* Tooltip is rendered as an HTML overlay above the SVG (better mobile support + no clipping). */}
          </g>

          {/* House */}
          <g>
            <circle
              cx={layout.house.x}
              cy={layout.house.y}
              r={layout.nodeRadius}
              fill="#f3f4f6"
              stroke={houseRingColour}
              strokeWidth={4}
              style={{
                filter:
                  houseAbs > 10
                    ? `drop-shadow(0 0 10px ${houseRingColour}) drop-shadow(0 0 20px ${houseRingColour}66)`
                    : 'none',
              }}
            />
            <HouseIcon title="House" x={layout.house.x - 20} y={layout.house.y - 30} size={40} />
            <text x={layout.house.x} y={layout.house.y + 25} textAnchor="middle" fontSize={20} fontWeight={600} fill="#374151">
              {formatKw(houseAbs)}
            </text>
            <text x={layout.house.x} y={layout.house.y + layout.nodeRadius + 25} textAnchor="middle" fontSize={14} fontWeight={500} fill="#d1d5db">
              House
            </text>
            <text x={layout.house.x} y={layout.house.y + layout.nodeRadius + 45} textAnchor="middle" fontSize={12} fill={HOUSE_COLOUR}>
              {houseStatus}
            </text>
          </g>
        </svg>
      </div>
    </div>
  )
}


