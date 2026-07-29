"use client"

import { useId } from "react"

/* Smooth line chart used in the greeting card */
export function LineChart({
  className,
  strokeWidth = 2.5,
}: {
  className?: string
  strokeWidth?: number
}) {
  const id = useId()
  // Normalized points across a 300 x 100 viewBox
  const points = [8, 34, 20, 46, 30, 58, 44, 40, 66, 30, 52, 62, 40, 24]
  const width = 300
  const height = 100
  const step = width / (points.length - 1)
  const coords = points.map((v, i) => [i * step, height - (v / 70) * height])

  const path = coords.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`
    const [px, py] = coords[i - 1]
    const cx = (px + x) / 2
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`
  }, "")

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Weekly focus trend line chart"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#fill-${id})`} />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" opacity={i === coords.length - 1 ? 1 : 0} />
      ))}
    </svg>
  )
}

/* Gentle wave line used in the mood card */
export function WaveLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 80"
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Mood trend wave"
    >
      <path
        d="M 0,50 C 40,50 45,20 80,20 C 115,20 120,55 155,55 C 195,55 200,25 240,25 C 275,25 280,42 300,42"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* Circular progress ring */
export function Ring({
  value,
  size = 150,
  stroke = 12,
  trackClassName = "text-muted",
  progressClassName = "text-foreground",
  children,
}: {
  value: number
  size?: number
  stroke?: number
  trackClassName?: string
  progressClassName?: string
  children?: React.ReactNode
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={progressClassName}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/* Vertical bar chart used in weekly activity */
export function BarChart({
  data,
  labels,
  highlight,
}: {
  data: number[]
  labels: string[]
  highlight?: number
}) {
  const max = Math.max(...data)
  return (
    <div className="flex h-40 items-stretch justify-between gap-2">
      {data.map((v, i) => {
        const isActive = i === highlight
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={`w-2.5 rounded-full transition-all ${
                  isActive ? "bg-foreground" : "bg-muted-foreground/35"
                }`}
                style={{ height: `${(v / max) * 100}%` }}
              />
            </div>
            <span className={`text-xs ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
