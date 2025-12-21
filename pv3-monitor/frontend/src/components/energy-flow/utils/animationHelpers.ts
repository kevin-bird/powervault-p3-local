export function getAnimationDurationSeconds(powerWatts: number): number {
  const absPower = Math.abs(powerWatts)
  if (absPower < 50) return 3.0
  if (absPower < 200) return 2.0
  if (absPower < 500) return 1.2
  if (absPower < 1000) return 0.8
  if (absPower < 2000) return 0.5
  return 0.3
}

export function getLineOpacity(powerWatts: number): number {
  const absPower = Math.abs(powerWatts)
  if (absPower < 10) return 0.15
  if (absPower < 50) return 0.3
  if (absPower < 200) return 0.5
  if (absPower < 500) return 0.7
  return 1.0
}


