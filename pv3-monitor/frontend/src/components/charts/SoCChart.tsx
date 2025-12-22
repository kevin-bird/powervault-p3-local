import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ComposedChart,
} from 'recharts'
import type { MeasurementRecord } from '../../services/db'

interface SoCChartProps {
  data: MeasurementRecord[]
  timeRange?: string
  start?: Date
  end?: Date
}

function formatUkTime(ms: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms))
}

export function SoCChart({ data, timeRange = 'today', start, end }: SoCChartProps) {
  const chartData = data.map(record => ({
    timestamp: record.timestamp.getTime(),
    soc: record.battery_soc,
    usable: record.battery_usable ?? record.battery_soc,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Collecting data... Check back in a few minutes</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#eab308" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="timestamp"
          type="number"
          domain={[
            start ? start.getTime() : 'dataMin',
            end ? end.getTime() : 'dataMax',
          ]}
          scale="time"
          tickFormatter={formatUkTime}
          stroke="#9ca3af" 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          domain={[0, 100]}
          stroke="#9ca3af" 
          style={{ fontSize: '12px' }}
          label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #475569',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#e2e8f0' }}
          labelFormatter={(value) => formatUkTime(Number(value))}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="line"
        />
        <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
        <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
        <Area
          type="monotone"
          dataKey="soc"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#socGradient)"
          name="Total SoC"
        />
        <Line
          type="monotone"
          dataKey="usable"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Usable Capacity"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

