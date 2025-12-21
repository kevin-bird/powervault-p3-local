import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'

interface AlarmsCollapsibleProps {
  activeCount: number
  alarmList: string[]
  allAlarms: Record<string, boolean>
}

const ALARM_LABELS: Record<string, string> = {
  fan_lock: 'Fan Lock',
  battery_low: 'Battery Low',
  overload: 'Overload',
  over_temperature: 'Over Temperature',
  battery_weak: 'Battery Weak',
  battery_under: 'Battery Under',
  no_battery: 'No Battery',
  battery_discharge_low: 'Battery Discharge Low',
  pv_loss: 'PV Loss',
  pv1_loss: 'PV1 Loss',
  pv2_loss: 'PV2 Loss',
  pv_low: 'PV Low',
  grid_voltage_over: 'Grid Voltage Over',
  grid_voltage_under: 'Grid Voltage Under',
  grid_ip_voltage_outofrange: 'Grid Voltage Out of Range',
  grid_freq_over: 'Grid Freq Over',
  grid_freq_under: 'Grid Freq Under',
  grid_ip_freq_outofrange: 'Grid Freq Out of Range',
  ground_loss: 'Ground Loss',
  islanding_detect: 'Islanding Detect',
  initial_fail: 'Initial Fail',
  external_flash_fail: 'External Flash Fail',
  feeding_av_voltage_over: 'Feeding Voltage Over',
}

export function AlarmsCollapsible({ activeCount, alarmList, allAlarms }: AlarmsCollapsibleProps) {
  const getSummary = (): string => {
    if (activeCount === 0) return 'All systems normal'
    return `${activeCount} active alarm${activeCount > 1 ? 's' : ''}`
  }

  const iconColor = activeCount > 0 ? 'text-red-500' : 'text-green-500'
  const alertLevel = activeCount > 0 ? 'error' : 'normal'

  return (
    <CollapsibleCard
      icon={<AlertCircle className={`w-5 h-5 ${iconColor}`} />}
      title="Alarms & Warnings"
      summary={getSummary()}
      alertLevel={alertLevel}
      defaultExpanded={activeCount > 0}
    >
      <div className="space-y-3">
        {/* Active Alarms Summary */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-700">
            {alarmList.map((alarm) => (
              <span 
                key={alarm}
                className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300"
              >
                {alarm}
              </span>
            ))}
          </div>
        )}
        
        {/* Full Alarm Checklist - Always Visible */}
        {Object.keys(allAlarms).length > 0 ? (
          <div>
            {activeCount === 0 && (
              <p className="text-sm text-green-400 mb-3">All systems normal</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(ALARM_LABELS).map(([key, label]) => {
                const isActive = allAlarms[key] === true
                return (
                  <div key={key} className="flex items-center gap-2">
                    {isActive ? (
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-green-500/50 flex-shrink-0" />
                    )}
                    <span className={isActive ? 'text-red-300' : 'text-slate-500'}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading alarm data...</p>
        )}
      </div>
    </CollapsibleCard>
  )
}

