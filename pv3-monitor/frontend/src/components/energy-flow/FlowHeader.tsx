type FlowHeaderProps = {
  socPercent: number
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function FlowHeader({ socPercent }: FlowHeaderProps) {
  const clamped = clampPercent(socPercent)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-white text-xl leading-none">
          <span aria-hidden="true">⏻</span>
        </div>
        <div className="leading-tight">
          <div className="text-[28px] font-semibold text-slate-100">Live View</div>
          <div className="text-sm text-slate-400">Live data from your Powervault</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold text-teal-400">{Math.round(clamped)}%</div>
        <div className="relative h-6 w-9 rounded border-2 border-teal-400">
          <div className="absolute -top-1 right-1 h-1 w-2 rounded-sm bg-teal-400" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-teal-400"
            style={{ height: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  )
}


