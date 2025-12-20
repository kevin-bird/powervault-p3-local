export interface AlarmStatus {
  device_id: string
  active_count: number
  active_alarms: string[]
  all_alarms: Record<string, boolean>
  updated_at: string
}

export interface AlarmEvent {
  id: number
  device_id: string
  timestamp: string
  alarm_name: string
  event_type: 'triggered' | 'cleared'
}

