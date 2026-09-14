import { CELLS, neighbors } from './board'
import type { CellState, LetterQuestion, PlayerId, YesNoQuestion } from './types'

/**
 * AZ-kvíz je spojovací hra typu Y: vyhrává, kdo svými poli propojí všechny tři
 * strany trojúhelníku. AI proto neuvažuje v "sousedech", ale v tom, kolik polí
 * ještě reálně potřebuje k výhře (Steinerův strom o třech terminálech) — a
 * totéž počítá za soupeře, aby uměla blokovat.
 *
 * Celé ohodnocení tahu stojí ~0,2 ms, takže se počítá naostro při každém tahu
 * (AI stejně "přemýšlí" 850 ms kvůli tempu hry). Stromové prohledávání
 * (alfa-beta/MCTS) tu záměrně není — při větvení 28 by se to do plynulého
 * běhu v prohlížeči nevešlo a heuristika níž je na tuhle desku dost silná.
 */

const N = CELLS.length // 28
/** Cena nedosažitelného pole. Konečná, aby se s ní dalo počítat bez NaN. */
const INF = 99

/** Sousedé jako 0-based indexy (id − 1), spočítané jednou. */
const NB: number[][] = CELLS.map((c) => neighbors(c.id).map((n) => n - 1))

/** Startovní pole pro tři BFS — levá strana, pravá strana, spodní řada. */
const SIDE_SOURCES: number[][] = [
  CELLS.filter((c) => c.sides.includes('left')).map((c) => c.id - 1),
  CELLS.filter((c) => c.sides.includes('right')).map((c) => c.id - 1),
  CELLS.filter((c) => c.sides.includes('bottom')).map((c) => c.id - 1),
]

/**
 * Kolika z 736 minimálních vítězných sedmic dané pole prochází. Deska se
 * nemění, takže je to konstanta (ověřeno vyčerpávajícím výčtem všech
 * souvislých sedmic, které se dotýkají všech tří stran):
 *
 * ```
 *                64
 *             126  126
 *          176  216  176
 *       196  268  268  196
 *    176  268  304  268  176
 * 126  216  268  268  216  126
 * 64 126  176  196  176  126   64
 * ```
 *
 * Střed je 5× cennější než vrchol a rohy — ty sice patří dvěma stranám
 * naráz, ale jsou maximálně daleko od té třetí, což se přesně vyruší.
 */
const CELL_WEIGHT = [
  64, 126, 126, 176, 216, 176, 196, 268, 268, 196, 176, 268, 304, 268, 176, 126, 216, 268, 268,
  216, 126, 64, 126, 176, 196, 176, 126, 64,
]
const MAX_WEIGHT = 304

/** Šance, že AI trefí čerstvou (písmenkovou) otázku — viz DIFFICULTY_ACCURACY. */
const P_LETTER = 0.7
/** Šedé pole se dobývá otázkou ANO/NE, takže i tipem se trefí v 50 %. */
const P_YESNO = 0.82
/** Šance, že soupeř využije dokvíz a pole si vezme, když AI mine. */
const Q_STEAL = 0.55
/** Váha statické tabulky — rozhoduje jen tam, kde je situace v rovnováze. */
const GAMMA = 0.3
/** Špetka náhody, ať AI nehraje pokaždé identicky. Nepřebije taktický rozdíl. */
const JITTER = 0.15

// Pracovní buffery na úrovni modulu — ohodnocení tahu volá bfs() ~170×,
// tohle ušetří stejný počet alokací.
const price = new Int32Array(N)
const dist = [new Int32Array(N), new Int32Array(N), new Int32Array(N)]
const deque = new Int32Array(1024)
/** 0 = volné (prázdné i šedé), 1/2 = zabrané hráčem. */
const occupancy = new Int32Array(N)
const isGray = new Uint8Array(N)

/**
 * 0-1 BFS (fronta typu deque — levná náhrada Dijkstry, hrany mají jen váhy
 * 0 a 1) ze všech polí jedné strany. `out[v]` = kolik polí musí hráč ještě
 * získat, aby se z `v` dostal k té straně.
 */
function bfs(out: Int32Array, sources: number[]): void {
  out.fill(INF)
  let head = 512
  let tail = 512
  for (const s of sources) {
    const w = price[s]
    if (w >= INF || w >= out[s]) continue
    out[s] = w
    if (w === 0) deque[--head] = s
    else deque[tail++] = s
  }
  while (head < tail) {
    const v = deque[head++]
    const dv = out[v]
    for (const u of NB[v]) {
      const w = price[u]
      if (w >= INF) continue
      const nd = dv + w
      if (nd < out[u]) {
        out[u] = nd
        if (w === 0) deque[--head] = u
        else deque[tail++] = u
      }
    }
  }
}

/**
 * Kolik polí ještě hráč potřebuje k výhře při současném rozložení desky.
 * 0 = už vyhrál, INF = vyhrát už nemůže.
 *
 * Pro tři terminály má optimální Steinerův strom nejvýš jeden větvící uzel,
 * takže `min(dL + dP + dD − 2·cena)` není heuristika, ale přesný výsledek
 * (cena větvícího uzlu se ve třech cestách započítá třikrát, dvakrát se
 * proto odečte).
 *
 * Šedé pole se tu počítá stejně jako prázdné — v téhle hře není blokující,
 * jde jen znovu dobýt otázkou ANO/NE.
 */
