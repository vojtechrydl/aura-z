/**
 * Tiny synthesized sound-effect module. Every effect is a short sequence of
 * oscillator tones (Web Audio API) rather than an audio file — no assets to
 * host/license, and it stays under a kilobyte of code. Playback is muted
 * until a real user gesture happens (browser autoplay policy); since every
 * call site here is already inside a click handler, that's a non-issue.
 */

const STORAGE_KEY = 'aura-z-sound-enabled'

let ctx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

interface Tone {
  freq: number
  duration: number
  type?: OscillatorType
  gain?: number
  /** seconds after the sequence starts */
  delay?: number
}

function playTone(audioCtx: AudioContext, startAt: number, tone: Tone) {
  const { freq, duration, type = 'sine', gain = 0.15, delay = 0 } = tone
  const osc = audioCtx.createOscillator()
  const env = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  const start = startAt + delay
  env.gain.setValueAtTime(0, start)
  env.gain.linearRampToValueAtTime(gain, start + 0.015)
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(env)
  env.connect(audioCtx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

function playSequence(tones: Tone[]) {
  if (!isSoundEnabled()) return
  const audioCtx = getAudioContext()
  if (!audioCtx) return
  const now = audioCtx.currentTime
  for (const tone of tones) playTone(audioCtx, now, tone)
}

/** Short bright chime — correct answer. */
export function playCorrect() {
  playSequence([
    { freq: 523.25, duration: 0.14, type: 'sine', gain: 0.16 }, // C5
    { freq: 783.99, duration: 0.22, type: 'sine', gain: 0.18, delay: 0.09 }, // G5
  ])
}

/** Short low buzz — wrong answer / timeout. */
export function playWrong() {
  playSequence([
    { freq: 220, duration: 0.22, type: 'sawtooth', gain: 0.09 }, // A3
    { freq: 174.61, duration: 0.28, type: 'sawtooth', gain: 0.09, delay: 0.1 }, // F3
  ])
}

/** Upbeat rising triad — game starting. */
export function playGameStart() {
  playSequence([
    { freq: 392, duration: 0.12, type: 'triangle', gain: 0.14 }, // G4
    { freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.14, delay: 0.1 }, // C5
    { freq: 659.25, duration: 0.2, type: 'triangle', gain: 0.16, delay: 0.2 }, // E5
  ])
}

/** Four-note ascending fanfare — win. */
export function playWin() {
  playSequence([
    { freq: 523.25, duration: 0.14, type: 'sine', gain: 0.16 }, // C5
    { freq: 659.25, duration: 0.14, type: 'sine', gain: 0.16, delay: 0.12 }, // E5
    { freq: 783.99, duration: 0.14, type: 'sine', gain: 0.18, delay: 0.24 }, // G5
    { freq: 1046.5, duration: 0.35, type: 'sine', gain: 0.2, delay: 0.36 }, // C6
  ])
}

/** Subtle tick — selecting a tile. */
export function playClick() {
  playSequence([{ freq: 700, duration: 0.05, type: 'sine', gain: 0.07 }])
}
