export interface CurrentMeasurements {
  device_id: string
  timestamp: string
  
  // Battery State
  soc: number | null
  battery_voltage: number | null
  battery_current: number | null
  battery_current_total: number | null
  battery_capacity: number | null
  battery_power: number | null
  
  // Battery Health
  soh: number | null
  soh_min: number | null
  cycle_count_avg: number | null
  cycle_count_max: number | null
  cell_voltage_max: number | null
  cell_voltage_min: number | null
  module_voltage_avg: number | null
  
  // Temperatures
  cell_temp_avg: number | null
  cell_temp_max: number | null
  cell_temp_min: number | null
  bms_temp_avg: number | null
  bms_temp_max: number | null
  inverter_temp: number | null
  boost_temp: number | null
  inner_temp: number | null
  
  // Power Flow
  grid_power: number | null
  house_power: number | null
  solar_power: number | null
  aux_power: number | null
  solar_garden_room_power?: number | null
  solar_loft_power?: number | null
  
  // Grid
  grid_voltage: number | null
  grid_frequency: number | null
  
  // Limits
  max_charge_power: number | null
  max_discharge_power: number | null
  charge_voltage_limit: number | null
  discharge_voltage_limit: number | null
  charge_current_limit: number | null
  discharge_current_limit: number | null
  
  // Schedule
  schedule_event: number | null
  schedule_setpoint: number | null
  
  // EPS
  eps_reserve: number | null
  eps_mode: number | null
}

export interface MeasurementHistory {
  id: number
  device_id: string
  timestamp: string
  metric_name: string
  metric_value: number
  unit: string | null
  source_topic: string | null
}

export type HistoryResolution = '1m' | '15m' | '1h'

export type GroupedHistoryRecord = {
  timestamp: string
  grid_power: number | null
  house_power: number | null
  battery_power: number | null
  solar_power: number | null
  aux_power: number | null
  battery_soc: number | null
  battery_usable: number | null
  battery_voltage: number | null
  grid_voltage: number | null
  cell_temp_avg: number | null
}

