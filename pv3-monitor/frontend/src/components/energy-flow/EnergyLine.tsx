import { getAnimationDurationSeconds, getLineOpacity } from './utils/animationHelpers'

type EnergyLineProps = {
  path: string
  colour: string
  powerWatts: number
  direction: 'toHub' | 'fromHub' | 'none'
}

export function EnergyLine({ path, colour, powerWatts, direction }: EnergyLineProps) {
  const absPower = Math.abs(powerWatts)
  const active = absPower >= 10 && direction !== 'none'
  const opacity = getLineOpacity(powerWatts)
  const duration = getAnimationDurationSeconds(powerWatts)

  const animationName =
    !active ? 'none' : direction === 'toHub' ? 'pv3FlowToHub' : 'pv3FlowFromHub'

  return (
    <path
      d={path}
      fill="none"
      stroke={colour}
      strokeWidth={6}
      strokeDasharray="12 6"
      strokeLinecap="round"
      style={{
        opacity,
        animationName,
        animationDuration: `${duration}s`,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      }}
    />
  )
}


