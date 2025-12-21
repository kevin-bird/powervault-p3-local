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
}

export function SoCChart({ data, timeRange = 'today' }: SoCChartProps) {
  // For "today", add midnight point to extend chart to start of day
  const fillTodayData = (records: MeasurementRecord[]) => {
    if (timeRange !== 'today' || records.length === 0) {
      return records
    }

    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const firstRecord = records[0]
    
    // If first record is after midnight, add midnight point
    if (firstRecord.timestamp > midnight) {
      const midnightPoint: MeasurementRecord = {
        timestamp: midnight,
        grid_power: 0,
        house_power: 0,
        battery_power: 0,
        battery_soc: firstRecord.battery_soc, // Use first known SoC
        battery_voltage: firstRecord.battery_voltage,
        grid_voltage: 0,
        cell_temp_avg: null,
        cell_temp_max: null,
        cell_temp_min: null,
        bms_temp: null,
      }
      return [midnightPoint, ...records]
    }
    
    return records
  }

  const filledData = fillTodayData(data)
  
  const chartData = filledData.map(record => ({
    time: record.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
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
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
          labelFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
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

