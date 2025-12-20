export interface WebSocketMessage {
  type: 'MEASUREMENT_UPDATE' | 'ALARM_UPDATE' | 'SCHEDULE_UPDATE' | 'CONNECTION_STATUS' | 'heartbeat'
  device_id?: string
  timestamp?: string
  data?: Record<string, unknown>
  alarm_name?: string
  is_active?: boolean
}

