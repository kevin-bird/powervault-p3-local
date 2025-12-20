export interface Device {
  id: number
  device_id: string
  name: string | null
  capacity_kwh: number | null
  created_at: string
  last_seen_at: string
}

