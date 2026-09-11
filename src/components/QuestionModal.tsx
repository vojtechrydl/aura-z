import type { ActiveQuestion, BoardVariant, PlayerConfig } from '../game/types'

interface QuestionModalProps {
  active: ActiveQuestion
  variant: BoardVariant
  player: PlayerConfig
  timeLeft: number
  timeLimit: number
  isAI: boolean
  revealed: boolean
  revealCorrect: boolean | null
  inputValue: string
  onInputChange: (value: string) => void
  onSubmitLetter: () => void
  onDontKnow: () => void
  yesNoPick: boolean | null
  onPickYesNo: (value: boolean) => void
}

export function QuestionModal({
  active,
  variant,
  player,
  timeLeft,
  timeLimit,
  isAI,
  revealed,
  revealCorrect,
  inputValue,
  onInputChange,
  onSubmitLetter,
  onDontKnow,
  yesNoPick,
  onPickYesNo,
}: QuestionModalProps) {
  const progress = Math.max(0, Math.min(1, timeLeft / timeLimit))
  const question = active.question
  const category = 'category' in question ? question.category : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[pop_0.3s_ease]">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface shadow-2xl overflow-hidden">
        <div
          className="h-1.5 w-full origin-left transition-transform duration-1000 ease-linear"
          style={{ backgroundColor: player.color, transform: `scaleX(${progress})` }}
        />
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider font-display"
              style={{ backgroundColor: player.colorSoft, color: '#0b0518' }}
            >
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: player.color }} />
              {isAI ? `${player.name} přemýšlí…` : `${player.name} na tahu`}
            </span>
            <span className="text-xs text-white/40 font-display">POLE #{active.hexId}</span>
          </div>

          {category && (
            <span className="text-[11px] uppercase tracking-widest text-gold-fg font-bold font-display">
              {category}
            </span>
          )}

          {active.kind === 'letter' ? (
            <LetterQuestionBody
              active={active}
              variant={variant}
              isAI={isAI}
              revealed={revealed}
              revealCorrect={revealCorrect}
              inputValue={inputValue}
              onInputChange={onInputChange}
              onSubmitLetter={onSubmitLetter}
              onDontKnow={onDontKnow}
            />
          ) : (
            <YesNoQuestionBody
              active={active}
              isAI={isAI}
              revealed={revealed}
              yesNoPick={yesNoPick}
              onPickYesNo={onPickYesNo}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function LetterQuestionBody({
  active,
  variant,
  isAI,
  revealed,
  revealCorrect,
  inputValue,
  onInputChange,
  onSubmitLetter,
  onDontKnow,
}: Pick<
  QuestionModalProps,
  | 'variant'
  | 'isAI'
  | 'revealed'
  | 'revealCorrect'
  | 'inputValue'
  | 'onInputChange'
  | 'onSubmitLetter'
  | 'onDontKnow'
> & { active: Extract<ActiveQuestion, { kind: 'letter' }> }) {
  const q = active.question
  // Classic tiles are numbered — the underlying question still has a
  // `letter` (same question bank as Finále), but showing it would leak a
  // free hint that isn't part of that mode. The badge mirrors what's
  // actually printed on the tile: the letter in Finále, the number in
  // Classic.
  const isFinale = variant === 'finale'
  const badgeLabel = isFinale ? q.letter : String(active.hexId)
  const borderClass = !revealed
    ? 'border-white/15 focus:border-white/50'
    : revealCorrect
      ? 'border-emerald-400 bg-emerald-400/10'
      : 'border-rose-400 bg-rose-400/10'

  return (
    <>
      <div className="mt-1 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-lg font-extrabold font-display text-onaccent">
          {badgeLabel}
        </span>
        <h2 className="mt-1 text-lg sm:text-xl font-display font-bold leading-snug text-white">
          {q.question}
        </h2>
      </div>

      <div className="mt-5">
        {isAI ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white/40 italic">
            {revealed ? (revealCorrect ? q.answer : 'AI nevěděla…') : '…'}
          </div>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSubmitLetter()
              }}
              className="flex gap-2.5"
            >
              <input
                type="text"
                autoFocus
                disabled={revealed}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={isFinale ? `Odpověď na písmeno ${q.letter}…` : 'Napiš odpověď…'}
                className={`w-full rounded-2xl border px-4 py-3 text-base font-medium text-white placeholder-white/30 outline-none transition-colors ${borderClass}`}
              />
              <button
                type="submit"
                disabled={revealed || !inputValue.trim()}
                className="shrink-0 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold font-display text-white transition-colors hover:bg-white/20 disabled:opacity-30"
              >
                OK
              </button>
            </form>
            <button
              type="button"
              disabled={revealed}
              onClick={onDontKnow}
              className="mt-2.5 w-full rounded-2xl border border-white/5 bg-transparent px-4 py-2 text-xs font-bold font-display text-white/40 transition-colors hover:bg-white/5 hover:text-white/70 disabled:opacity-30"
            >
              Nevím…
            </button>
          </>
        )}
      </div>

      {revealed && (
        <p className={`mt-3 text-sm font-medium ${revealCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
          {revealCorrect ? 'Správně!' : `Správná odpověď: ${q.answer}`}
        </p>
      )}
    </>
  )
}

function YesNoQuestionBody({
  active,
  isAI,
  revealed,
  yesNoPick,
  onPickYesNo,
}: Pick<QuestionModalProps, 'isAI' | 'revealed' | 'yesNoPick' | 'onPickYesNo'> & {
  active: Extract<ActiveQuestion, { kind: 'yesno' }>
}) {
  const q = active.question

  const buttonClasses = (value: boolean) => {
    if (!revealed) {
      return 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
    }
    if (value === q.correct) return 'border-emerald-400 bg-emerald-400/20 text-emerald-200'
    if (value === yesNoPick) return 'border-rose-400 bg-rose-400/20 text-rose-200'
    return 'border-white/5 bg-white/5 opacity-50'
  }

  return (
    <>
      <h2 className="mt-1 text-lg sm:text-xl font-display font-bold leading-snug text-white">
        {q.statement}
      </h2>
      <p className="mt-1 text-xs text-white/40">Šedé pole — tentokrát ANO / NE otázka.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={revealed || isAI}
          onClick={() => onPickYesNo(true)}
          className={`rounded-2xl border px-4 py-4 text-lg font-extrabold font-display text-white transition-all disabled:cursor-default ${buttonClasses(true)}`}
        >
          ANO
        </button>
        <button
          type="button"
          disabled={revealed || isAI}
          onClick={() => onPickYesNo(false)}
          className={`rounded-2xl border px-4 py-4 text-lg font-extrabold font-display text-white transition-all disabled:cursor-default ${buttonClasses(false)}`}
        >
          NE
        </button>
      </div>

      {isAI && !revealed && (
        <p className="mt-3 text-sm text-white/40 italic">AI přemýšlí…</p>
      )}

      {revealed && q.explanation && (
        <p className="mt-3 text-sm text-white/60">{q.explanation}</p>
      )}
    </>
  )
}
