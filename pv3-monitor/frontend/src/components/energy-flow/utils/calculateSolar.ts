export function calculateSolarPower(
  gridPower: number,
  housePower: number,
  batteryPower: number
): number {
  const gridExport = Math.max(0, -gridPower)
  const gridImport = Math.max(0, gridPower)
  const batteryCharge = Math.max(0, batteryPower)
  const batteryDischarge = Math.max(0, -batteryPower)

  const solar = housePower + gridExport + batteryCharge - gridImport - batteryDischarge
  return Math.max(0, Math.round(solar))
}


