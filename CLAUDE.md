# Aura Z — kontext pro Claude

Hexagonová kvízová hra (jako AZ-kvíz ČT, otázky mířené na Gen Z). Čti
[README.md](README.md) pro herní pravidla, strukturu a nasazení — tady jen to,
co README nepokrývá.

## Stav projektu

- Fáze 1 (lokální 2P pass-and-play + singleplayer vs AI) je hotová a funkční.
- Repo je na GitHubu: `vojtechrydl/aura-z` (veřejné). Nasazení na Railway čeká
  na propojení v Railway dashboardu (viz README → Nasazení) — to je jediný
  krok, který nejde udělat z CLI/API bez přihlášení uživatele v prohlížeči.
- `public/questions.csv` obsahuje 40 ukázkových otázek jako placeholder.
  Uživatel má vlastní sadu otázek, kterou plánuje nahrát — až dorazí, stačí
  přepsat tento soubor (zachovat hlavičku) a commitnout, žádný jiný zásah.

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
  `text-gold`, `animate-float` — ne `bg-(--color-p1)`.

## Architektura (stručně)

- Čistě klientská React/Vite aplikace, žádný herní backend/DB (viz README →
  Tech stack, proč záměrně).
- Herní logika je čistě oddělená od UI v `src/game/` (deska, sousednost hexů,
  výherní BFS, AI, načítání CSV) — komponenty v `src/components/` jsou jen
  prezentační vrstva nad `useGame` hookem.
- `server.js` je jen produkční static server pro Railway, ve vývoji se
  nepoužívá (`npm run dev` běží přes Vite).

## Roadmapa / co příště

Viz README → Roadmapa (online multiplayer, skóre/statistiky, filtr
kategorií/obtížnosti před hrou). Až se do toho půjde, online multiplayer bude
první věc, co reálně vyžaduje backend + pravděpodobně databázi (stav
místností) — do té doby databázi záměrně nepřidávat.
