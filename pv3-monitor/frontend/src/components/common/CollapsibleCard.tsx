import { useState, type ReactNode } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface CollapsibleCardProps {
  icon: ReactNode
  title: string
  summary: string
  children: ReactNode
  defaultExpanded?: boolean
  alertLevel?: 'normal' | 'warning' | 'error'
}

export function CollapsibleCard({ 
  icon, 
  title, 
  summary, 
  children, 
  defaultExpanded = false,
  alertLevel = 'normal'
}: CollapsibleCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const borderClass = {
    normal: '',
    warning: 'border-yellow-500/50 bg-yellow-900/10',
    error: 'border-red-500/50 bg-red-900/10',
  }[alertLevel]

  return (
    <div className={`card ${borderClass}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            {icon}
            <h2 className="card-title whitespace-nowrap">{title}</h2>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-slate-400 text-right">{summary}</span>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
          </div>
        </div>
      </button>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  )
}

