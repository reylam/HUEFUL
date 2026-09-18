# HUEFUL — frontend

A mobile-first color assistant for people with color vision deficiency (CVD).
React + TypeScript + Vite + Tailwind v4.

## Run

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm run lint       # eslint
```

## Structure (feature-based)

```
src/
  app/                 shell, routing, bottom nav, lens registry
  features/
    color-scanner/     name a color (working prototype)
    food-ripeness/     ripe/unripe verdict (scaffolded)
    compare-colors/    same/different (scaffolded)
    cvd-simulator/     preview a color per CVD type (working)
  shared/
    color-engine/      framework-free TS: naming, CVD transform, contrast
    ui/                Button, StatusBadge, ComingSoon
  styles/index.css     design tokens (@theme) + globals
```

## Principles baked in

- **Never color alone** — `StatusBadge` refuses to render status by color only;
  it requires a label and an icon.
- **Lead with meaning** — results show a color's name and plain description, not
  a bare hex.
- **Mobile-first** — designed at phone width, thumb-reachable bottom nav, 44px
  targets, 16px base text.
- **Performance** — each lens is a lazy-loaded route.
- **Prototype vs production** — placeholders and mocks are labelled; see the
  `ComingSoon` note on scaffolded lenses.

Design and architecture rules live in `.kiro/skills/frontend-craft/`.
