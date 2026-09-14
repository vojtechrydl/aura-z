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
- **Finále** — pole mají přidělené písmeno, přesně jako na skutečné hrací
  ploše AZ-kvízu: **A je úplně nahoře, pod ním abecedně B a C, pak D–F** a tak
  dále dolů řádek po řádku. Protože otázek je víc písmen (30), než má deska
  polí (28), každá hra náhodně vynechá dvě písmena — ale rozestavění
  zbylých je vždy přísně abecední, nikdy náhodné. Otázka se vybere podle
  písmena pole až ve chvíli, kdy se na něj klikne.

V obou módech se **odpovídá psaním** (žádné ABCD — volný text jako ve
skutečném pořadu). Odpověď se porovná bez ohledu na velikost písmen,
diakritiku a interpunkci, navíc se uznávají i varianty ze sloupce
`alt_odpovedi`.

- **Klikneš na volné (bílé) pole** → dostaneš jeho otázku a napíšeš odpověď.
  - Správně → pole se zabarví barvou hráče.
  - Špatně / vypršel čas / "Nevím" → **soupeř dostane nabídku otázku
    "ukrást"** (skutečné pravidlo AZ-kvízu, bod 10 pravidel ČT). Musí se
    jasně rozhodnout ANO/NE:
    - **Odmítne** → pole zešedne, tah normálně pokračuje soupeřem.
    - **Přijme** → dostane tu samou otázku, ale **bez nároku na opravu**
      (na rozdíl od původního hráče — jeden pokus, buď uhodne, nebo ne).
      Uhodne → pole získává on. Neuhodne → pole zešedne. V obou případech
      je pak znovu na tahu původní hráč (tah se, jako vždy, prostě střídá
      podle toho, kdo právě odpovídal).
  - Krádež se týká jen čerstvých (bílých) polí — u šedých už ne.
- **Klikneš na šedé pole** → dostaneš **otázku ANO/NE** z druhé sady (bez
  možnosti krádeže). Správně → pole se zabarví; špatně → zůstává šedé a je
  pořád volné.
- **Kdo začíná se losuje náhodně** při startu každé hry (i proti AI) — krátký
  banner nahoře oznámí, kdo vyhrál los.
- Tah se vždy střídá, bez ohledu na výsledek.
- **Vyhrává hráč, jehož souvislá skupina políček stejné barvy spojí
  všechny tři strany trojúhelníku** (Levá / Pravá / Spodní).

## AI protihráč

AZ-kvíz je pod znalostní vrstvou **spojovací hra typu Y** — vyhrává, kdo
propojí všechny tři strany trojúhelníku. AI proto neuvažuje v „sousedech", ale
v tom, kolik polí ještě reálně potřebuje k výhře, a totéž počítá za hráče.
Implementace: [src/game/ai.ts](src/game/ai.ts).

- **Zbývající náklady na výhru** se počítají přesně, ne odhadem. Třikrát
  0-1 BFS (jednou z každé strany) dá pro každé pole vzdálenost k té straně,
  a `min(dL + dP + dD − 2·cena)` přes všechna pole je velikost optimálního
  Steinerova stromu o třech terminálech. Na prázdné desce vyjde 7 — což je
  přesně délka nejkratší výhry.
- **Ohodnocení tahu** je `α·zisk_útok + β·zisk_obrana`, kde se váhy mění podle
  toho, kdo je blíž: když AI prohrává, blokuje (α 1 / β 2), když vede, staví
  (α 2 / β 1). K tomu **očekávaná hodnota** — AI ví, že otázku nemusí trefit
  a že o pole pak může přijít dokvízem.
- **Statická tabulka** (kolika ze 736 minimálních vítězných sedmic pole
  prochází) rozstřeluje shody a rozhoduje otvírku, kde jsou z pohledu nákladů
  všechna pole stejná. Střed desky je 5× cennější než vrchol a rohy — ty sice
  patří dvěma stranám naráz, ale jsou maximálně daleko od té třetí.
- **Taktické zkratky** před běžným ohodnocením: výhru na tahu AI vždy vezme
  a pole, kterým by hráč příští tah vyhrál, vždy zablokuje.
- Dvě odchylky od učebnicového algoritmu, protože tahle hra má jiná pravidla:
  šedé pole tu **není** blokující (jde znovu dobýt otázkou ANO/NE), takže se
  v nákladech počítá stejně jako prázdné a „zčernání" nemá obrannou hodnotu;
  a dokvíz se týká jen čerstvých polí, u šedých tedy AI s krádeží nepočítá.
