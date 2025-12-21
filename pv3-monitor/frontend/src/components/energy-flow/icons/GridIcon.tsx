type IconProps = {
  title: string
}

export function GridIcon({ title }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="#374151" strokeWidth="2" aria-hidden="true">
      <title>{title}</title>
      <path d="M20 4 L20 36" />
      <path d="M10 8 L30 8" />
      <path d="M8 16 L32 16" />
      <path d="M12 8 L8 16" />
      <path d="M28 8 L32 16" />
      <path d="M8 16 L14 36" />
      <path d="M32 16 L26 36" />
      <path d="M6 24 L34 24" />
      <path d="M14 16 L17 24" />
      <path d="M26 16 L23 24" />
    </svg>
  )
}


