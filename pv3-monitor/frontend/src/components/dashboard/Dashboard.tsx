import { EnergyFlowDiagram } from '../energy-flow/EnergyFlowDiagram'
import { AlarmsCollapsible } from './AlarmsCollapsible'
import { BatteryStatusCollapsible } from './BatteryStatusCollapsible'
import { BatteryHealthCollapsible } from './BatteryHealthCollapsible'
import { TemperatureCollapsible } from './TemperatureCollapsible'
import { PowerLimitsCollapsible } from './PowerLimitsCollapsible'
import { InverterDetailsCollapsible } from './InverterDetailsCollapsible'
import { HistorySection } from '../charts/HistorySection'
import { useAlarms } from '../../hooks/useAlarms'
import type { CurrentMeasurements } from '../../types/measurements'

interface DashboardProps {
  deviceId: string
  measurements: CurrentMeasurements | null
  loading: boolean
  recordCount: number
  capturePaused: boolean
  onPauseToggle: () => void
}

export function Dashboard({ deviceId, measurements, loading, recordCount, capturePaused, onPauseToggle }: DashboardProps) {
  const { alarmStatus } = useAlarms(deviceId)
  
  if (loading && !measurements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const scheduleEventNames: Record<number, string> = {
    0: 'Normal',
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

  const gridPower = measurements?.grid_power ?? 0
  const batteryPower = measurements?.house_power ?? 0 // PV3 MQTT house_power is battery charge rate (positive charging)
  const housePower = Math.max(0, gridPower - batteryPower) // consumption as positive watts
  const socPercent = measurements?.soc ?? 0

  return (
    <div className="space-y-4">
      {/* Hero: Enhanced Power Flow */}
      <div className="card">
        <EnergyFlowDiagram
          socPercent={socPercent}
          gridPower={gridPower}
          batteryPower={batteryPower}
          housePower={housePower}
          scheduleName={scheduleName}
          healthPercent={measurements?.soh ?? undefined}
          gridVoltage={measurements?.grid_voltage ?? undefined}
          batteryVoltage={measurements?.battery_voltage ?? undefined}
        />
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {/* History Charts - Second item, default open */}
        <HistorySection 
          recordCount={recordCount}
          paused={capturePaused}
          onPauseToggle={onPauseToggle}
        />
        
        {/* Alarms */}
        <AlarmsCollapsible 
          activeCount={alarmStatus?.active_count ?? 0}
          alarmList={alarmStatus?.active_alarms ?? []}
          allAlarms={alarmStatus?.all_alarms ?? {}}
        />
        
        {/* Battery Status */}
        <BatteryStatusCollapsible measurements={measurements} />
        
        {/* Battery Health */}
        <BatteryHealthCollapsible measurements={measurements} />
        
        {/* Temperatures */}
        <TemperatureCollapsible measurements={measurements} />
        
        {/* Power Limits */}
        <PowerLimitsCollapsible measurements={measurements} />
        
        {/* Inverter Details */}
        <InverterDetailsCollapsible measurements={measurements} />
      </div>
    </div>
  )
}

