import { useMemo } from 'react'
import { CELLS } from '../game/board'
import { makeLayout } from '../game/geometry'
import type { CellState, GameState } from '../game/types'

interface HexBoardProps {
  state: GameState
  onSelect: (hexId: number) => void
  interactive: boolean
  pendingHexId: number | null
}

const SIZE = 52
const PADDING = 64

export function HexBoard({ state, onSelect, interactive, pendingHexId }: HexBoardProps) {
  const layout = useMemo(() => makeLayout(SIZE), [])
  const { positions, totalWidth, totalHeight, polygonPoints } = layout

  const viewBoxW = totalWidth + PADDING * 2
  const viewBoxH = totalHeight + PADDING * 2 + 34
  const offsetX = viewBoxW / 2
  const offsetY = PADDING + SIZE

  const winningSet = useMemo(() => new Set(state.winningPath ?? []), [state.winningPath])

  const fillFor = (cellState: CellState) => {
    if (cellState === 1) return 'var(--color-p1)'
    if (cellState === 2) return 'var(--color-p2)'
    if (cellState === 'gray') return '#4b4160'
    return 'url(#hexEmpty)'
  }

  return (
    <svg
      viewBox={`${-offsetX} ${-PADDING} ${viewBoxW} ${viewBoxH}`}
      className="w-full h-auto max-w-[620px] select-none touch-manipulation"
      role="group"
      aria-label="Herní deska"
    >
      <defs>
        <linearGradient id="hexEmpty" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a1c48" />
          <stop offset="100%" stopColor="#1e1436" />
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
        x={-offsetX + 18}
        y={totalHeight / 2 - offsetY + PADDING}
        fill="#a893d6"
        fontSize="13"
        fontWeight={700}
        letterSpacing="0.12em"
        className="font-display uppercase"
        transform={`rotate(-60, ${-offsetX + 18}, ${totalHeight / 2 - offsetY + PADDING})`}
      >
        Levá strana
      </text>
      <text
        x={offsetX - 18}
        y={totalHeight / 2 - offsetY + PADDING}
        fill="#a893d6"
        fontSize="13"
        fontWeight={700}
        letterSpacing="0.12em"
        textAnchor="end"
        className="font-display uppercase"
        transform={`rotate(60, ${offsetX - 18}, ${totalHeight / 2 - offsetY + PADDING})`}
      >
        Pravá strana
      </text>
      <text
        x={0}
        y={totalHeight - offsetY + SIZE + 34}
        fill="#a893d6"
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
        const cx = pos.x
        const cy = pos.y - offsetY + PADDING
        const cellState = state.cells[cell.id]
        const isOpen = cellState === 'empty' || cellState === 'gray'
        const isClickable = interactive && isOpen
        const isWinning = winningSet.has(cell.id)
        const isPending = pendingHexId === cell.id

        return (
          <g
            key={cell.id}
            transform={`translate(${cx}, ${cy})`}
            onClick={() => isClickable && onSelect(cell.id)}
            className={isClickable ? 'cursor-pointer' : 'cursor-default'}
          >
            <polygon
              points={polygonPoints}
              fill={fillFor(cellState)}
              stroke={isWinning ? 'var(--color-gold)' : isPending ? '#fff' : '#3a2b5c'}
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
              fontSize={state.cellLetters[cell.id]?.length > 1 ? 16 : 20}
              fontWeight={800}
              fill={cellState === 1 || cellState === 2 ? '#0b0518' : cellState === 'gray' ? '#8a7fa8' : '#d9c9ff'}
              className="font-display pointer-events-none"
            >
              {cellState === 'gray' ? '?' : state.cellLetters[cell.id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
