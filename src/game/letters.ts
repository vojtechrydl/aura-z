import { CELLS } from './board'
import type { LetterQuestion } from './types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Assigns one letter to every hex on the board, drawn from the letters that
 * actually have questions available. If there are at least as many distinct
 * letters as cells, each cell gets a unique letter (mirrors the real
 * AZ-kvíz board); otherwise letters repeat as needed.
 */
export function assignCellLetters(availableLetters: string[]): Record<number, string> {
  if (availableLetters.length === 0) {
    throw new Error('No letters available to assign to the board')
  }
  const shuffled = shuffle(availableLetters)
  const result: Record<number, string> = {}
  CELLS.forEach((cell, i) => {
    result[cell.id] = shuffled[i % shuffled.length]
  })
  return result
}

/**
 * Classic mode: pre-draws one random question per hex at game start,
 * independent of any letter — a straight lottery over the whole bank. Each
 * tile gets a distinct question as long as the bank is at least as big as
 * the board (it is: 180 questions for 28 tiles); otherwise questions repeat.
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
