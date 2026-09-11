import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'

interface ResultToastProps {
  state: GameState
}

export function ResultToast({ state }: ResultToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!state.lastResult) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(t)
  }, [state.lastResult, state.turnCount])

  if (!state.lastResult || !visible) return null
  const { correct, player, hexId } = state.lastResult
  const p = state.players[player]

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
      <div
        className={`animate-pop flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-bold font-display shadow-xl backdrop-blur ${
          correct
            ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
            : 'border-rose-400/40 bg-rose-400/15 text-rose-200'
        }`}
      >
        <span>{correct ? '✅' : '❌'}</span>
        <span>
          {p.name}: {correct ? `pole #${hexId} zabarveno!` : `pole #${hexId} zešedlo`}
        </span>
      </div>
    </div>
  )
}
