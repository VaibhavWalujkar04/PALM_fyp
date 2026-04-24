const GAZE_MAP = {
  on_screen:   { icon: '👁', label: 'Focused',       color: 'var(--palm-mint)',  dotColor: '#5CC8A8' },
  off_screen:  { icon: '👀', label: 'Looking Away',  color: 'var(--palm-amber)', dotColor: '#F0A845' },
  closed_eyes: { icon: '😴', label: 'Eyes Closed',   color: 'var(--palm-coral)', dotColor: '#F07070' },
  unknown:     { icon: '❓', label: 'Unknown',        color: 'var(--palm-text-muted)', dotColor: '#999' },
}

export default function GazeIndicator({ gaze = 'unknown' }) {
  const info = GAZE_MAP[gaze] || GAZE_MAP.unknown

  return (
    <div
      className="inline-flex items-center gap-2 text-xs font-medium"
      aria-label={`Gaze status: ${info.label}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: info.dotColor }}
      />
      <span>{info.icon}</span>
      <span style={{ color: info.color }}>{info.label}</span>
    </div>
  )
}
