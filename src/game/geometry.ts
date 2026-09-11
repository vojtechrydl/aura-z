import { CELLS, BOARD_ROWS } from './board'

/**
 * Pointy-top hex layout, rows stacked into a triangle.
 * `size` = center-to-vertex radius.
 */
export function makeLayout(size: number) {
  const width = Math.sqrt(3) * size // horizontal extent (vertical edge to vertical edge)
  const height = 2 * size // vertical extent (top vertex to bottom vertex)
  const spacingX = width
  const spacingY = height * 0.75

  const positions = new Map<number, { x: number; y: number }>()
  for (const cell of CELLS) {
    const x = (cell.col - (cell.row - 1) / 2) * spacingX
    const y = (cell.row - 1) * spacingY
    positions.set(cell.id, { x, y })
  }

  const totalWidth = (BOARD_ROWS - 1) * spacingX + width
  const totalHeight = (BOARD_ROWS - 1) * spacingY + height

  // pointy-top vertices relative to center
  const points = [
    [0, -size],
    [width / 2, -size / 2],
    [width / 2, size / 2],
    [0, size],
    [-width / 2, size / 2],
    [-width / 2, -size / 2],
  ]
  const polygonPoints = points.map(([px, py]) => `${px},${py}`).join(' ')

  return { size, width, height, spacingX, spacingY, positions, totalWidth, totalHeight, polygonPoints }
}

export type Layout = ReturnType<typeof makeLayout>