function connectionCost(player: PlayerId): number {
  for (let i = 0; i < N; i++) {
    const owner = occupancy[i]
    price[i] = owner === player ? 0 : owner === 0 ? 1 : INF
  }
  bfs(dist[0], SIDE_SOURCES[0])
  bfs(dist[1], SIDE_SOURCES[1])
  bfs(dist[2], SIDE_SOURCES[2])

  let best = INF
  for (let i = 0; i < N; i++) {
    const p = price[i]
    if (p >= INF) continue
    const total = dist[0][i] + dist[1][i] + dist[2][i] - 2 * p
    if (total < best) best = total
  }
  return best > INF ? INF : best
}

/** Když prohrávám, blokuju; když vedu, stavím. */
function attackDefenceWeights(costMe: number, costOpp: number): [number, number] {
  if (costOpp < costMe) return [1.0, 2.0]
  if (costMe < costOpp) return [2.0, 1.0]
  return [1.5, 1.5]
}

function loadBoard(cells: Record<number, CellState>): number[] {
  const open: number[] = []
  for (let i = 0; i < N; i++) {
    const s = cells[i + 1]
    occupancy[i] = s === 1 ? 1 : s === 2 ? 2 : 0
    isGray[i] = s === 'gray' ? 1 : 0
    if (occupancy[i] === 0) open.push(i)
  }
  return open
}

/**
 * Očekávaný přínos tahu na pole `f`. Bere v úvahu, že AI otázku nemusí
 * trefit — pak pole buď ukradne soupeř, nebo zšedne (což nemění nic, šedé
 * pole je pro oba pořád stejně dostupné jako prázdné, proto ta větev ve
 * vzorci chybí).
 */
function moveValue(
  f: number,
  me: PlayerId,
  opp: PlayerId,
  costMe: number,
  costOpp: number,
  alpha: number,
  beta: number,
): number {
  occupancy[f] = me
  const gainMine = alpha * (costMe - connectionCost(me)) + beta * (connectionCost(opp) - costOpp)
  occupancy[f] = opp
  const gainTheirs = alpha * (costMe - connectionCost(me)) + beta * (connectionCost(opp) - costOpp)
  occupancy[f] = 0

  const p = isGray[f] ? P_YESNO : P_LETTER
  // Dokvíz se týká jen čerstvých polí, na šedá (ANO/NE) ne — když AI mine
  // šedé pole, prostě zůstane šedé a soupeř ho nedostane zadarmo.
  const q = isGray[f] ? 0 : Q_STEAL

  return (
    p * gainMine + (1 - p) * q * gainTheirs + GAMMA * (CELL_WEIGHT[f] / MAX_WEIGHT)
  )
}

/**
 * Vybere pole, o které se AI pokusí.
 *
 * 1. Výhra na tahu — ber ji.
 * 2. Obrana matu — pokud má soupeř pole, kterým příští tah vyhraje, vezmi ho.
 *    (Blokovat jde jen ziskem pole: neúspěch ho nechá šedé, a tedy volné.)
 * 3. Jinak nejvyšší EV přes všechna volná pole.
 */
export function pickHexForAI(cells: Record<number, CellState>, player: PlayerId): number {
  const open = loadBoard(cells)
  if (open.length === 0) throw new Error('No open cells left')

  const opponent: PlayerId = player === 1 ? 2 : 1
  const costMe = connectionCost(player)
  const costOpp = connectionCost(opponent)

  // 1 — výhra na tahu
  const winningNow: number[] = []
  // 2 — pole, kterými by příští tah vyhrál soupeř
  const opponentMates: number[] = []
  for (const f of open) {
    occupancy[f] = player
    if (connectionCost(player) === 0) winningNow.push(f)
    occupancy[f] = opponent
    if (connectionCost(opponent) === 0) opponentMates.push(f)
    occupancy[f] = 0
  }
  if (winningNow.length > 0) {
    return pickBest(winningNow, player, opponent, costMe, costOpp) + 1
  }

  // Víc než jedno matové pole se pokrýt nedá, ale vzít jedno je pořád lepší
  // než hrát dál po svém — soupeř na něm ještě může otázku minout.
  const candidates = opponentMates.length > 0 ? opponentMates : open
  return pickBest(candidates, player, opponent, costMe, costOpp) + 1
}

function pickBest(
  candidates: number[],
  me: PlayerId,
  opp: PlayerId,
  costMe: number,
  costOpp: number,
): number {
  const [alpha, beta] = attackDefenceWeights(costMe, costOpp)
  let best = -Infinity
  let bestCell = candidates[0]
  for (const f of candidates) {
    const score =
      moveValue(f, me, opp, costMe, costOpp, alpha, beta) + Math.random() * JITTER
    if (score > best) {
      best = score
      bestCell = f
    }
  }
  return bestCell
}

// obtiznost 1 (lehká) -> AI si vzpomene skoro vždy; 3 (těžká) -> spíš netriefne.
const DIFFICULTY_ACCURACY: Record<number, number> = { 1: 0.85, 2: 0.65, 3: 0.45 }

function accuracyFor(difficulty: number | undefined): number {
  if (!difficulty) return 0.7
  return DIFFICULTY_ACCURACY[difficulty] ?? 0.7
}

export function aiWillAnswerLetter(question: LetterQuestion): boolean {
  return Math.random() < accuracyFor(question.difficulty)
}

export function aiWillAnswerYesNo(question: YesNoQuestion): boolean {
  return Math.random() < accuracyFor(question.difficulty)
}

/** Which ANO/NE button the AI "presses", given whether it will be correct. */
export function aiPickYesNo(question: YesNoQuestion, willBeCorrect: boolean): boolean {
  return willBeCorrect ? question.correct : !question.correct
}