- Stromové prohledávání (alfa-beta/MCTS) tu záměrně **není** — při větvení 28
  se do plynulého běhu v prohlížeči nevejde a heuristika je na tuhle desku
  dost silná. Celé ohodnocení tahu stojí ~0,2 ms.

Sílu ladí konstanty na začátku souboru (`P_LETTER`, `Q_STEAL`, `GAMMA`,
`JITTER`); `JITTER` je záměrná špetka náhody, aby AI nehrála pokaždé identicky.

## Vzhled a zvuk

- **Tmavý/světlý motiv** — přepínač (☀️/🌙) v pravém horním rohu hlavního
  menu. Volba se ukládá do `localStorage` a platí pro celou appku (i během
  hry), dokud ji hráč nezmění. Implementace: [src/useTheme.ts](src/useTheme.ts)
  nastavuje `data-theme` na `<html>`, veškeré barvy jsou v
  [src/index.css](src/index.css) vyjádřené přes CSS proměnné (včetně
  Tailwindích vestavěných `--color-white`/`--color-emerald-*`/`--color-rose-*`),
  takže žádná komponenta nemá motiv natvrdo zadrátovaný.
- **Zvukové efekty** — krátké tóny generované za běhu přes Web Audio API
  ([src/game/sounds.ts](src/game/sounds.ts)), žádné externí zvukové soubory.
  Správná/špatná odpověď, start hry, výhra, klik na pole. Ztlumit jde
  ikonou 🔊/🔇 v herním HUD (uloží se do `localStorage`).
- **Ikony pro mobil** — `public/favicon.svg` je zdroj (hex logo na tmavém
  podkladu), `apple-touch-icon.png` + `icon-192.png`/`icon-512.png` +
  `manifest.webmanifest` jsou z něj vyrenderované PNG varianty (bez nich
  mobilní prohlížeče/„Přidat na plochu" ukazují prázdnou/výchozí ikonu —
  SVG favicon samo o sobě na mobilu nestačí). Při změně loga je potřeba PNG
  znovu vygenerovat, např. přes `qlmanage -t -s 1024 -o <dir> favicon.svg`
  (macOS QuickLook, umí vykreslit SVG) a `sips -z <N> <N>` na zmenšení.

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

Aktuálně 360 otázek (12 na každé z 30 písmen). V módu Finále je potřeba
**aspoň tolik různých písmen, kolik chceš mít na desce (28)** — při méně
unikátních písmenech se některá zopakují na víc polích, při víc (jako teď)
se každou hru náhodně vynechají dvě. V módu Classic stačí, aby bylo
v souboru aspoň 28 otázek celkem.

### `public/questions-yesno.csv` — dotahy na šedá pole

```csv
id,tvrzeni,spravne,vysvetleni,kategorie,obtiznost,trvanlivost
AN-001,Instagram původně vznikl jako aplikace na check-iny do podniků.,ANO,Jmenoval se Burbn.,Sítě a appky,2,evergreen
```

- `spravne` — `ANO` nebo `NE`.
- `vysvetleni` — nepovinné, zobrazí se po odpovědi jako bonus info.

Aktuálně 70 otázek.

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
    ai.ts                     # AI protihráč (strategie výběru pole, přesnost, ANO/NE)
    sounds.ts                  # syntetizované zvukové efekty (Web Audio API)
  components/        # UI (deska, menu, otázka, nabídka krádeže, HUD, výhra…)
  useTheme.ts          # tmavý/světlý motiv (localStorage + data-theme na <html>)
public/
  questions-letters.csv   # hlavní banka otázek (na písmeno)
  questions-yesno.csv      # dotahy na šedá pole (ANO/NE)
  favicon.svg, apple-touch-icon.png, icon-192/512.png, manifest.webmanifest
                            # ikony pro mobil (viz níže)
server.js              # produkční static server (Railway)
railway.json            # Railway build/deploy konfigurace
```

## Roadmapa (další fáze)

- Online multiplayer (WebSocket server + místnosti) — bude potřeba backend
  a pravděpodobně Postgres/Redis pro stav místností.
- Ukládání skóre / statistik hráčů.
- Filtr kategorií/obtížnosti a využití pole `trvanlivost` (např. schovat
  "sezónní" otázky po uplynutí jejich aktuálnosti).
