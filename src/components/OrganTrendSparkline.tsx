import { useId } from 'react'
import type { OrganTrendDirection } from '../features/health/HealthContext'

type OrganTrendSparklinePoint = {
  score: number
}

type OrganTrendSparklineProps = {
  points: OrganTrendSparklinePoint[]
  direction: OrganTrendDirection
  className?: string
  height?: number
  showArea?: boolean
  showGrid?: boolean
  showEndpoint?: boolean
  strokeWidth?: number
}

const VIEWBOX_WIDTH = 100
const PLOT_PADDING = 6

const DIRECTION_PALETTE: Record<
  OrganTrendDirection,
  { stroke: string; fill: string; guide: string; dot: string }
> = {
  improving: {
    stroke: '#059669',
    fill: '#059669',
    guide: '#d1fae5',
    dot: '#10b981',
  },
  flat: {
    stroke: '#64748b',
    fill: '#94a3b8',
    guide: '#e2e8f0',
    dot: '#64748b',
  },
  strained: {
    stroke: '#e11d48',
    fill: '#fb7185',
    guide: '#ffe4e6',
    dot: '#f43f5e',
  },
}

function buildCoordinates(points: OrganTrendSparklinePoint[], height: number) {
  const scores = points.map((point) => point.score)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const scoreRange = Math.max(maxScore - minScore, 4)
  const paddedMin = minScore - scoreRange * 0.18
  const paddedMax = maxScore + scoreRange * 0.18
  const plotHeight = height - PLOT_PADDING * 2

  return points.map((point, index) => {
    const x =
      points.length === 1 ? VIEWBOX_WIDTH / 2 : (index / (points.length - 1)) * VIEWBOX_WIDTH
    const yRatio = (point.score - paddedMin) / (paddedMax - paddedMin)
    const y = height - PLOT_PADDING - yRatio * plotHeight

    return {
      x,
      y,
    }
  })
}

function buildLinePath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

function buildAreaPath(points: { x: number; y: number }[], height: number) {
  if (points.length === 0) {
    return ''
  }

  const baseline = height - PLOT_PADDING
  const first = points[0]
  const last = points[points.length - 1]

  return `${buildLinePath(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

export default function OrganTrendSparkline({
  points,
  direction,
  className,
  height = 56,
  showArea = false,
  showGrid = true,
  showEndpoint = true,
  strokeWidth = 2.5,
}: OrganTrendSparklineProps) {
  const gradientId = useId()

  if (points.length === 0) {
    return null
  }

  const palette = DIRECTION_PALETTE[direction]
  const coordinates = buildCoordinates(points, height)
  const linePath = buildLinePath(coordinates)
  const areaPath = buildAreaPath(coordinates, height)
  const endPoint = coordinates[coordinates.length - 1]

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      className={className}
      role="img"
      aria-label={`Organ trend ${direction}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.fill} stopOpacity="0.26" />
          <stop offset="100%" stopColor={palette.fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {showGrid
        ? [0.2, 0.5, 0.8].map((offset) => (
            <line
              key={offset}
              x1="0"
              y1={PLOT_PADDING + (height - PLOT_PADDING * 2) * offset}
              x2={VIEWBOX_WIDTH}
              y2={PLOT_PADDING + (height - PLOT_PADDING * 2) * offset}
              stroke={palette.guide}
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          ))
        : null}

      {showArea ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}

      <path
        d={linePath}
        fill="none"
        stroke={palette.stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showEndpoint && endPoint ? (
        <>
          <circle cx={endPoint.x} cy={endPoint.y} r="4" fill="white" />
          <circle cx={endPoint.x} cy={endPoint.y} r="2.5" fill={palette.dot} />
        </>
      ) : null}
    </svg>
  )
}
