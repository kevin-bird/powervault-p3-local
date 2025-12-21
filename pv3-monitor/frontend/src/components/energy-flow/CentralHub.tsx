type CentralHubProps = {
  sizePx: number
}

export function CentralHub({ sizePx }: CentralHubProps) {
  return (
    <div
      className="rounded-full"
      style={{
        width: sizePx,
        height: sizePx,
        background: '#d1d5db',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)',
      }}
    />
  )
}


