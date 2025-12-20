import { AlertCircle } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'

interface AlarmsCollapsibleProps {
  activeCount: number
  alarmList: string[]
}

export function AlarmsCollapsible({ activeCount, alarmList }: AlarmsCollapsibleProps) {
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
      {activeCount === 0 ? (
        <p className="text-sm text-green-400">No active alarms</p>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {alarmList.map((alarm) => (
              <span 
                key={alarm}
                className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-300"
              >
                {alarm}
              </span>
            ))}
          </div>
        </div>
      )}
    </CollapsibleCard>
  )
}

