import { useEffect, useRef, useState } from 'react'
import { HexBoard } from './HexBoard'
import { GameHUD } from './GameHUD'
import { QuestionModal } from './QuestionModal'
import { WinOverlay } from './WinOverlay'
import { ResultToast } from './ResultToast'
import { useGame } from '../game/useGame'
import { aiPickOptionIndex, aiWillAnswerCorrectly, pickHexForAI } from '../game/ai'
import type { GameMode, Question } from '../game/types'

const TIME_LIMIT = 18

interface GameScreenProps {
  mode: GameMode
  p1Name: string
  p2Name: string
  questions: Question[]
  onExit: () => void
}

export function GameScreen({ mode, p1Name, p2Name, questions, onExit }: GameScreenProps) {
  const { state, openQuestion, submitAnswer, reset } = useGame(mode, p1Name, p2Name)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
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
    setSelectedIndex(null)
    setRevealed(false)
    setTimeLeft(TIME_LIMIT)
    clearTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeQuestion?.hexId])

  const finishAnswer = (index: number) => {
    setSelectedIndex(index)
    setRevealed(true)
    const t = window.setTimeout(() => {
      submitAnswer(index)
    }, 1100)
    timers.current.push(t)
  }

  // human countdown timer
  useEffect(() => {
    if (!state.activeQuestion || isAITurn || revealed) return
    if (timeLeft <= 0) {
      finishAnswer(-1)
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
      openQuestion(hexId, questions)
    }, 850)
    timers.current.push(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner, state.activeQuestion, state.currentPlayer, state.cells])

  // AI: "think" then answer
  useEffect(() => {
    if (!state.activeQuestion || !isAITurn) return
    const { question } = state.activeQuestion
    const correct = aiWillAnswerCorrectly(question)
    const chosen = aiPickOptionIndex(question, correct)
    const t = window.setTimeout(() => finishAnswer(chosen), 1700)
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
          onSelect={(hexId) => boardInteractive && openQuestion(hexId, questions)}
          interactive={boardInteractive}
          pendingHexId={state.activeQuestion?.hexId ?? null}
        />
      </div>

      <ResultToast state={state} />

      {state.activeQuestion && activePlayer && (
        <QuestionModal
          hexId={state.activeQuestion.hexId}
          question={state.activeQuestion.question}
          player={activePlayer}
          timeLeft={isAITurn ? 1 : timeLeft}
          timeLimit={isAITurn ? 1 : TIME_LIMIT}
          selectedIndex={selectedIndex}
          revealed={revealed}
          isAI={isAITurn}
          onSelect={(i) => !revealed && finishAnswer(i)}
        />
      )}

      {state.winner && (
        <WinOverlay
          winner={state.players[state.winner]}
          onRematch={() => reset(mode, p1Name, p2Name)}
          onMenu={onExit}
        />
      )}
    </div>
  )
}
