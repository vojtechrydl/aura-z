import { CELLS, neighbors } from './board'
import type { CellState, LetterQuestion, PlayerId, YesNoQuestion } from './types'

/**
 * Picks a hex for the AI to attempt. Prefers cells that extend its own
 * connected group (a light strategic bias), with randomness so it doesn't
 * feel robotic or fully optimal.
 */
export function pickHexForAI(cells: Record<number, CellState>, player: PlayerId): number {
  const open = CELLS.filter((c) => cells[c.id] === 'empty' || cells[c.id] === 'gray')
  if (open.length === 0) throw new Error('No open cells left')

  const scored = open.map((cell) => {
    let score = Math.random() * 2
    const own = neighbors(cell.id).filter((n) => cells[n] === player).length
    score += own * 3
    if (cells[cell.id] === 'gray') score += 0.5 // reclaiming a greyed-out cell is efficient
    return { id: cell.id, score }
  })

  scored.sort((a, b) => b.score - a.score)
  // pick among the top few for some unpredictability
  const pool = scored.slice(0, Math.min(3, scored.length))
  return pool[Math.floor(Math.random() * pool.length)].id
}

// obtiznost 1 (lehká) -> AI si vzpomene skoro vždy; 3 (těžká) -> spíš netriefne.
const DIFFICULTY_ACCURACY: Record<number, number> = { 1: 0.85, 2: 0.65, 3: 0.45 }

function accuracyFor(difficulty: number | undefined): number {
  if (!difficulty) return 0.7
  return DIFFICULTY_ACCURACY[difficulty] ?? 0.7
}

export function aiWillAnswerLetter(question: LetterQuestion): boolean {
  return Math.random() < accuracyFor(question.difficulty)
}

export function aiWillAnswerYesNo(question: YesNoQuestion): boolean {
  return Math.random() < accuracyFor(question.difficulty)
}

/** Which ANO/NE button the AI "presses", given whether it will be correct. */
export function aiPickYesNo(question: YesNoQuestion, willBeCorrect: boolean): boolean {
  return willBeCorrect ? question.correct : !question.correct
}
