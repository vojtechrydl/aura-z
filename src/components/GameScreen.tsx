import { useEffect, useRef, useState } from 'react'
import { HexBoard } from './HexBoard'
import { GameHUD } from './GameHUD'
import { QuestionModal } from './QuestionModal'
import { StealOfferModal } from './StealOfferModal'
import { WinOverlay } from './WinOverlay'
import { ResultToast } from './ResultToast'
import { useGame } from '../game/useGame'
import { isAnswerAccepted } from '../game/normalize'
import { aiPickYesNo, aiWillAnswerLetter, aiWillAnswerYesNo, pickHexForAI } from '../game/ai'
import { playClick, playCorrect, playWin, playWrong } from '../game/sounds'
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
  const { state, openQuestion, submitLetterAnswer, submitYesNo, declineSteal, acceptSteal, reset } =
    useGame(mode, variant, p1Name, p2Name, letterQuestions, yesNoQuestions)

  const [showStartBanner, setShowStartBanner] = useState(false)
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
    const isSteal = state.activeQuestion.isSteal
    const correct = isAnswerAccepted(text, q.answer, q.altAnswers)
    setInputValue(text)

    if (!correct && !isSteal) {
      // A fresh (non-steal) miss doesn't reveal the answer here — that would
      // spoil the steal offer the opponent is about to get. Hand off
      // immediately; useGame swaps this into a stealOffer.
      playWrong()
      submitLetterAnswer(text)
      return
    }

    setRevealed(true)
    setRevealCorrect(correct)
    correct ? playCorrect() : playWrong()
    const t = window.setTimeout(() => submitLetterAnswer(text), 1400)
    timers.current.push(t)
  }

  const finishYesNo = (picked: boolean) => {
    if (!state.activeQuestion || state.activeQuestion.kind !== 'yesno') return
    const q = state.activeQuestion.question
    const correct = picked === q.correct
    setYesNoPick(picked)
    setRevealed(true)
    setRevealCorrect(correct)
    correct ? playCorrect() : playWrong()
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
    if (state.winner || state.activeQuestion || state.stealOffer) return
    const current = state.players[state.currentPlayer]
    if (!current.isAI) return
    const t = window.setTimeout(() => {
      const hexId = pickHexForAI(state.cells, state.currentPlayer)
      openQuestion(hexId)
    }, 850)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner, state.activeQuestion, state.stealOffer, state.currentPlayer, state.cells])

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

  // AI: decide whether to accept a steal offer
  useEffect(() => {
    if (!state.stealOffer) return
    const stealer = state.players[state.stealOffer.stealingPlayer]
    if (!stealer.isAI) return
    const willSucceed = aiWillAnswerLetter(state.stealOffer.question)
    const accept = willSucceed || Math.random() < 0.2
    const t = window.setTimeout(() => (accept ? acceptSteal() : declineSteal()), 900)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stealOffer])

  useEffect(() => clearTimers, [])

  // fires exactly once, right when a null->playerId transition happens
  useEffect(() => {
    if (state.winner) playWin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner])

  // Announce who won the coin toss — fires on first mount and again on every
  // "Odveta" rematch (cellLetters/cellQuestions get a fresh object identity
  // each time makeInitialState runs, in both board variants).
  useEffect(() => {
    setShowStartBanner(true)
    const t = window.setTimeout(() => setShowStartBanner(false), 2400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cellLetters, state.cellQuestions])

  const boardInteractive =
    !state.activeQuestion &&
    !state.stealOffer &&
    !state.winner &&
    !state.players[state.currentPlayer].isAI

  return (
    <div className="flex min-h-dvh w-full flex-col items-center gap-6 px-4 py-6 sm:py-8">
      <GameHUD state={state} onExit={onExit} />

      <div className="flex w-full flex-1 items-center justify-center">
        <HexBoard
          state={state}
          variant={variant}
          onSelect={(hexId) => {
            if (!boardInteractive) return
            playClick()
            openQuestion(hexId)
          }}
          interactive={boardInteractive}
          pendingHexId={state.activeQuestion?.hexId ?? state.stealOffer?.hexId ?? null}
        />
      </div>

      <ResultToast state={state} />

      {showStartBanner && !state.activeQuestion && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
          <div
            className="animate-pop flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-bold font-display shadow-xl backdrop-blur"
            style={{
              borderColor: `color-mix(in oklab, ${state.players[state.currentPlayer].color} 40%, transparent)`,
              backgroundColor: `color-mix(in oklab, ${state.players[state.currentPlayer].color} 15%, transparent)`,
              color: state.players[state.currentPlayer].color,
            }}
          >
            <span>🎲</span>
            <span>{state.players[state.currentPlayer].name} losováním začíná!</span>
          </div>
        </div>
      )}

      {state.activeQuestion && activePlayer && (
        <QuestionModal
          active={state.activeQuestion}
          variant={variant}
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

      {state.stealOffer && (
        <StealOfferModal
          offer={state.stealOffer}
          originalPlayer={state.players[state.stealOffer.originalPlayer]}
          stealingPlayer={state.players[state.stealOffer.stealingPlayer]}
          isAI={state.players[state.stealOffer.stealingPlayer].isAI}
          onAccept={acceptSteal}
          onDecline={declineSteal}
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
