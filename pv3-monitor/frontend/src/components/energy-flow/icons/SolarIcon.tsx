type IconProps = {
  title: string
}

export function SolarIcon({ title }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#374151" strokeWidth="2" aria-hidden="true">
      <title>{title}</title>
      <circle cx="20" cy="20" r="8" />
      <line x1="20" y1="4" x2="20" y2="9" />
      <line x1="20" y1="31" x2="20" y2="36" />
      <line x1="4" y1="20" x2="9" y2="20" />
      <line x1="31" y1="20" x2="36" y2="20" />
      <line x1="8.5" y1="8.5" x2="12" y2="12" />
      <line x1="28" y1="28" x2="31.5" y2="31.5" />
      <line x1="31.5" y1="8.5" x2="28" y2="12" />
      <line x1="12" y1="28" x2="8.5" y2="31.5" />
    </svg>
  )
}


