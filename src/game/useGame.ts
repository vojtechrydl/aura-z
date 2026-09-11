import { useCallback, useRef, useState } from 'react'
import { CELLS, checkWin } from './board'
import { assignCellLetters, assignCellQuestions } from './letters'
import { isAnswerAccepted } from './normalize'
import type {
  BoardVariant,
  CellState,
  GameMode,
  GameState,
  LetterQuestion,
  PlayerConfig,
  PlayerId,
  YesNoQuestion,
} from './types'

const PALETTE = {
  p1: { color: 'var(--color-p1)', soft: 'var(--color-p1-soft)' },
  p2: { color: 'var(--color-p2)', soft: 'var(--color-p2-soft)' },
}

function makeInitialCells(): Record<number, CellState> {
  const cells: Record<number, CellState> = {}
  for (const c of CELLS) cells[c.id] = 'empty'
  return cells
}

function makePlayers(mode: GameMode, p1Name: string, p2Name: string): Record<PlayerId, PlayerConfig> {
  return {
    1: { id: 1, name: p1Name, color: PALETTE.p1.color, colorSoft: PALETTE.p1.soft, isAI: false },
    2: {
      id: 2,
      name: p2Name,
      color: PALETTE.p2.color,
      colorSoft: PALETTE.p2.soft,
      isAI: mode === 'ai',
    },
  }
}

export function makeInitialState(
  mode: GameMode,
  variant: BoardVariant,
  player1Name: string,
  player2Name: string,
  letterQuestions: LetterQuestion[],
): GameState {
  const isClassic = variant === 'classic'
  return {
    mode,
    variant,
    cells: makeInitialCells(),
    cellLetters: isClassic ? {} : assignCellLetters(Array.from(new Set(letterQuestions.map((q) => q.letter)))),
    cellQuestions: isClassic ? assignCellQuestions(letterQuestions) : {},
    currentPlayer: 1,
    players: makePlayers(mode, player1Name, player2Name),
    activeQuestion: null,
    winner: null,
    winningPath: null,
    lastResult: null,
    turnCount: 0,
  }
}

export function useGame(
  mode: GameMode,
  variant: BoardVariant,
  player1Name: string,
  player2Name: string,
  letterQuestions: LetterQuestion[],
  yesNoQuestions: YesNoQuestion[],
) {
  const [state, setState] = useState<GameState>(() =>
    makeInitialState(mode, variant, player1Name, player2Name, letterQuestions),
  )
  const usedIdsRef = useRef(new Set<string>())

  const pickLetterQuestion = useCallback(
    (letter: string): LetterQuestion => {
      const forLetter = letterQuestions.filter((q) => q.letter === letter)
      const fresh = forLetter.filter((q) => !usedIdsRef.current.has(q.id))
      const pool = fresh.length > 0 ? fresh : forLetter.length > 0 ? forLetter : letterQuestions
      const q = pool[Math.floor(Math.random() * pool.length)]
      usedIdsRef.current.add(q.id)
      return q
    },
    [letterQuestions],
  )

  const pickYesNoQuestion = useCallback((): YesNoQuestion => {
    const fresh = yesNoQuestions.filter((q) => !usedIdsRef.current.has(q.id))
    const pool = fresh.length > 0 ? fresh : yesNoQuestions
    const q = pool[Math.floor(Math.random() * pool.length)]
    usedIdsRef.current.add(q.id)
    return q
  }, [yesNoQuestions])

  const openQuestion = useCallback(
    (hexId: number) => {
      setState((s) => {
        if (s.winner || s.activeQuestion) return s
        const cellState = s.cells[hexId]
        if (cellState !== 'empty' && cellState !== 'gray') return s

        if (cellState === 'gray') {
          const question = pickYesNoQuestion()
          return {
            ...s,
            activeQuestion: { kind: 'yesno', hexId, forPlayer: s.currentPlayer, question },
            lastResult: null,
          }
        }

        const question =
          s.variant === 'classic' ? s.cellQuestions[hexId] : pickLetterQuestion(s.cellLetters[hexId])
        usedIdsRef.current.add(question.id)
        return {
          ...s,
          activeQuestion: { kind: 'letter', hexId, forPlayer: s.currentPlayer, question },
          lastResult: null,
        }
      })
    },
    [pickLetterQuestion, pickYesNoQuestion],
  )

  const resolveTurn = useCallback((hexId: number, forPlayer: PlayerId, correct: boolean, kind: 'letter' | 'yesno', revealAnswer?: string, revealExplanation?: string) => {
    setState((s) => {
      const nextCells: Record<number, CellState> = {
        ...s.cells,
        [hexId]: correct ? forPlayer : 'gray',
      }

      let winner: PlayerId | null = null
      let winningPath: number[] | null = null
      if (correct) {
        const claimed = new Set(CELLS.filter((c) => nextCells[c.id] === forPlayer).map((c) => c.id))
        const path = checkWin(claimed)
        if (path) {
          winner = forPlayer
          winningPath = path
        }
      }

      return {
        ...s,
        cells: nextCells,
        activeQuestion: null,
        winner,
        winningPath,
        currentPlayer: winner ? s.currentPlayer : forPlayer === 1 ? 2 : 1,
        lastResult: { hexId, correct, player: forPlayer, kind, revealAnswer, revealExplanation },
        turnCount: s.turnCount + 1,
      }
    })
  }, [])

  const submitLetterAnswer = useCallback(
    (text: string) => {
      if (!state.activeQuestion || state.activeQuestion.kind !== 'letter') return
      const { hexId, forPlayer, question } = state.activeQuestion
      const correct = isAnswerAccepted(text, question.answer, question.altAnswers)
      resolveTurn(hexId, forPlayer, correct, 'letter', question.answer)
    },
    [state.activeQuestion, resolveTurn],
  )

  const submitYesNo = useCallback(
    (picked: boolean) => {
      if (!state.activeQuestion || state.activeQuestion.kind !== 'yesno') return
      const { hexId, forPlayer, question } = state.activeQuestion
      const correct = picked === question.correct
      resolveTurn(
        hexId,
        forPlayer,
        correct,
        'yesno',
        question.correct ? 'ANO' : 'NE',
        question.explanation,
      )
    },
    [state.activeQuestion, resolveTurn],
  )

  const reset = useCallback(
    (newMode: GameMode, newVariant: BoardVariant, p1: string, p2: string) => {
      usedIdsRef.current = new Set()
      setState(makeInitialState(newMode, newVariant, p1, p2, letterQuestions))
    },
    [letterQuestions],
  )

  return { state, openQuestion, submitLetterAnswer, submitYesNo, reset }
}
