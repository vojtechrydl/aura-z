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

/** A letter-tile question: free-text answer, tied to a board letter. */
export interface LetterQuestion {
  id: string
  letter: string
  question: string
  answer: string
  altAnswers: string[]
  category?: string
  difficulty?: number
}

/** A yes/no question used when re-claiming an already-greyed-out field. */
export interface YesNoQuestion {
  id: string
  statement: string
  correct: boolean
  explanation?: string
  category?: string
  difficulty?: number
}

export type ActiveQuestion =
  | { kind: 'letter'; hexId: number; forPlayer: PlayerId; question: LetterQuestion }
  | { kind: 'yesno'; hexId: number; forPlayer: PlayerId; question: YesNoQuestion }

export interface GameState {
  mode: GameMode
  cells: Record<number, CellState>
  /** Letter assigned to each hex at game start; used for the first (letter) attempt. */
  cellLetters: Record<number, string>
  currentPlayer: PlayerId
  players: Record<PlayerId, PlayerConfig>
  activeQuestion: ActiveQuestion | null
  winner: PlayerId | null
  winningPath: number[] | null
  lastResult: {
    hexId: number
    correct: boolean
    player: PlayerId
    kind: 'letter' | 'yesno'
    revealAnswer?: string
    revealExplanation?: string
  } | null
  turnCount: number
}
