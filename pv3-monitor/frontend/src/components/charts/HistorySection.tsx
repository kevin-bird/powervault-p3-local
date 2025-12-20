import { useState, useEffect } from 'react'
import { TrendingUp, Download, Pause, Play } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import { PowerFlowChart } from './PowerFlowChart'
import { SoCChart } from './SoCChart'
import { getMeasurements, getStorageSize, exportToCSV, type MeasurementRecord } from '../../services/db'

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom'

interface HistorySectionProps {
  recordCount: number
  paused: boolean
  onPauseToggle: () => void
}

export function HistorySection({ recordCount, paused, onPauseToggle }: HistorySectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('today')
  const [data, setData] = useState<MeasurementRecord[]>([])
  const [storageSize, setStorageSize] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    updateStorageSize()
  }, [timeRange, recordCount])

  const loadData = async () => {
    setLoading(true)
    try {
      const { start, end } = getTimeRangeDate(timeRange)
      const measurements = await getMeasurements(start, end)
      setData(measurements)
    } catch (err) {
      console.error('Failed to load historical data:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStorageSize = async () => {
    const size = await getStorageSize()
    setStorageSize(size)
  }

  const getTimeRangeDate = (range: TimeRange): { start: Date; end: Date } => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'today':
        return { start: today, end: now }
      case 'yesterday':
        return {
          start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
          end: today,
        }
      case '7days':
        return {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
        }
      case '30days':
        return {
          start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
        }
      default:
        return { start: today, end: now }
    }
  }

  const calculateDailySummary = () => {
    if (data.length === 0) return null

    let gridImport = 0
    let gridExport = 0
    let batteryCharge = 0
    let batteryDischarge = 0

    // Calculate energy by integrating power over time
    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i]
      const next = data[i + 1]
      const intervalHours = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60 * 60)

      if (current.grid_power > 0) {
        gridImport += (current.grid_power / 1000) * intervalHours
      } else {
        gridExport += Math.abs(current.grid_power / 1000) * intervalHours
      }

      if (current.battery_power > 0) {
        batteryDischarge += (current.battery_power / 1000) * intervalHours
      } else {
        batteryCharge += Math.abs(current.battery_power / 1000) * intervalHours
      }
    }

    return { gridImport, gridExport, batteryCharge, batteryDischarge }
  }

  const handleExport = async () => {
    const { start, end } = getTimeRangeDate(timeRange)
    const csv = await exportToCSV(start, end)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pv3-history-${timeRange}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const summary = calculateDailySummary()
  const storageText = `${data.length} records • ${(storageSize / 1024 / 1024).toFixed(1)} MB`

  return (
    <CollapsibleCard
      icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}
      title="History"
      summary={`Last ${timeRange === 'today' ? '24h' : timeRange === '7days' ? '7 days' : timeRange === '30days' ? '30 days' : timeRange}`}
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Time Range Selector + Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(['today', 'yesterday', '7days', '30days'] as TimeRange[]).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : range === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
          
          {/* Pause/Export Buttons */}
          <button
            type="button"
            onClick={onPauseToggle}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300"
            title={paused ? 'Resume data capture' : 'Pause data capture'}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Power Flow Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Power Flow</h3>
                <span className="text-xs text-slate-400">Storing locally • {storageText}</span>
              </div>
              <PowerFlowChart data={data} timeRange={timeRange} />
            </div>

            {/* SoC Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Battery State of Charge</h3>
              <SoCChart data={data} />
            </div>

            {/* Daily Summary */}
            {summary && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Daily Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Grid Import</p>
                    <p className="text-lg font-mono font-semibold text-purple-400">
                      {summary.gridImport.toFixed(1)} kWh
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Grid Export</p>
                    <p className="text-lg font-mono font-semibold text-orange-400">
                      {summary.gridExport.toFixed(1)} kWh
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Battery Charge</p>
                    <p className="text-lg font-mono font-semibold text-blue-400">
                      {summary.batteryCharge.toFixed(1)} kWh
                    </p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Battery Discharge</p>
                    <p className="text-lg font-mono font-semibold text-green-400">
                      {summary.batteryDischarge.toFixed(1)} kWh
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

