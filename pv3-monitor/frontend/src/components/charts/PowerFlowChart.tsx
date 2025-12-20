import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MeasurementRecord } from '../../services/db'

interface PowerFlowChartProps {
  data: MeasurementRecord[]
  timeRange?: string
}

export function PowerFlowChart({ data, timeRange = 'today' }: PowerFlowChartProps) {
  // For "today", fill missing hours with zero values
  const fillTodayData = (records: MeasurementRecord[]) => {
    if (timeRange !== 'today' || records.length === 0) {
      return records
    }

    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const filled: MeasurementRecord[] = []
    
    // Create hourly slots from midnight to now
    for (let hour = 0; hour <= now.getHours(); hour++) {
      const slotTime = new Date(midnight.getTime() + hour * 60 * 60 * 1000)
      const existing = records.find(r => r.timestamp.getHours() === hour)
      
      if (existing) {
        filled.push(existing)
      } else {
        // Fill with zero values for missing hours
        filled.push({
          timestamp: slotTime,
          grid_power: 0,
          house_power: 0,
          battery_power: 0,
          battery_soc: 0,
          battery_voltage: 0,
          grid_voltage: 0,
          cell_temp_avg: null,
          cell_temp_max: null,
          cell_temp_min: null,
          bms_temp: null,
        })
      }
    }
    
    return filled
  }

  const filledData = fillTodayData(data)
  
  // Transform data for stacked area chart
  const chartData = filledData.map(record => ({
    time: record.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    timestamp: record.timestamp,
    gridImport: record.grid_power > 0 ? record.grid_power / 1000 : 0,
    gridExport: record.grid_power < 0 ? Math.abs(record.grid_power) / 1000 : 0,
    batteryDischarge: record.battery_power > 0 ? record.battery_power / 1000 : 0,
    batteryCharge: record.battery_power < 0 ? Math.abs(record.battery_power) / 1000 : 0,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Collecting data... Check back in a few minutes</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="time" 
          stroke="#9ca3af" 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#9ca3af" 
          style={{ fontSize: '12px' }}
          label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1e293b', 
            border: '1px solid #475569',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="square"
        />
        <Area
          type="monotone"
          dataKey="gridImport"
          stackId="1"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.6}
          name="Grid Import"
        />
        <Area
          type="monotone"
          dataKey="batteryDischarge"
          stackId="1"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.6}
          name="Battery Discharge"
        />
        <Area
          type="monotone"
          dataKey="batteryCharge"
          stackId="2"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.4}
          name="Battery Charge"
        />
        <Area
          type="monotone"
          dataKey="gridExport"
          stackId="2"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.4}
          name="Grid Export"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

