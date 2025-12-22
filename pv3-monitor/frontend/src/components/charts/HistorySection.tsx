import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { TrendingUp, Download, Pause, Play } from 'lucide-react'
import { CollapsibleCard } from '../common/CollapsibleCard'
import { PowerFlowChart } from './PowerFlowChart'
import { SoCChart } from './SoCChart'
import { getMeasurements, getStorageSize, exportToCSV, type MeasurementRecord } from '../../services/db'
import { useSettings } from '../../hooks/useSettings'
import { api } from '../../services/api'
import type { HistoryResolution } from '../../types/measurements'

type TimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'custom'

type TariffConfig = {
  lowRatePerKwhPence: number
  highRatePerKwhPence: number
  exportRatePerKwhPence: number
  standingChargePerDayPence: number
  lowRateStart: string
  lowRateEnd: string
}

const DEFAULT_TARIFF: TariffConfig = {
  lowRatePerKwhPence: 6.67,
  highRatePerKwhPence: 28.22,
  exportRatePerKwhPence: 15.0,
  standingChargePerDayPence: 44.84,
  lowRateStart: '23:30',
  lowRateEnd: '05:30',
}

type DailySummaryData = {
  grid: {
    importKwh: number
    importLowRateKwh: number
    importHighRateKwh: number
    exportKwh: number
  }
  battery: {
    chargeKwh: number
    dischargeKwh: number
    efficiencyPercent: number
  }
  solar: {
    totalKwh: number | null
    gardenRoomKwh: number | null
    loftKwh: number | null
  }
  consumption: {
    houseTotalKwh: number | null
    evChargingKwh: number | null
  }
  costs: {
    importTotal: number
    importLowRate: number
    importHighRate: number
    standingCharge: number
    exportCredit: number
    netCost: number
    savingsVsAllPeak: number
  }
}

type SummaryCardColour = 'red' | 'blue' | 'yellow' | 'green' | 'slate'

function poundsFromPence(pence: number): number {
  return pence / 100
}

function toMinutes(timeHHmm: string): number {
  const [hh, mm] = timeHHmm.split(':').map(v => Number(v))
  return hh * 60 + mm
}

function getMinutesInTimeZone(timestamp: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(timestamp)

  const hourPart = parts.find(p => p.type === 'hour')?.value ?? '0'
  const minutePart = parts.find(p => p.type === 'minute')?.value ?? '0'
  return Number(hourPart) * 60 + Number(minutePart)
}

function isLowRatePeriod(timestamp: Date, tariff: TariffConfig): boolean {
  // Low-rate windows are in UK local time (including DST), not browser/server timezone.
  const timeValue = getMinutesInTimeZone(timestamp, 'Europe/London')
  const start = toMinutes(tariff.lowRateStart)
  const end = toMinutes(tariff.lowRateEnd)

  if (start === end) return false
  if (start < end) return timeValue >= start && timeValue < end
  return timeValue >= start || timeValue < end
}

function formatKwh(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)} kWh`
}

function formatPounds(value: number): string {
  return `£${value.toFixed(2)}`
}

function colourClasses(colour: SummaryCardColour): string {
  if (colour === 'red') return 'border-red-500 bg-red-500/10'
  if (colour === 'blue') return 'border-blue-500 bg-blue-500/10'
  if (colour === 'yellow') return 'border-yellow-500 bg-yellow-500/10'
  if (colour === 'green') return 'border-green-500 bg-green-500/10'
  return 'border-slate-600 bg-slate-700/30'
}

function SummaryCard({
  title,
  colour,
  children,
}: {
  title: string
  colour: SummaryCardColour
  children: ReactNode
}) {
  return (
    <div className={`rounded-lg border-l-4 p-4 ${colourClasses(colour)}`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className ?? ''}`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-100">{value}</span>
    </div>
  )
}

function SummarySubRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 pl-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-300">{value}</span>
    </div>
  )
}

interface HistorySectionProps {
  recordCount: number
  paused: boolean
  onPauseToggle: () => void
}

