import { Battery, Wifi, WifiOff } from 'lucide-react'

interface HeaderProps {
  deviceId: string
  connected: boolean
}

export function Header({ deviceId, connected }: HeaderProps) {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Battery className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">PV3 Monitor</h1>
              <p className="text-xs text-slate-400">Powervault Battery Dashboard</p>
            </div>
          </div>

          {/* Device Info and Status */}
          <div className="flex items-center gap-6">
            {/* Device Selector (simplified for single device) */}
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">Device</p>
              <p className="text-sm font-mono text-slate-200">{deviceId}</p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

