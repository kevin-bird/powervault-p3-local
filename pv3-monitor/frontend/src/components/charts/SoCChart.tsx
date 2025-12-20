import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { MeasurementRecord } from '../../services/db'

interface SoCChartProps {
  data: MeasurementRecord[]
}

export function SoCChart({ data }: SoCChartProps) {
  const chartData = data.map(record => ({
    time: record.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    soc: record.battery_soc,
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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
            <stop offset="50%" stopColor="#eab308" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
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
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'SoC']}
        />
        <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
        <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
        <Area
          type="monotone"
          dataKey="soc"
          stroke="#22c55e"
          fill="url(#socGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

