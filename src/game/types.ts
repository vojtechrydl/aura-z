export type PlayerId = 1 | 2

export type CellState = 'empty' | 'gray' | 1 | 2

export type Side = 'left' | 'right' | 'bottom'

export type GameMode = 'local' | 'ai'

export interface PlayerConfig {
  id: PlayerId
  name: string
  color: string
  colorSoft: string
  isAI: boolean
}

export interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  category?: string
  difficulty?: string
}

export interface ActiveQuestion {
  hexId: number
  question: Question
  forPlayer: PlayerId
}

export interface GameState {
  mode: GameMode
  cells: Record<number, CellState>
  currentPlayer: PlayerId
  players: Record<PlayerId, PlayerConfig>
  activeQuestion: ActiveQuestion | null
  usedQuestionIds: Set<string>
  winner: PlayerId | null
  winningPath: number[] | null
  lastResult: { hexId: number; correct: boolean; player: PlayerId } | null
  turnCount: number
}
