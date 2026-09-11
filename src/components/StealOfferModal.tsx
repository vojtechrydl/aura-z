import type { PlayerConfig, StealOffer } from '../game/types'

interface StealOfferModalProps {
  offer: StealOffer
  originalPlayer: PlayerConfig
  stealingPlayer: PlayerConfig
  isAI: boolean
  onAccept: () => void
  onDecline: () => void
}

export function StealOfferModal({
  offer,
  originalPlayer,
  stealingPlayer,
  isAI,
  onAccept,
  onDecline,
}: StealOfferModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[pop_0.3s_ease]">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: originalPlayer.color }} />
        <div className="p-6 sm:p-7 text-center">
          <div className="text-3xl mb-2">🕵️</div>
          <p className="text-sm text-white/60">
            <span style={{ color: originalPlayer.color }} className="font-bold">
              {originalPlayer.name}
            </span>{' '}
            netrefil(a) pole #{offer.hexId}!
          </p>
          <h2
            className="mt-2 text-xl font-display font-bold leading-snug"
            style={{ color: stealingPlayer.color }}
          >
            {stealingPlayer.name}, chceš zkusit ukrást odpověď?
          </h2>
          <p className="mt-1.5 text-xs text-white/40">
            Bez opravy — jedna šance, ber nebo nech být.
          </p>

          {isAI ? (
            <p className="mt-6 text-sm text-white/40 italic">{stealingPlayer.name} přemýšlí…</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onDecline}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-bold font-display text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Nechat být
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="rounded-2xl px-4 py-3.5 text-sm font-extrabold font-display text-onaccent transition-transform hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: stealingPlayer.color }}
              >
                Ukrást pole
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
