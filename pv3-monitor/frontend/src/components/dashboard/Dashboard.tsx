import { BatteryGauge } from './BatteryGauge'
import { MetricCard } from '../common/MetricCard'
import { PowerFlowSimple } from './PowerFlowSimple'
import { BatteryHealthDetailCard } from './BatteryHealthDetailCard'
import { TemperatureCard } from './TemperatureCard'
import { PowerLimitsCard } from './PowerLimitsCard'
import { EPSStatusCard } from './EPSStatusCard'
import { AlarmsCard } from './AlarmsCard'
import { GridStatusCard } from './GridStatusCard'
import type { CurrentMeasurements } from '../../types/measurements'

interface DashboardProps {
  deviceId: string
  measurements: CurrentMeasurements | null
  loading: boolean
}

export function Dashboard({ measurements, loading }: DashboardProps) {
  if (loading && !measurements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const scheduleEventNames: Record<number, string> = {
    0: 'Idle',
    1: 'Charge',
    2: 'Discharge',
    3: 'Force Charge',
    4: 'Force Discharge',
    5: 'Event 5',
    6: 'Event 6',
    7: 'Event 7',
    8: 'Disabled',
  }

  const scheduleEvent = measurements?.schedule_event ?? null
  const scheduleName = scheduleEvent !== null 
    ? scheduleEventNames[Math.round(scheduleEvent)] ?? `Event ${Math.round(scheduleEvent)}`
    : '-'

  return (
    <div className="space-y-6">
      {/* Top Row: Battery Gauge + Power Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battery Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Battery Status</h2>
          </div>
          <BatteryGauge 
            soc={measurements?.soc ?? 0}
            soh={measurements?.soh ?? null}
          />
        </div>

        {/* Power Flow */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">Power Flow</h2>
          </div>
          <PowerFlowSimple
            gridPower={measurements?.grid_power ?? 0}
            housePower={measurements?.house_power ?? 0}
            batteryPower={measurements?.battery_power ?? 0}
            solarPower={measurements?.solar_power ?? 0}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="State of Charge"
          value={measurements?.soc ?? null}
          unit="%"
          colorClass="text-battery-green"
        />
        <MetricCard
          label="Battery Voltage"
          value={measurements?.battery_voltage ?? null}
          unit="V"
          decimals={1}
        />
        <MetricCard
          label="Battery Current"
          value={measurements?.battery_current ?? null}
          unit="A"
          decimals={2}
        />
        <MetricCard
          label="Grid Power"
          value={measurements?.grid_power ?? null}
          unit="W"
          decimals={0}
          colorClass={
            (measurements?.grid_power ?? 0) > 0 
              ? 'text-grid-import' 
              : 'text-grid-export'
          }
        />
        <MetricCard
          label="House Power"
          value={measurements?.house_power ?? null}
          unit="W"
          decimals={0}
        />
        <MetricCard
          label="Schedule"
          value={scheduleName}
          unit=""
        />
      </div>

      {/* Alarms Banner */}
      <AlarmsCard activeCount={0} alarmList={[]} />

      {/* Detailed Metrics - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Battery Health Details */}
        <BatteryHealthDetailCard measurements={measurements} />
        
        {/* Temperatures */}
        <TemperatureCard measurements={measurements} />
        
        {/* Power Limits */}
        <PowerLimitsCard measurements={measurements} />
        
        {/* Grid Status */}
        <GridStatusCard measurements={measurements} />
        
        {/* EPS Status */}
        <EPSStatusCard measurements={measurements} />

        {/* Schedule */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Schedule</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="metric-label">Current Event</span>
              <span className="font-mono">{scheduleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="metric-label">Setpoint</span>
              <span className="font-mono">{measurements?.schedule_setpoint ?? '-'} W</span>
            </div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      {measurements?.timestamp && (
        <div className="text-center text-sm text-slate-500">
          Last updated: {new Date(measurements.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}

