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
  const { questions, error } = useQuestions()
  const [session, setSession] = useState<Session | null>(null)

  if (!session) {
    return (
      <MainMenu
        onStart={(mode, p1, p2) => setSession({ mode, p1, p2, key: Date.now() })}
        questionsError={error}
        questionsCount={questions?.length ?? null}
      />
    )
  }

  return (
    <GameScreen
      key={session.key}
      mode={session.mode}
      p1Name={session.p1}
      p2Name={session.p2}
      questions={questions ?? []}
      onExit={() => setSession(null)}
    />
  )
}
