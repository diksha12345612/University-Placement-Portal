// Circular progress ring drawn with SVG. The coloured arc shows value / max.
const ScoreRing = ({ value = 0, max = 100, size = 64, stroke = 7, color = '#2563eb', children }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const filled = Math.max(0, Math.min(1, value / max)) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* rotate so the arc starts at the top, like a clock */}
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export default ScoreRing
