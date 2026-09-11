import { useMemo } from 'react'
import { CELLS } from '../game/board'
import { makeLayout } from '../game/geometry'
import type { BoardVariant, CellState, GameState } from '../game/types'

interface HexBoardProps {
  state: GameState
  variant: BoardVariant
  onSelect: (hexId: number) => void
  interactive: boolean
  pendingHexId: number | null
}

const SIZE = 52
// Margin budget around the tight hex bounding box: side labels need extra
// horizontal room to sit outside the board, the bottom label needs extra
// vertical room, everything else just needs enough for the glow/stroke bleed.
const MARGIN_X = 46
const MARGIN_TOP = 16
const MARGIN_BOTTOM = 50

export function HexBoard({ state, variant, onSelect, interactive, pendingHexId }: HexBoardProps) {
  const layout = useMemo(() => makeLayout(SIZE), [])
  const { positions, width, polygonPoints } = layout

  // Tight bounding box around every hex's actual vertices (not just centers),
  // so nothing — like the single hex on row 1 — ever clips against the edge.
  const bounds = useMemo(() => {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const cell of CELLS) {
      const pos = positions.get(cell.id)!
      minX = Math.min(minX, pos.x - width / 2)
      maxX = Math.max(maxX, pos.x + width / 2)
      minY = Math.min(minY, pos.y - SIZE)
      maxY = Math.max(maxY, pos.y + SIZE)
    }
    return { minX, maxX, minY, maxY }
  }, [positions, width])

  const viewBoxX = bounds.minX - MARGIN_X
  const viewBoxY = bounds.minY - MARGIN_TOP
  const viewBoxW = bounds.maxX - bounds.minX + MARGIN_X * 2
  const viewBoxH = bounds.maxY - bounds.minY + MARGIN_TOP + MARGIN_BOTTOM
  const midY = (bounds.minY + bounds.maxY) / 2
  const midX = (bounds.minX + bounds.maxX) / 2

  const winningSet = useMemo(() => new Set(state.winningPath ?? []), [state.winningPath])

  const fillFor = (cellState: CellState) => {
    if (cellState === 1) return 'var(--color-p1)'
    if (cellState === 2) return 'var(--color-p2)'
    if (cellState === 'gray') return 'var(--hex-fill-gray)'
    return 'url(#hexEmpty)'
  }

  const labelFor = (cellId: number, cellState: CellState) => {
    if (cellState === 'gray') return '?'
    return variant === 'classic' ? String(cellId) : state.cellLetters[cellId]
  }

  return (
    <svg
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
      className="w-full h-auto max-w-[620px] select-none touch-manipulation"
      role="group"
      aria-label="Herní deska"
    >
      <defs>
        <linearGradient id="hexEmpty" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--hex-empty-grad-1)" />
          <stop offset="100%" stopColor="var(--hex-empty-grad-2)" />
        </linearGradient>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* side labels */}
      <text
        x={bounds.minX - 14}
        y={midY}
        fill="var(--hex-side-label)"
        fontSize="13"
        fontWeight={700}
        letterSpacing="0.12em"
        className="font-display uppercase"
        transform={`rotate(-60, ${bounds.minX - 14}, ${midY})`}
      >
        Levá strana
      </text>
      <text
        x={bounds.maxX + 14}
        y={midY}
        fill="var(--hex-side-label)"
        fontSize="13"
        fontWeight={700}
        letterSpacing="0.12em"
        textAnchor="end"
        className="font-display uppercase"
        transform={`rotate(60, ${bounds.maxX + 14}, ${midY})`}
      >
        Pravá strana
      </text>
      <text
        x={midX}
        y={bounds.maxY + 34}
        fill="var(--hex-side-label)"
        fontSize="13"
        fontWeight={700}
        letterSpacing="0.12em"
        textAnchor="middle"
        className="font-display uppercase"
      >
        Spodní strana
      </text>

      {CELLS.map((cell) => {
        const pos = positions.get(cell.id)!
        const cellState = state.cells[cell.id]
        const isOpen = cellState === 'empty' || cellState === 'gray'
        const isClickable = interactive && isOpen
        const isWinning = winningSet.has(cell.id)
        const isPending = pendingHexId === cell.id
        const label = labelFor(cell.id, cellState)

        return (
          <g
            key={cell.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => isClickable && onSelect(cell.id)}
            className={isClickable ? 'cursor-pointer' : 'cursor-default'}
          >
            <polygon
              points={polygonPoints}
              fill={fillFor(cellState)}
              stroke={isWinning ? 'var(--color-gold)' : isPending ? 'var(--hex-stroke-pending)' : 'var(--hex-stroke)'}
              strokeWidth={isWinning || isPending ? 3.5 : 1.5}
              filter={isWinning || isPending ? 'url(#glow)' : undefined}
              className={[
                'transition-all duration-200',
                isClickable ? 'hover:brightness-125 hover:-translate-y-0.5' : '',
                isPending ? 'animate-pulse' : '',
              ].join(' ')}
              style={{ transformOrigin: 'center' }}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={label?.length > 1 ? 16 : 20}
              fontWeight={800}
              fill={cellState === 1 || cellState === 2 ? 'var(--color-onaccent)' : cellState === 'gray' ? 'var(--hex-text-gray)' : 'var(--hex-text-empty)'}
              className="font-display pointer-events-none"
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
