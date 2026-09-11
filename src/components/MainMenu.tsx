import { useState } from 'react'
import type { GameMode } from '../game/types'

interface MainMenuProps {
  onStart: (mode: GameMode, p1: string, p2: string) => void
  questionsError: string | null
  questionsCount: number | null
}

export function MainMenu({ onStart, questionsError, questionsCount }: MainMenuProps) {
  const [mode, setMode] = useState<GameMode>('local')
  const [p1, setP1] = useState('Hráč 1')
  const [p2, setP2] = useState('Hráč 2')

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-float">
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_18px_rgba(255,61,129,0.5)]">
              <polygon
                points="50,4 93,27 93,73 50,96 7,73 7,27"
                fill="url(#logoGrad)"
                stroke="#ffd23f"
                strokeWidth="3"
              />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff3d81" />
                  <stop offset="100%" stopColor="#33e6c9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
            Aura<span className="text-gold">Z</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/50">
            Spoj dvě strany trojúhelníku dřív než soupeř.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-white/40 font-display">
            Herní režim
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`rounded-2xl border px-4 py-3.5 text-sm font-bold font-display transition-all ${
                mode === 'local'
                  ? 'border-p1 bg-p1/15 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              🤜🤛
              <div className="mt-1">2 hráči</div>
            </button>
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`rounded-2xl border px-4 py-3.5 text-sm font-bold font-display transition-all ${
                mode === 'ai'
                  ? 'border-p2 bg-p2/15 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5'
              }`}
            >
              🤖
              <div className="mt-1">Proti AI</div>
            </button>
          </div>

          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/40 font-display">
            {mode === 'ai' ? 'Tvoje jméno' : 'Jméno hráče 1'}
          </label>
          <input
            value={p1}
            maxLength={16}
            onChange={(e) => setP1(e.target.value)}
            className="mb-3.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-p1"
          />

          {mode === 'local' && (
            <>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/40 font-display">
                Jméno hráče 2
              </label>
              <input
                value={p2}
                maxLength={16}
                onChange={(e) => setP2(e.target.value)}
                className="mb-3.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-p2"
              />
            </>
          )}

          <button
            type="button"
            disabled={!questionsCount}
            onClick={() => onStart(mode, p1.trim() || 'Hráč 1', mode === 'ai' ? 'AI' : p2.trim() || 'Hráč 2')}
            className="mt-1.5 w-full rounded-2xl bg-gradient-to-r from-p1 to-gold px-5 py-3.5 text-sm font-extrabold font-display text-ink transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {questionsCount ? 'Spustit hru' : 'Načítám otázky…'}
          </button>

          {questionsError && (
            <p className="mt-3 text-center text-xs text-rose-300">{questionsError}</p>
          )}
          {questionsCount && (
            <p className="mt-3 text-center text-xs text-white/30">
              {questionsCount} otázek v questions.csv
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          Klikni na hexové pole, zodpověz otázku a zabarvi ho svojí barvou.
        </p>
      </div>
    </div>
  )
}
