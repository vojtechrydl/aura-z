import type { PlayerConfig } from '../game/types'

interface WinOverlayProps {
  winner: PlayerConfig
  onRematch: () => void
  onMenu: () => void
}

export function WinOverlay({ winner, onRematch, onMenu }: WinOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-surface p-8 text-center shadow-2xl animate-[pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl opacity-40"
          style={{ backgroundColor: winner.color }}
        />
        <div className="relative">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-display font-bold">
            Vítězí
          </p>
          <h2
            className="mt-1 text-3xl font-display font-extrabold"
            style={{ color: winner.color }}
          >
            {winner.name}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Propojili barvou všechny tři strany trojúhelníku. GG!
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onRematch}
              className="rounded-2xl px-5 py-3 text-sm font-bold font-display text-ink transition-transform hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: winner.color }}
            >
              Odveta
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold font-display text-white/80 hover:bg-white/10 transition-colors"
            >
              Zpět do menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
