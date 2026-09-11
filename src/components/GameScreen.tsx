import { useEffect, useRef, useState } from 'react'
import { HexBoard } from './HexBoard'
import { GameHUD } from './GameHUD'
import { QuestionModal } from './QuestionModal'
import { WinOverlay } from './WinOverlay'
import { ResultToast } from './ResultToast'
import { useGame } from '../game/useGame'
import { isAnswerAccepted } from '../game/normalize'
import { aiPickYesNo, aiWillAnswerLetter, aiWillAnswerYesNo, pickHexForAI } from '../game/ai'
import type { BoardVariant, GameMode, LetterQuestion, YesNoQuestion } from '../game/types'

const TIME_LIMIT = 18

interface GameScreenProps {
  mode: GameMode
  variant: BoardVariant
  p1Name: string
  p2Name: string
  letterQuestions: LetterQuestion[]
  yesNoQuestions: YesNoQuestion[]
  onExit: () => void
}

export function GameScreen({
  mode,
  variant,
  p1Name,
  p2Name,
  letterQuestions,
  yesNoQuestions,
  onExit,
}: GameScreenProps) {
  const { state, openQuestion, submitLetterAnswer, submitYesNo, reset } = useGame(
    mode,
    variant,
    p1Name,
    p2Name,
    letterQuestions,
    yesNoQuestions,
  )

  const [inputValue, setInputValue] = useState('')
  const [yesNoPick, setYesNoPick] = useState<boolean | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [revealCorrect, setRevealCorrect] = useState<boolean | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  const activePlayer = state.activeQuestion ? state.players[state.activeQuestion.forPlayer] : null
  const isAITurn = !!activePlayer?.isAI

  // reset per-question local UI state whenever a new question opens
  useEffect(() => {
    setInputValue('')
    setYesNoPick(null)
    setRevealed(false)
    setRevealCorrect(null)
    setTimeLeft(TIME_LIMIT)
    clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeQuestion?.hexId])

  const finishLetterAnswer = (text: string) => {
    if (!state.activeQuestion || state.activeQuestion.kind !== 'letter') return
    const q = state.activeQuestion.question
    const correct = isAnswerAccepted(text, q.answer, q.altAnswers)
    setInputValue(text)
    setRevealed(true)
    setRevealCorrect(correct)
    const t = window.setTimeout(() => submitLetterAnswer(text), 1400)
    timers.current.push(t)
  }

  const finishYesNo = (picked: boolean) => {
    if (!state.activeQuestion || state.activeQuestion.kind !== 'yesno') return
    const q = state.activeQuestion.question
    setYesNoPick(picked)
    setRevealed(true)
    setRevealCorrect(picked === q.correct)
    const t = window.setTimeout(() => submitYesNo(picked), 1600)
    timers.current.push(t)
  }

  // human countdown timer
  useEffect(() => {
    if (!state.activeQuestion || isAITurn || revealed) return
    if (timeLeft <= 0) {
      if (state.activeQuestion.kind === 'letter') finishLetterAnswer(inputValue)
      else finishYesNo(false) // timeout on yes/no counts as a (likely) wrong guess
      return
    }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeQuestion, isAITurn, revealed, timeLeft])

  // AI: pick a hex on its turn
  useEffect(() => {
    if (state.winner || state.activeQuestion) return
    const current = state.players[state.currentPlayer]
    if (!current.isAI) return
    const t = window.setTimeout(() => {
      const hexId = pickHexForAI(state.cells, state.currentPlayer)
      openQuestion(hexId)
    }, 850)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner, state.activeQuestion, state.currentPlayer, state.cells])

  // AI: "think" then answer
  useEffect(() => {
    if (!state.activeQuestion || !isAITurn) return
    if (state.activeQuestion.kind === 'letter') {
      const q = state.activeQuestion.question
      const correct = aiWillAnswerLetter(q)
      const t = window.setTimeout(() => finishLetterAnswer(correct ? q.answer : '???'), 1700)
      timers.current.push(t)
      return () => clearTimeout(t)
    }
    const q = state.activeQuestion.question
    const correct = aiWillAnswerYesNo(q)
    const pick = aiPickYesNo(q, correct)
    const t = window.setTimeout(() => finishYesNo(pick), 1700)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeQuestion, isAITurn])

  useEffect(() => clearTimers, [])

  const boardInteractive =
    !state.activeQuestion && !state.winner && !state.players[state.currentPlayer].isAI

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-6 px-4 py-6 sm:py-8">
      <GameHUD state={state} onExit={onExit} />

      <div className="flex w-full flex-1 items-center justify-center">
        <HexBoard
          state={state}
          variant={variant}
          onSelect={(hexId) => boardInteractive && openQuestion(hexId)}
          interactive={boardInteractive}
          pendingHexId={state.activeQuestion?.hexId ?? null}
        />
      </div>

      <ResultToast state={state} />

      {state.activeQuestion && activePlayer && (
        <QuestionModal
          active={state.activeQuestion}
          player={activePlayer}
          timeLeft={isAITurn ? 1 : timeLeft}
          timeLimit={isAITurn ? 1 : TIME_LIMIT}
          isAI={isAITurn}
          revealed={revealed}
          revealCorrect={revealCorrect}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmitLetter={() => finishLetterAnswer(inputValue)}
          onDontKnow={() => finishLetterAnswer('')}
          yesNoPick={yesNoPick}
          onPickYesNo={finishYesNo}
        />
      )}

      {state.winner && (
        <WinOverlay
          winner={state.players[state.winner]}
          onRematch={() => reset(mode, variant, p1Name, p2Name)}
          onMenu={onExit}
        />
      )}
    </div>
  )
}
