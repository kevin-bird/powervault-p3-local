import type { Device } from '../types/device'
import type {
  CurrentMeasurements,
  GroupedHistoryRecord,
  HistoryResolution,
  MeasurementHistory,
} from '../types/measurements'
import type { AlarmStatus } from '../types/alarm'

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.6:8800'

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return this.request('/api/devices')
  }

  async getDevice(deviceId: string): Promise<Device> {
    return this.request(`/api/devices/${deviceId}`)
  }

  // Measurements
  async getCurrentMeasurements(deviceId: string): Promise<CurrentMeasurements> {
    return this.request(`/api/devices/${deviceId}/current`)
  }

  async getHistory(
    deviceId: string,
    metrics: string[],
    start: Date,
    end: Date
  ): Promise<MeasurementHistory[]> {
    const params = new URLSearchParams({
      metrics: metrics.join(','),
      start: start.toISOString(),
      end: end.toISOString(),
    })
    return this.request(`/api/devices/${deviceId}/history?${params}`)
  }

  async getHistoryGrouped(
    deviceId: string,
    metrics: string[],
    start: Date,
    end: Date,
    resolution: HistoryResolution
  ): Promise<GroupedHistoryRecord[]> {
    const params = new URLSearchParams({
      metrics: metrics.join(','),
      start: start.toISOString(),
      end: end.toISOString(),
      resolution,
    })
    return this.request(`/api/devices/${deviceId}/history/grouped?${params}`)
  }

  // Alarms
  async getAlarmStatus(deviceId: string): Promise<AlarmStatus> {
    return this.request(`/api/devices/${deviceId}/alarms`)
  }
}

export const api = new ApiService(API_URL)

