import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface AlarmsCardProps {
  activeCount: number
  alarmList: string[]
}

export function AlarmsCard({ activeCount, alarmList }: AlarmsCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`card ${activeCount > 0 ? 'border-red-500/50 bg-red-900/10' : ''}`}>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-5 h-5 ${activeCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
          <h2 className="card-title">Alarms</h2>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      
      {activeCount === 0 ? (
        <p className="text-sm text-green-400">All systems normal</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-red-400 font-semibold">
            {activeCount} active alarm{activeCount > 1 ? 's' : ''}
          </p>
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
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Full Alarm List</p>
          <p className="text-sm text-slate-400">
            Detailed alarm monitoring will be added in a future update
          </p>
        </div>
      )}
    </div>
  )
}

