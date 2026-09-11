import { CELLS } from './board'
import type { LetterQuestion } from './types'

// Extended Czech alphabet, used to sort letters into their real collation
// order (Č after C, CH as its own letter between H and I, Ř after R, Š
// after S, Ž after Z) — a plain string sort would get all of these wrong.
const CZECH_ALPHABET = [
  'A', 'B', 'C', 'Č', 'D', 'E', 'F', 'G', 'H', 'CH', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'Ř', 'S', 'Š', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ž',
]

function sortCzech(letters: string[]): string[] {
  return [...letters].sort((a, b) => {
    const ai = CZECH_ALPHABET.indexOf(a)
    const bi = CZECH_ALPHABET.indexOf(b)
    if (ai === -1 || bi === -1) return a.localeCompare(b, 'cs')
    return ai - bi
  })
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Assigns one letter to every hex on the board — alphabetically, matching
 * the real AZ-kvíz board: A sits at the very top corner, then B and C on
 * the next row, and so on down through the triangle (CELLS is already
 * ordered top-to-bottom, left-to-right, so placing sorted letters straight
 * across it in order does exactly that — no shuffling of positions).
 *
 * If there are more letters with questions than cells (there usually are),
 * a random subset the size of the board is drawn each game for variety,
 * then that subset is re-sorted alphabetically before placing — so which
 * letters appear changes game to game, but the layout is always A-to-Z
 * top to bottom, never scrambled across the board.
 */
export function assignCellLetters(availableLetters: string[]): Record<number, string> {
  if (availableLetters.length === 0) {
    throw new Error('No letters available to assign to the board')
  }
  const sortedAll = sortCzech(availableLetters)
  const needed = CELLS.length
  const chosen = sortedAll.length <= needed ? sortedAll : sortCzech(shuffle(sortedAll).slice(0, needed))

  const result: Record<number, string> = {}
  CELLS.forEach((cell, i) => {
    result[cell.id] = chosen[i % chosen.length]
  })
  return result
}

/**
 * Classic mode: pre-draws one random question per hex at game start,
 * independent of any letter — a straight lottery over the whole bank. Each
 * tile gets a distinct question as long as the bank is at least as big as
 * the board (it is: 360 questions for 28 tiles); otherwise questions repeat.
 */
export function assignCellQuestions(pool: LetterQuestion[]): Record<number, LetterQuestion> {
  if (pool.length === 0) {
    throw new Error('No questions available to assign to the board')
  }
  const shuffled = shuffle(pool)
  const result: Record<number, LetterQuestion> = {}
  CELLS.forEach((cell, i) => {
    result[cell.id] = shuffled[i % shuffled.length]
  })
  return result
}
