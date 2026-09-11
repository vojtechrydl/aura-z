import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { splitAltAnswers } from './normalize'
import type { LetterQuestion, YesNoQuestion } from './types'

interface LetterRow {
  id: string
  pismeno: string
  otazka: string
  odpoved: string
  alt_odpovedi?: string
  kategorie?: string
  obtiznost?: string
}

interface YesNoRow {
  id: string
  tvrzeni: string
  spravne: string
  vysvetleni?: string
  kategorie?: string
  obtiznost?: string
}

function parseCsv<T>(path: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    })
  })
}

export function useQuestions() {
  const [letterQuestions, setLetterQuestions] = useState<LetterQuestion[] | null>(null)
  const [yesNoQuestions, setYesNoQuestions] = useState<YesNoQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const base = import.meta.env.BASE_URL

    Promise.all([
      parseCsv<LetterRow>(`${base}questions-letters.csv`),
      parseCsv<YesNoRow>(`${base}questions-yesno.csv`),
    ])
      .then(([letterRows, yesNoRows]) => {
        if (cancelled) return

        const letters: LetterQuestion[] = letterRows
          .filter((row) => row.id && row.pismeno && row.otazka && row.odpoved)
          .map((row) => ({
            id: row.id.trim(),
            letter: row.pismeno.trim().toUpperCase(),
            question: row.otazka.trim(),
            answer: row.odpoved.trim(),
            altAnswers: splitAltAnswers(row.alt_odpovedi),
            category: row.kategorie?.trim(),
            difficulty: row.obtiznost ? Number(row.obtiznost) : undefined,
          }))

        const yesNo: YesNoQuestion[] = yesNoRows
          .filter((row) => row.id && row.tvrzeni && row.spravne)
          .map((row) => ({
            id: row.id.trim(),
            statement: row.tvrzeni.trim(),
            correct: row.spravne.trim().toUpperCase() === 'ANO',
            explanation: row.vysvetleni?.trim(),
            category: row.kategorie?.trim(),
            difficulty: row.obtiznost ? Number(row.obtiznost) : undefined,
          }))

        if (letters.length === 0 || yesNo.length === 0) {
          setError('Soubory s otázkami jsou prázdné nebo mají špatný formát.')
          return
        }

        setLetterQuestions(letters)
        setYesNoQuestions(yesNo)
      })
      .catch(() => {
        if (!cancelled) {
          setError('Nepodařilo se načíst questions-letters.csv / questions-yesno.csv.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { letterQuestions, yesNoQuestions, error }
}
