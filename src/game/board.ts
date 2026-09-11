import type { Side } from './types'

export const BOARD_ROWS = 7

export interface HexCell {
  id: number
  row: number // 1..7
  col: number // 0..row-1
  sides: Side[]
}

/**
 * Builds the 28-hex triangular board, numbered top-to-bottom, left-to-right,
 * matching a 7-row triangle (1, 2, 3, 4, 5, 6, 7 hexes per row).
 */
function buildCells(): HexCell[] {
  const cells: HexCell[] = []
  let id = 1
  for (let row = 1; row <= BOARD_ROWS; row++) {
    for (let col = 0; col < row; col++) {
      const sides: Side[] = []
      if (col === 0) sides.push('left')
      if (col === row - 1) sides.push('right')
      if (row === BOARD_ROWS) sides.push('bottom')
      cells.push({ id, row, col, sides })
      id++
    }
  }
  return cells
}

export const CELLS: HexCell[] = buildCells()
export const CELLS_BY_ID: Record<number, HexCell> = Object.fromEntries(
  CELLS.map((c) => [c.id, c]),
)

function findId(row: number, col: number): number | null {
  if (row < 1 || row > BOARD_ROWS) return null
  if (col < 0 || col >= row) return null
  return CELLS.find((c) => c.row === row && c.col === col)?.id ?? null
}

const neighborCache = new Map<number, number[]>()

export function neighbors(id: number): number[] {
  if (neighborCache.has(id)) return neighborCache.get(id)!
  const cell = CELLS_BY_ID[id]
  const { row, col } = cell
  const candidates = [
    findId(row, col - 1), // same row, left
    findId(row, col + 1), // same row, right
    findId(row - 1, col - 1), // row above, left
    findId(row - 1, col), // row above, right
    findId(row + 1, col), // row below, left
    findId(row + 1, col + 1), // row below, right
  ]
  const result = candidates.filter((v): v is number => v !== null)
  neighborCache.set(id, result)
  return result
}

export const SIDE_LABELS: Record<Side, string> = {
  left: 'Levá strana',
  right: 'Pravá strana',
  bottom: 'Spodní strana',
}

/**
 * Checks whether a player's set of claimed hex ids forms a connected group
 * that touches all three triangle sides. Returns the connected winning path
 * if found, otherwise null.
 */
export function checkWin(claimedIds: Set<number>): number[] | null {
  const visited = new Set<number>()

  for (const start of claimedIds) {
    if (visited.has(start)) continue

    // BFS to find the connected component containing `start`.
    const component: number[] = []
    const queue = [start]
    visited.add(start)
    const touchedSides = new Set<Side>()

    while (queue.length) {
      const current = queue.shift()!
      component.push(current)
      for (const side of CELLS_BY_ID[current].sides) touchedSides.add(side)
      for (const n of neighbors(current)) {
        if (claimedIds.has(n) && !visited.has(n)) {
          visited.add(n)
          queue.push(n)
        }
      }
    }

    if (touchedSides.size === 3) {
      return component
    }
  }

  return null
}
