import { Battery, Settings } from 'lucide-react'

interface HeaderProps {
  deviceId: string
  connected: boolean
}

export function Header({ deviceId, connected }: HeaderProps) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-green-500" />
            <h1 className="text-lg font-semibold text-slate-100">PV3 Monitor</h1>
          </div>

          {/* Status and Settings */}
          <div className="flex items-center gap-3">
            {/* Connection Status Dot */}
            <div className="flex items-center gap-1.5">
              <div className={`status-dot ${connected ? 'status-online' : 'status-offline'}`} />
              <span className="text-xs text-slate-400 hidden sm:inline">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Settings Icon */}
            <button
              type="button"
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

