const EMOTION_MAP = {
  happy:      { emoji: '😊', label: 'Happy',      className: 'emotion-happy' },
  confident:  { emoji: '😊', label: 'Confident',  className: 'emotion-confident' },
  neutral:    { emoji: '😐', label: 'Neutral',     className: 'emotion-neutral' },
  confused:   { emoji: '😕', label: 'Confused',    className: 'emotion-confused' },
  bored:      { emoji: '😴', label: 'Bored',       className: 'emotion-bored' },
  frustrated: { emoji: '😤', label: 'Frustrated',  className: 'emotion-frustrated' },
  sad:        { emoji: '😢', label: 'Sad',          className: 'emotion-sad' },
  angry:      { emoji: '😠', label: 'Angry',        className: 'emotion-angry' },
  unknown:    { emoji: '❓', label: 'Unknown',      className: 'emotion-neutral' },
}

export default function EmotionBadge({ emotion = 'neutral' }) {
  const info = EMOTION_MAP[emotion] || EMOTION_MAP.neutral

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${info.className}`}
      aria-label={`Current emotion: ${info.label}`}
    >
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </div>
  )
}
