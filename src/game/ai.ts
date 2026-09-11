import { CELLS, neighbors } from './board'
import type { CellState, PlayerId, Question } from './types'

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

const DIFFICULTY_ACCURACY: Record<string, number> = {
  lehká: 0.85,
  střední: 0.65,
  těžká: 0.45,
}

export function aiWillAnswerCorrectly(question: Question): boolean {
  const base = (question.difficulty ? DIFFICULTY_ACCURACY[question.difficulty] : undefined) ?? 0.7
  return Math.random() < base
}

/** If the AI "gets it right", also pick which option it shows as its answer. */
export function aiPickOptionIndex(question: Question, correct: boolean): number {
  if (correct) return question.correctIndex
  const wrongOptions = [0, 1, 2, 3].filter((i) => i !== question.correctIndex)
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
}
