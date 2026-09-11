import { useState } from 'react'
import { MainMenu } from './components/MainMenu'
import { GameScreen } from './components/GameScreen'
import { useQuestions } from './game/useQuestions'
import type { GameMode } from './game/types'

interface Session {
  mode: GameMode
  p1: string
  p2: string
  key: number
}

export default function App() {
  const { letterQuestions, yesNoQuestions, error } = useQuestions()
  const [session, setSession] = useState<Session | null>(null)
  const ready = !!letterQuestions && !!yesNoQuestions

  if (!session) {
    return (
      <MainMenu
        onStart={(mode, p1, p2) => setSession({ mode, p1, p2, key: Date.now() })}
        questionsError={error}
        questionsCount={ready ? letterQuestions!.length : null}
      />
    )
  }

  return (
    <GameScreen
      key={session.key}
      mode={session.mode}
      p1Name={session.p1}
      p2Name={session.p2}
      letterQuestions={letterQuestions ?? []}
      yesNoQuestions={yesNoQuestions ?? []}
      onExit={() => setSession(null)}
    />
  )
}
