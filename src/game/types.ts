export type PlayerId = 1 | 2

export type CellState = 'empty' | 'gray' | 1 | 2

export type Side = 'left' | 'right' | 'bottom'

export type GameMode = 'local' | 'ai'

/**
 * Classic: numbered tiles, one question randomly pre-drawn per tile at game
 * start (no letter tie-in — pure lottery, like the show's classic board).
 * Finále: lettered tiles, question drawn to match the tile's letter when
 * it's opened (the real AZ-kvíz mechanic).
 */
export type BoardVariant = 'classic' | 'finale'

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
  | { kind: 'letter'; hexId: number; forPlayer: PlayerId; question: LetterQuestion; isSteal?: boolean }
  | { kind: 'yesno'; hexId: number; forPlayer: PlayerId; question: YesNoQuestion }

/**
 * A real AZ-kvíz rule (bod 10 pravidel ČT): when the picking player misses a
 * fresh (letter/number) question, the opponent gets a one-shot "dokvíz" —
 * they must clearly accept or decline before they're shown the same
 * question again. No retry if they get it wrong, unlike the original asker.
 */
export interface StealOffer {
  hexId: number
  question: LetterQuestion
  originalPlayer: PlayerId
  stealingPlayer: PlayerId
}

export interface GameState {
  mode: GameMode
  variant: BoardVariant
  cells: Record<number, CellState>
  /** Finále only: letter assigned to each hex at game start, shown on the tile. */
  cellLetters: Record<number, string>
  /** Classic only: the one question pre-drawn for each hex at game start. */
  cellQuestions: Record<number, LetterQuestion>
  currentPlayer: PlayerId
  players: Record<PlayerId, PlayerConfig>
  activeQuestion: ActiveQuestion | null
  stealOffer: StealOffer | null
  winner: PlayerId | null
  winningPath: number[] | null
  lastResult: {
    hexId: number
    correct: boolean
    player: PlayerId
    kind: 'letter' | 'yesno'
    revealAnswer?: string
    revealExplanation?: string
    wasSteal?: boolean
  } | null
  turnCount: number
}
