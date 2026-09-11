# Aura Z

Hexagonová kvízová hra pro Gen Z — jako AZ-kvíz České televize, ale s otázkami
mířenými na internetovou/Gen Z kulturu. Hráči se střídají po tazích a
odpovídají na otázky, aby si zabarvili hexová pole na trojúhelníkové desně
(28 polí, 7 řad). Kdo první propojí svou barvou libovolné dvě ze tří stran
trojúhelníku, vyhrává. Špatná odpověď políčko zešedne a je znovu volné pro
libovolného hráče.

**Fáze 1 (hotovo):** lokální multiplayer (2 hráči na jednom zařízení,
"pass & play") a singleplayer proti AI.

## Tech stack

- **React 19 + TypeScript + Vite** — čistě klientská hra, žádný herní
  server/databáze není potřeba (multiplayer je na jednom zařízení).
- **Tailwind CSS v4** — vizuální styl.
- **PapaParse** — otázky se načítají za běhu z [`public/questions.csv`](public/questions.csv),
  takže výměna otázek nevyžaduje žádný build krok ani zásah do kódu.
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

## Formát otázek (`public/questions.csv`)

```csv
question,option_a,option_b,option_c,option_d,correct,category,difficulty
"Text otázky?",Možnost A,Možnost B,Možnost C,Možnost D,B,kategorie,lehká
```

- `correct` — písmeno správné odpovědi: `A`/`B`/`C`/`D`.
- `category`, `difficulty` — nepovinné, `difficulty` (`lehká`/`střední`/`těžká`)
  ovlivňuje, jak často AI protihráč odpoví správně.
- Pole obsahující čárku nebo uvozovky musí být v uvozovkách (`"..."`), uvozovky
  uvnitř se zdvojují (`""`) — standardní CSV escaping.

Chcete-li nahradit otázky vlastními: stačí přepsat obsah
`public/questions.csv` (zachovat hlavičku sloupců) a nasadit — žádný jiný
zásah do kódu není potřeba.

## Nasazení na Railway

1. Repozitář je na GitHubu: propojte ho v Railway přes *New Project → Deploy
   from GitHub repo*.
2. Railway auto-detekuje Node.js projekt (Nixpacks) a použije konfiguraci z
   [`railway.json`](railway.json): `npm run build` při buildu, `npm start`
   při spuštění.
3. Není potřeba nastavovat žádné env proměnné ani databázi pro fázi 1.

## Herní pravidla

- Deska: trojúhelník ze 7 řad hexů (1+2+3+4+5+6+7 = 28 polí), strany označené
  Levá / Pravá / Spodní.
- Na tahu hráč klikne na volné (bílé/šedé) pole → zobrazí se otázka se 4
  možnostmi a časovým limitem.
- Správná odpověď → pole se zabarví barvou hráče. Špatná odpověď / vypršel čas
  → pole zešedne a je opět volné pro kohokoli.
- Tah se vždy střídá, bez ohledu na výsledek.
- Vítězí hráč, jehož souvislá skupina políček stejné barvy se dotýká
  libovolných dvou ze tří stran trojúhelníku.

## Struktura projektu

```
src/
  game/
    board.ts        # deska, sousednost hexů, výherní podmínka (BFS)
    geometry.ts      # pixelové souřadnice hexů (SVG)
    types.ts         # sdílené typy
    useGame.ts       # herní stav (reducer-like hook)
    useQuestions.ts  # načtení + parsování questions.csv
    ai.ts            # logika AI protihráče (výběr pole, přesnost odpovědí)
  components/        # UI (deska, menu, otázka, HUD, výhra…)
public/
  questions.csv       # banka otázek
server.js              # produkční static server (Railway)
railway.json            # Railway build/deploy konfigurace
```

## Roadmapa (další fáze)

- Online multiplayer (WebSocket server + místnosti) — bude potřeba backend
  a pravděpodobně Postgres/Redis pro stav místností.
- Ukládání skóre / statistik hráčů.
- Vlastní kategorie a filtr obtížnosti před hrou.
