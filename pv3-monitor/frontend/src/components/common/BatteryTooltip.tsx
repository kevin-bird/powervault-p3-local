import { useState, useRef, useEffect } from 'react'

interface BatteryTooltipProps {
  soc: number
  usableCapacity: number
  voltage: number
  current: number
  state: string
  children: React.ReactNode
}

export function BatteryTooltip({ 
  soc, 
  usableCapacity, 
  voltage, 
  current, 
  state, 
  children 
}: BatteryTooltipProps) {
  const [show, setShow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShow(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [show])

  const reserved = soc - usableCapacity

  return (
    <div 
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => {
        e.stopPropagation()
        setShow(!show)
      }}
    >
      {children}
      
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-28 z-50 pointer-events-none">
          <div className="bg-slate-900 border border-slate-600 rounded-lg shadow-xl p-3 min-w-[140px]">
            <div className="text-xs font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-1">
              Battery Status
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">SoC:</span>
                <span className="font-mono text-slate-200 font-semibold">{soc.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-green-400">Usable:</span>
                <span className="font-mono text-green-400">{usableCapacity.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-orange-400">Reserved:</span>
                <span className="font-mono text-orange-400">{reserved.toFixed(0)}%</span>
              </div>
              <div className="border-t border-slate-700 my-1" />
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Voltage:</span>
                <span className="font-mono text-slate-200">{voltage.toFixed(1)}V</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Current:</span>
                <span className="font-mono text-slate-200">{current.toFixed(1)}A</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">State:</span>
                <span className="font-mono text-cyan-400">{state}</span>
              </div>
            </div>
            {/* Triangle pointer */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-600" />
          </div>
        </div>
      )}
    </div>
  )
}

