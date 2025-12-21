const GRID_COLOUR = '#ef4444'
const SOLAR_COLOUR = '#eab308'
const BATTERY_COLOUR = '#3b82f6'
const MIXED_COLOUR = '#22c55e'

export function getHouseColour(solarPower: number, batteryPower: number, gridPower: number): string {
  const solarContribution = Math.max(0, solarPower)
  const batteryContribution = Math.max(0, -batteryPower)
  const gridContribution = Math.max(0, gridPower)

  const total = solarContribution + batteryContribution + gridContribution
  if (total === 0) return MIXED_COLOUR

  const sources = [
    { value: solarContribution, colour: SOLAR_COLOUR },
    { value: batteryContribution, colour: BATTERY_COLOUR },
    { value: gridContribution, colour: GRID_COLOUR },
  ].sort((a, b) => b.value - a.value)

  const dominant = sources[0]
  if (dominant.value / total > 0.7) return dominant.colour
  return MIXED_COLOUR
}


