type IconProps = {
  title: string
}

export function BatteryIcon({ title }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#374151" strokeWidth="2" aria-hidden="true">
      <title>{title}</title>
      <rect x="10" y="8" width="20" height="28" rx="2" />
      <rect x="15" y="4" width="10" height="4" />
    </svg>
  )
}


