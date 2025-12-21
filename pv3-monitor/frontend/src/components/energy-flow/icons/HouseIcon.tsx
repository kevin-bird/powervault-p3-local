type IconProps = {
  title: string
}

export function HouseIcon({ title }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#374151" strokeWidth="2" aria-hidden="true">
      <title>{title}</title>
      <path d="M4 18 L20 6 L36 18" />
      <rect x="8" y="18" width="24" height="18" />
      <rect x="16" y="24" width="8" height="12" />
    </svg>
  )
}


