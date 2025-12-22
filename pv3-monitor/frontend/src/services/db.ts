import Dexie, { type EntityTable } from 'dexie'

export interface MeasurementRecord {
  id?: number
  timestamp: Date
  grid_power: number
  house_power: number
  battery_power: number
  solar_power?: number
  aux_power?: number
  solar_garden_room_power?: number
  solar_loft_power?: number
  battery_soc: number
  battery_usable: number
  battery_voltage: number
  grid_voltage: number
  cell_temp_avg: number | null
  cell_temp_max: number | null
  cell_temp_min: number | null
  bms_temp: number | null
}

export interface HourlyAggregate {
  id?: number
  timestamp: Date
  grid_power_avg: number
  house_power_avg: number
  battery_power_avg: number
  battery_soc_avg: number
  grid_import_kwh: number
  grid_export_kwh: number
  battery_charge_kwh: number
  battery_discharge_kwh: number
}

const db = new Dexie('PV3Monitor') as Dexie & {
  measurements: EntityTable<MeasurementRecord, 'id'>
  hourly: EntityTable<HourlyAggregate, 'id'>
}

db.version(1).stores({
  measurements: '++id, timestamp',
  hourly: '++id, timestamp',
})

export { db }

// Data management functions
export async function addMeasurement(data: Omit<MeasurementRecord, 'id'>): Promise<void> {
  await db.measurements.add(data)
}

export async function getMeasurements(
  start: Date,
  end: Date
): Promise<MeasurementRecord[]> {
  return db.measurements
    .where('timestamp')
    .between(start, end, true, true)
    .toArray()
}

export async function cleanupOldData(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Delete minute-level data older than 7 days
  await db.measurements.where('timestamp').below(sevenDaysAgo).delete()

  // Delete hourly data older than 30 days
  await db.hourly.where('timestamp').below(thirtyDaysAgo).delete()
}

export async function getStorageSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return estimate.usage ?? 0
  }
  return 0
}

export async function exportToCSV(
  start: Date,
  end: Date
): Promise<string> {
  const data = await getMeasurements(start, end)
  
  const headers = [
    'timestamp',
    'grid_power',
    'house_power',
    'battery_power',
    'battery_soc',
    'battery_voltage',
    'grid_voltage',
    'cell_temp_avg',
  ]
  
  const rows = data.map(row => [
    row.timestamp.toISOString(),
    row.grid_power,
    row.house_power,
    row.battery_power,
    row.battery_soc,
    row.battery_voltage,
    row.grid_voltage,
    row.cell_temp_avg ?? '',
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')
  
  return csv
}

