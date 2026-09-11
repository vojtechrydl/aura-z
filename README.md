# Aura Z

Hexagonová kvízová hra pro Gen Z — jako AZ-kvíz České televize, ale s otázkami
mířenými na internetovou/Gen Z kulturu. Hráči se střídají po tazích a
odpovídají na otázky, aby si zabarvili hexová pole na trojúhelníkové desce
(28 polí, 7 řad). Kdo první propojí svou barvou všechny tři strany
trojúhelníku, vyhrává. Špatná odpověď políčko zešedne a je znovu volné pro
libovolného hráče.

**Fáze 1 (hotovo):** lokální multiplayer (2 hráči na jednom zařízení,
"pass & play") a singleplayer proti AI.

## Tech stack

- **React 19 + TypeScript + Vite** — čistě klientská hra, žádný herní
  server/databáze není potřeba (multiplayer je na jednom zařízení).
- **Tailwind CSS v4** — vizuální styl.
- **PapaParse** — otázky se načítají za běhu ze dvou CSV souborů v `public/`
  (viz níže), takže výměna otázek nevyžaduje žádný build krok ani zásah do
  kódu.
- **Express** (`server.js`) — jednoduchý produkční static server pro Railway
  (Vite dev server se používá jen lokálně).

Databáze zatím záměrně není — pro lokální multiplayer/AI mód není potřeba a
zbytečně by zvyšovala náklady a komplexitu. Až přibude reálný online
multiplayer nebo žebříček skóre, dává smysl přidat Postgres (Railway ho nabízí
jedním klikem) + malý backend.

## Vývoj

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # produkční build do dist/
npm start           # spustí Express server nad dist/ (co poběží na Railway)
```

## Herní mechanika

Board má 28 polí. Na výběr jsou dva módy desky:

- **Classic** — pole jsou očíslovaná 1–28. Na začátku hry se pro každé pole
  náhodně vylosuje jedna otázka z celé banky (bez vazby na písmeno) — čistá
  loterie, větší rozptyl.
- **Finále** — pole mají přidělené písmeno (z abecedy, pro kterou existují
  otázky), přesně jako na skutečné hrací ploše AZ-kvízu. Otázka se vybere
  podle písmena pole až ve chvíli, kdy se na něj klikne.

V obou módech se **odpovídá psaním** (žádné ABCD — volný text jako ve
skutečném pořadu). Odpověď se porovná bez ohledu na velikost písmen,
diakritiku a interpunkci, navíc se uznávají i varianty ze sloupce
`alt_odpovedi`.

- **Klikneš na volné (bílé) pole** → dostaneš jeho otázku a napíšeš odpověď.
  - Správně → pole se zabarví barvou hráče.
  - Špatně / vypršel čas → pole **zešedne** a je znovu volné.
- **Klikneš na šedé pole** → tentokrát dostaneš **otázku ANO/NE** z druhé
  sady (v obou módech stejně — druhý pokus se ptá jinak, aby to nebyla
  stejná otázka jako napoprvé). Správně → pole se zabarví; špatně → zůstává
  šedé a je pořád volné.
- Tah se vždy střídá, bez ohledu na výsledek.
- **Vyhrává hráč, jehož souvislá skupina políček stejné barvy spojí
  všechny tři strany trojúhelníku** (Levá / Pravá / Spodní).

## Formát otázek

Dva CSV soubory v `public/`, oba se načítají za běhu — chceš-li nahradit
otázky vlastními, stačí přepsat obsah (zachovat hlavičku sloupců) a nasadit,
žádný zásah do kódu.

### `public/questions-letters.csv` — otázky na písmeno (hlavní sada)

```csv
id,pismeno,otazka,odpoved,alt_odpovedi,kategorie,obtiznost,trvanlivost
AZ-001,A,"Jak se slangově říká vyzařování a charismatu?",Aura,auru,Slang,1,evergreen
```

- `pismeno` — písmeno, ke kterému se otázka váže (musí odpovídat začátku
  `odpoved`). Používá se i vícepísmenné `CH`.
- `odpoved` — kanonická správná odpověď.
- `alt_odpovedi` — další uznávané varianty oddělené `|` (např.
  `"A.I.|ej aj"`). Může být prázdné.
- `obtiznost` — číslo 1–3, ovlivňuje jen to, jak často AI protihráč odpoví
  správně (1 = AI skoro vždy uspěje, 3 = spíš netrefí).
- `trvanlivost` — `evergreen` / `sezónní`, jen metadata pro budoucí filtrování
  (dnes se nepoužívá v herní logice).

V módu Finále je potřeba **aspoň tolik různých písmen, kolik chceš mít na
desce (28)** — při méně unikátních písmenech se některá zopakují na víc
polích. V módu Classic stačí, aby bylo v souboru aspoň 28 otázek celkem.

### `public/questions-yesno.csv` — dotahy na šedá pole

```csv
id,tvrzeni,spravne,vysvetleni,kategorie,obtiznost,trvanlivost
AN-001,Instagram původně vznikl jako aplikace na check-iny do podniků.,ANO,Jmenoval se Burbn.,Sítě a appky,2,evergreen
```

- `spravne` — `ANO` nebo `NE`.
- `vysvetleni` — nepovinné, zobrazí se po odpovědi jako bonus info.

## Nasazení na Railway

1. Repozitář je na GitHubu: propojte ho v Railway přes *New Project → Deploy
   from GitHub repo*.
2. Railway auto-detekuje Node.js projekt (Nixpacks) a použije konfiguraci z
   [`railway.json`](railway.json): `npm run build` při buildu, `npm start`
   při spuštění. `engines.node` v `package.json` vynucuje Node 20+.
3. Není potřeba nastavovat žádné env proměnné ani databázi pro fázi 1.

## Struktura projektu

```
src/
  game/
    board.ts        # deska, sousednost hexů, výherní podmínka (BFS, 3 strany)
    geometry.ts      # pixelové souřadnice hexů (SVG)
    letters.ts        # přiřazení písmen/otázek polím na začátku hry (Finále/Classic)
    normalize.ts       # porovnávání psaných odpovědí (diakritika, varianty)
    types.ts             # sdílené typy
    useGame.ts             # herní stav (cells, cellLetters, activeQuestion…)
    useQuestions.ts          # načtení + parsování obou CSV
    ai.ts                     # AI protihráč (výběr pole, přesnost, ANO/NE)
  components/        # UI (deska, menu, otázka, HUD, výhra…)
public/
  questions-letters.csv   # hlavní banka otázek (na písmeno)
  questions-yesno.csv      # dotahy na šedá pole (ANO/NE)
server.js              # produkční static server (Railway)
railway.json            # Railway build/deploy konfigurace
```

## Roadmapa (další fáze)

- Online multiplayer (WebSocket server + místnosti) — bude potřeba backend
  a pravděpodobně Postgres/Redis pro stav místností.
- Ukládání skóre / statistik hráčů.
- Filtr kategorií/obtížnosti a využití pole `trvanlivost` (např. schovat
  "sezónní" otázky po uplynutí jejich aktuálnosti).