export function HistorySection({ recordCount, paused, onPauseToggle }: HistorySectionProps) {
  const { settings, loading: settingsLoading } = useSettings()
  const [timeRange, setTimeRange] = useState<TimeRange>('today')
  const [data, setData] = useState<MeasurementRecord[]>([])
  const [storageSize, setStorageSize] = useState(0)
  const [loading, setLoading] = useState(false)
  const isServerMode = settings?.collection_mode === 'server'

  useEffect(() => {
    if (settingsLoading) return
    loadData()
    if (!isServerMode) {
      updateStorageSize()
    }
  }, [timeRange, isServerMode, settingsLoading])

  useEffect(() => {
    if (settingsLoading) return
    if (!isServerMode) {
      loadData()
    }
  }, [recordCount, isServerMode, settingsLoading])

  const getResolution = (range: TimeRange): HistoryResolution => {
    if (range === 'today' || range === 'yesterday') return '1m'
    if (range === '7days') return '15m'
    return '1h'
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const { start, end } = getTimeRangeDate(timeRange)
      
      if (isServerMode) {
        const metrics = [
          'soc',
          'battery_capacity',
          'grid_power',
          'house_power',
          'battery_power',
          'solar_power',
          'aux_power',
          'battery_voltage',
          'grid_voltage',
          'cell_temp_avg',
        ]
        const serverData = await api.getHistoryGrouped(
          'PV001001DEV',
          metrics,
          start,
          end,
          getResolution(timeRange)
        )
        
        // Convert server format to MeasurementRecord format
        const measurements: MeasurementRecord[] = serverData.map(record => ({
          timestamp: new Date(record.timestamp),
          grid_power: record.grid_power ?? 0,
          house_power: record.house_power ?? 0,
          battery_power: record.battery_power ?? 0,
          solar_power: record.solar_power ?? 0,
          aux_power: record.aux_power ?? 0,
          battery_soc: record.battery_soc ?? 0,
          battery_usable: record.battery_usable ?? 0,
          battery_voltage: record.battery_voltage ?? 0,
          grid_voltage: record.grid_voltage ?? 0,
          cell_temp_avg: record.cell_temp_avg,
          cell_temp_max: null,
          cell_temp_min: null,
          bms_temp: null,
        }))
        setData(measurements)
      } else {
        // Fetch from IndexedDB (browser mode)
        const measurements = await getMeasurements(start, end)
        setData(measurements)
      }
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

  const calculateDailySummary = (): DailySummaryData | null => {
    if (data.length < 2) return null

    const tariff = DEFAULT_TARIFF

    let gridImport = 0
    let gridImportLow = 0
    let gridImportHigh = 0
    let gridExport = 0

    let batteryCharge = 0
    let batteryDischarge = 0

    let solarTotal = 0
    let solarAny = false

    let evCharging = 0
    let evAny = false

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i]
      const next = data[i + 1]
      const intervalHours = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60 * 60)
      if (intervalHours <= 0) continue

      const gridPower = current.grid_power
      if (gridPower > 0) {
        const kwh = (gridPower / 1000) * intervalHours
        gridImport += kwh
        if (isLowRatePeriod(current.timestamp, tariff)) {
          gridImportLow += kwh
        } else {
          gridImportHigh += kwh
        }
      } else if (gridPower < 0) {
        gridExport += (Math.abs(gridPower) / 1000) * intervalHours
      }

      const batteryPower = current.battery_power
      if (batteryPower > 0) {
        batteryCharge += (batteryPower / 1000) * intervalHours
      } else if (batteryPower < 0) {
        batteryDischarge += (Math.abs(batteryPower) / 1000) * intervalHours
      }

      const solarPower = current.solar_power ?? 0
      if (solarPower > 0) {
        solarTotal += (solarPower / 1000) * intervalHours
        solarAny = true
      }

      const auxPower = current.aux_power ?? 0
      if (auxPower > 50) {
        evCharging += (auxPower / 1000) * intervalHours
        evAny = true
      }
    }

    const efficiencyPercent = batteryCharge > 0 ? (batteryDischarge / batteryCharge) * 100 : 0

    const importLowRateCost = gridImportLow * poundsFromPence(tariff.lowRatePerKwhPence)
    const importHighRateCost = gridImportHigh * poundsFromPence(tariff.highRatePerKwhPence)
    const standingCharge = poundsFromPence(tariff.standingChargePerDayPence)
    const importTotal = importLowRateCost + importHighRateCost + standingCharge

    const exportCredit = gridExport * poundsFromPence(tariff.exportRatePerKwhPence)
    const netCost = importTotal - exportCredit

    const allPeakCost =
      gridImport * poundsFromPence(tariff.highRatePerKwhPence) + standingCharge
    const savingsVsAllPeak = allPeakCost - importTotal

    const houseTotal =
      gridImport +
      (solarAny ? solarTotal : 0) +
      batteryDischarge -
      gridExport -
      batteryCharge -
      (evAny ? evCharging : 0)

    return {
      grid: {
        importKwh: gridImport,
        importLowRateKwh: gridImportLow,
        importHighRateKwh: gridImportHigh,
        exportKwh: gridExport,
      },
      battery: {
        chargeKwh: batteryCharge,
        dischargeKwh: batteryDischarge,
        efficiencyPercent,
      },
      solar: {
        totalKwh: solarAny ? solarTotal : null,
        gardenRoomKwh: null,
        loftKwh: null,
      },
      consumption: {
        houseTotalKwh: solarAny ? Math.max(0, houseTotal) : null,
        evChargingKwh: evAny ? evCharging : null,
      },
      costs: {
        importTotal,
        importLowRate: importLowRateCost,
        importHighRate: importHighRateCost,
        standingCharge,
        exportCredit,
        netCost,
        savingsVsAllPeak,
      },
    }
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
  const storageText = isServerMode
    ? 'Server mode • live from backend'
    : `${data.length} records • ${(storageSize / 1024 / 1024).toFixed(1)} MB`
  const storageLabel = isServerMode ? storageText : `Storing locally • ${storageText}`

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
                <span className="text-xs text-slate-400">{storageLabel}</span>
              </div>
              <PowerFlowChart data={data} timeRange={timeRange} />
            </div>

            {/* SoC Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Battery State of Charge</h3>
              <SoCChart data={data} timeRange={timeRange} />
            </div>

            {/* Daily Summary */}
            {summary && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Daily Summary</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard title="Grid" colour="red">
                    <SummaryRow label="Import" value={formatKwh(summary.grid.importKwh)} />
                    <SummarySubRow label="Low Rate" value={formatKwh(summary.grid.importLowRateKwh)} />
                    <SummarySubRow label="High Rate" value={formatKwh(summary.grid.importHighRateKwh)} />
                    <SummaryRow
                      className="mt-2"
                      label="Export"
                      value={formatKwh(summary.grid.exportKwh)}
                    />
                  </SummaryCard>

                  <SummaryCard title="Battery" colour="blue">
                    <SummaryRow label="Charge" value={formatKwh(summary.battery.chargeKwh)} />
                    <SummaryRow label="Discharge" value={formatKwh(summary.battery.dischargeKwh)} />
                    <SummaryRow
                      label="Efficiency"
                      value={`${summary.battery.efficiencyPercent.toFixed(0)}%`}
                    />
                  </SummaryCard>

                  <SummaryCard title="Solar" colour="yellow">
                    <SummaryRow label="Generation" value={formatKwh(summary.solar.totalKwh)} />
                    <SummarySubRow label="Garden Room" value={summary.solar.gardenRoomKwh === null ? 'Not tracked' : formatKwh(summary.solar.gardenRoomKwh)} />
                    <SummarySubRow label="Loft" value={summary.solar.loftKwh === null ? 'Not tracked' : formatKwh(summary.solar.loftKwh)} />
                  </SummaryCard>

                  <SummaryCard title="Consumption" colour="green">
                    <SummaryRow label="House Total" value={formatKwh(summary.consumption.houseTotalKwh)} />
                    <SummaryRow label="EV Charging" value={formatKwh(summary.consumption.evChargingKwh)} />
                  </SummaryCard>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h4 className="text-sm font-semibold text-slate-100">Costs</h4>
                    <div className="text-xs text-slate-400">
                      Low: {DEFAULT_TARIFF.lowRatePerKwhPence}p • High: {DEFAULT_TARIFF.highRatePerKwhPence}p • Standing: {DEFAULT_TARIFF.standingChargePerDayPence}p/day
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <div className="text-xs text-slate-400 mb-2">Import Cost</div>
                      <div className="text-2xl font-bold text-red-400">
                        {formatPounds(summary.costs.importTotal)}
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <div className="flex items-center justify-between gap-2">
                          <span>Low Rate ({DEFAULT_TARIFF.lowRatePerKwhPence}p)</span>
                          <span className="text-slate-200">{formatPounds(summary.costs.importLowRate)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>High Rate ({DEFAULT_TARIFF.highRatePerKwhPence}p)</span>
                          <span className="text-slate-200">{formatPounds(summary.costs.importHighRate)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Standing Charge</span>
                          <span className="text-slate-200">{formatPounds(summary.costs.standingCharge)}</span>
                        </div>
                      </div>
                    </div>
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

