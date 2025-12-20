interface MetricCardProps {
  label: string
  value: number | string | null
  unit?: string
  decimals?: number
  colorClass?: string
}

export function MetricCard({ 
  label, 
  value, 
  unit = '', 
  decimals = 0,
  colorClass = 'text-slate-100'
}: MetricCardProps) {
  const formatValue = (val: number | string | null): string => {
    if (val === null) return '-'
    if (typeof val === 'string') return val
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
  }

  return (
    <div className="card">
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${colorClass}`}>
        {formatValue(value)}
        {unit && <span className="metric-unit">{unit}</span>}
      </p>
    </div>
  )
}

