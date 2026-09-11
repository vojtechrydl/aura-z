# Aura Z — kontext pro Claude

Hexagonová kvízová hra (jako AZ-kvíz ČT, otázky mířené na Gen Z). Čti
[README.md](README.md) pro herní pravidla, strukturu a nasazení — tady jen to,
co README nepokrývá.

## Stav projektu

- Fáze 1 (lokální 2P pass-and-play + singleplayer vs AI) je hotová a funkční.
- Repo je na GitHubu: `vojtechrydl/aura-z` (veřejné). Nasazení na Railway čeká
  na propojení v Railway dashboardu (viz README → Nasazení) — to je jediný
  krok, který nejde udělat z CLI/API bez přihlášení uživatele v prohlížeči.
- Otázky jsou hotové, uživatelovy vlastní (ne placeholder): `public/questions-letters.csv`
  (180 otázek na písmeno, volná textová odpověď) a `public/questions-yesno.csv`
  (34 ANO/NE otázek pro dotahy na šedá pole). Formát obou je zdokumentovaný
  v README → Formát otázek.
- Herní pravidlo: vyhrává hráč, který svou barvou spojí **všechny tři**
  strany trojúhelníku (ne dvě — to byla chyba v původním zadání, opravená
  po zpětné vazbě).
- Dva volitelné módy desky (vybírají se v menu): **Classic** (čísla 1–28,
  otázka na pole vylosovaná náhodně z celé banky při startu hry, bez vazby
  na písmeno) a **Finále** (písmena jako ve skutečném pořadu, otázka se
  vybírá podle písmena pole až při kliknutí). Viz `src/game/types.ts`
  (`BoardVariant`) a `src/game/letters.ts`.
- Světlý motiv a zvukové efekty jsou hotové (viz README → Vzhled a zvuk).
  Zvuky jsou syntetizované za běhu (Web Audio API), žádné audio soubory
  v repu ani k nahrávání.

## Jak pracovat na tomto repu

- Tento projekt je nastaven tak, aby se běžné, nízkorizikové operace
  (npm/git/gh příkazy, editace souborů) neptaly na potvrzení — viz
  [.claude/settings.json](.claude/settings.json). Destruktivní věci (force
  push, `git reset --hard`, mazání Railway prostředí, `rm -rf`, `npm publish`)
  jsou záměrně v deny listu a i tak vyžadují potvrzení uživatele.
- Po každé netriviální změně spusť `npm run build` (typecheck + Vite build),
  ať se chyby chytí hned.
- Commituj a pushuj přímo do `main` (žádný branch-protection flow zatím není
  potřeba — jde o sólo projekt), pokud uživatel neřekne jinak.
- Tailwind v4: barvy/animace definované v `@theme` bloku v
  [src/index.css](src/index.css) (`--color-p1`, `--color-gold`, ...) se
  používají jako běžné utility třídy bez `color-` prefixu, např. `bg-p1`,
  `bg-gold`, `animate-float` — ne `bg-(--color-p1)`.
- **Světlý/tmavý motiv je čistě CSS, žádné props drilling.** `useTheme.ts`
  jen přepíná `data-theme` na `<html>`; `[data-theme="light"]` v
  `index.css` přepisuje hodnoty CSS proměnných — včetně Tailwindích
  vestavěných (`--color-white`, `--color-emerald-200/300`,
  `--color-rose-200/300`), takže `text-white/40`, `border-white/10` apod.
  fungují napříč celou appkou bez úprav komponent. Dvě věci, na které si
  dát pozor při dalších úpravách:
  - `--color-ink` = barva pozadí stránky (mění se podle motivu). Pro
    "tmavý text na jasné ploše" (odznaky, gradientové tlačítko) použij
    `text-onaccent` — je to **fixní** konstanta, nezávislá na motivu
    (na rozdíl od `--color-ink` by se jinak ve světlém režimu stal bílým
    textem na jasném pozadí = nečitelné).
  - `--color-gold` (pozadí/fill) vs. `--color-gold-fg` (text) — gold jako
    plocha zůstává stejně jasný v obou motivech, ale gold jako TEXT na
    stránce/kartě potřebuje ve světlém režimu ztmavit kvůli kontrastu.
    Použij `bg-gold`/`border-gold` pro plochy, `text-gold-fg` pro text.

## Architektura (stručně)

- Čistě klientská React/Vite aplikace, žádný herní backend/DB (viz README →
  Tech stack, proč záměrně).
- Herní logika je čistě oddělená od UI v `src/game/` (deska, sousednost hexů,
  výherní BFS, přiřazení písmen polím, normalizace psaných odpovědí, AI,
  načítání obou CSV) — komponenty v `src/components/` jsou jen prezentační
  vrstva nad `useGame` hookem.
- `server.js` je jen produkční static server pro Railway, ve vývoji se
  nepoužívá (`npm run dev` běží přes Vite).

## Roadmapa / co příště

Viz README → Roadmapa (online multiplayer, skóre/statistiky, filtr
kategorií/obtížnosti před hrou). Až se do toho půjde, online multiplayer bude
první věc, co reálně vyžaduje backend + pravděpodobně databázi (stav
místností) — do té doby databázi záměrně nepřidávat.
