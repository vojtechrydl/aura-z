import { useCallback, useRef, useState } from 'react'
import { CELLS, checkWin } from './board'
import type { CellState, GameMode, GameState, PlayerConfig, PlayerId, Question } from './types'

const PALETTE = {
  p1: { color: 'var(--color-p1)', soft: 'var(--color-p1-soft)' },
  p2: { color: 'var(--color-p2)', soft: 'var(--color-p2-soft)' },
}

export function makeInitialCells(): Record<number, CellState> {
  const cells: Record<number, CellState> = {}
  for (const c of CELLS) cells[c.id] = 'empty'
  return cells
}

export function makeInitialState(
  mode: GameMode,
  player1Name: string,
  player2Name: string,
): GameState {
  const players: Record<PlayerId, PlayerConfig> = {
    1: { id: 1, name: player1Name, color: PALETTE.p1.color, colorSoft: PALETTE.p1.soft, isAI: false },
    2: {
      id: 2,
      name: player2Name,
      color: PALETTE.p2.color,
      colorSoft: PALETTE.p2.soft,
      isAI: mode === 'ai',
    },
  }
  return {
    mode,
    cells: makeInitialCells(),
    currentPlayer: 1,
    players,
    activeQuestion: null,
    usedQuestionIds: new Set(),
    winner: null,
    winningPath: null,
    lastResult: null,
    turnCount: 0,
  }
}

export function useGame(mode: GameMode, player1Name: string, player2Name: string) {
  const [state, setState] = useState<GameState>(() =>
    makeInitialState(mode, player1Name, player2Name),
  )
  const usedIdsRef = useRef(new Set<string>())

  const pickQuestion = useCallback((pool: Question[]): Question => {
    const fresh = pool.filter((q) => !usedIdsRef.current.has(q.id))
    const source = fresh.length > 0 ? fresh : pool
    const q = source[Math.floor(Math.random() * source.length)]
    usedIdsRef.current.add(q.id)
    return q
  }, [])

  const openQuestion = useCallback(
    (hexId: number, pool: Question[]) => {
      setState((s) => {
        if (s.winner || s.activeQuestion) return s
        if (s.cells[hexId] === s.currentPlayer) return s
        const question = pickQuestion(pool)
        return {
          ...s,
          activeQuestion: { hexId, question, forPlayer: s.currentPlayer },
          lastResult: null,
        }
      })
    },
    [pickQuestion],
  )

  const submitAnswer = useCallback((selectedIndex: number) => {
    setState((s) => {
      if (!s.activeQuestion) return s
      const { hexId, question, forPlayer } = s.activeQuestion
      const correct = selectedIndex === question.correctIndex
      const nextCells: Record<number, CellState> = {
        ...s.cells,
        [hexId]: correct ? forPlayer : 'gray',
      }

      let winner: PlayerId | null = null
      let winningPath: number[] | null = null
      if (correct) {
        const claimed = new Set(
          CELLS.filter((c) => nextCells[c.id] === forPlayer).map((c) => c.id),
        )
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
        lastResult: { hexId, correct, player: forPlayer },
        turnCount: s.turnCount + 1,
      }
    })
  }, [])

  const reset = useCallback((newMode: GameMode, p1: string, p2: string) => {
    usedIdsRef.current = new Set()
    setState(makeInitialState(newMode, p1, p2))
  }, [])

  return { state, openQuestion, submitAnswer, reset }
}
