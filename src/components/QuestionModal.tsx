import type { PlayerConfig, Question } from '../game/types'

const LETTERS = ['A', 'B', 'C', 'D']

interface QuestionModalProps {
  hexId: number
  question: Question
  player: PlayerConfig
  timeLeft: number
  timeLimit: number
  selectedIndex: number | null
  revealed: boolean
  isAI: boolean
  onSelect: (index: number) => void
}

export function QuestionModal({
  hexId,
  question,
  player,
  timeLeft,
  timeLimit,
  selectedIndex,
  revealed,
  isAI,
  onSelect,
}: QuestionModalProps) {
  const progress = Math.max(0, Math.min(1, timeLeft / timeLimit))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[pop_0.3s_ease]">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-surface shadow-2xl overflow-hidden">
        <div
          className="h-1.5 w-full origin-left transition-transform duration-1000 ease-linear"
          style={{
            backgroundColor: player.color,
            transform: `scaleX(${progress})`,
          }}
        />
        <div className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider font-display"
              style={{ backgroundColor: player.colorSoft, color: '#0b0518' }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: player.color }}
              />
              {isAI ? `${player.name} přemýšlí…` : `${player.name} na tahu`}
            </span>
            <span className="text-xs text-white/40 font-display">POLE #{hexId}</span>
          </div>

          {question.category && (
            <span className="text-[11px] uppercase tracking-widest text-gold font-bold font-display">
              {question.category}
            </span>
          )}
          <h2 className="mt-1 text-xl sm:text-2xl font-display font-bold leading-snug text-white">
            {question.question}
          </h2>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              const isCorrect = i === question.correctIndex
              const isSelected = i === selectedIndex
              let stateClasses = 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25'
              if (revealed) {
                if (isCorrect) {
                  stateClasses = 'border-emerald-400 bg-emerald-400/20 text-emerald-200'
                } else if (isSelected) {
                  stateClasses = 'border-rose-400 bg-rose-400/20 text-rose-200'
                } else {
                  stateClasses = 'border-white/5 bg-white/5 opacity-50'
                }
              } else if (isSelected) {
                stateClasses = 'border-white/60 bg-white/15'
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={revealed || isAI}
                  onClick={() => onSelect(i)}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm sm:text-base font-medium text-white transition-all duration-150 disabled:cursor-default ${stateClasses}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold font-display">
                    {LETTERS[i]}
                  </span>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
