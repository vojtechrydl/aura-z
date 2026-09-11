import { useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { GameScreen } from './components/GameScreen'
import { useQuestions } from './game/useQuestions'
import { useTheme } from './useTheme'
import type { BoardVariant, GameMode } from './game/types'

interface Session {
  mode: GameMode
  variant: BoardVariant
  p1: string
  p2: string
  key: number
}

export default function App() {
  const { letterQuestions, yesNoQuestions, error } = useQuestions()
  const [session, setSession] = useState<Session | null>(null)
  const [theme, setTheme] = useTheme()
  const ready = !!letterQuestions && !!yesNoQuestions

  if (!session) {
    return (
      <MainMenu
        onStart={(mode, variant, p1, p2) => setSession({ mode, variant, p1, p2, key: Date.now() })}
        questionsError={error}
        questionsCount={ready ? letterQuestions!.length : null}
        theme={theme}
        onThemeChange={setTheme}
      />
    )
  }

  return (
    <GameScreen
      key={session.key}
      mode={session.mode}
      variant={session.variant}
      p1Name={session.p1}
      p2Name={session.p2}
      letterQuestions={letterQuestions ?? []}
      yesNoQuestions={yesNoQuestions ?? []}
      onExit={() => setSession(null)}
    />
  )
}
