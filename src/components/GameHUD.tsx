import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../game/sounds'
import type { GameState, PlayerId } from '../game/types'

interface GameHUDProps {
  state: GameState
  onExit: () => void
}

function countCells(state: GameState, player: PlayerId) {
  return Object.values(state.cells).filter((c) => c === player).length
}

export function GameHUD({ state, onExit }: GameHUDProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled)

  return (
    <div className="flex w-full max-w-[620px] items-center justify-between gap-2 sm:gap-3">
      {([1, 2] as PlayerId[]).map((id) => {
        const p = state.players[id]
        const active = state.currentPlayer === id && !state.winner
        return (
          <div
            key={id}
            className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-all ${
              active ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${active ? 'animate-pulse-ring' : ''}`}
              style={{ backgroundColor: p.color, color: p.color }}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold font-display text-white">
                {p.name}
                {p.isAI && <span className="ml-1 text-white/40 font-normal">· AI</span>}
              </div>
              <div className="text-xs text-white/40">{countCells(state, id)} polí</div>
            </div>
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => {
          const next = !soundOn
          setSoundOn(next)
          setSoundEnabled(next)
        }}
        aria-label={soundOn ? 'Vypnout zvuk' : 'Zapnout zvuk'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm leading-none hover:bg-white/10 transition-colors"
      >
        {soundOn ? '🔊' : '🔇'}
      </button>
      <button
        type="button"
        onClick={onExit}
        className="flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold font-display text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        Menu
      </button>
    </div>
  )
}
