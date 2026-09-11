import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import type { Question } from './types'

interface CsvRow {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct: string
  category?: string
  difficulty?: string
}

const CORRECT_INDEX: Record<string, 0 | 1 | 2 | 3> = { A: 0, B: 1, C: 2, D: 3 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Papa.parse<CsvRow>(`${import.meta.env.BASE_URL}questions.csv`, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (cancelled) return
        try {
          const parsed: Question[] = result.data
            .filter((row) => row.question && row.option_a)
            .map((row, i) => {
              const correctIndex = CORRECT_INDEX[(row.correct || 'A').trim().toUpperCase()] ?? 0
              return {
                id: `${i}-${row.question.slice(0, 24)}`,
                question: row.question.trim(),
                options: [row.option_a, row.option_b, row.option_c, row.option_d].map((o) =>
                  (o ?? '').trim(),
                ) as [string, string, string, string],
                correctIndex,
                category: row.category?.trim(),
                difficulty: row.difficulty?.trim(),
              }
            })
          setQuestions(shuffle(parsed))
        } catch {
          setError('Nepodařilo se zpracovat otázky.')
        }
      },
      error: () => {
        if (!cancelled) setError('Nepodařilo se načíst soubor questions.csv.')
      },
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { questions, error }
}
