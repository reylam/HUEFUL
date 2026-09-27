# HUEFUL (frontend)

HUEFUL is a mobile-first web color assistant for people with color vision
deficiency (CVD). It names colors in plain language, judges fruit ripeness,
compares colors, checks whether an outfit works, and simulates how an image
looks under different CVD types. Every color result is carried by words and an
icon, never by color alone.

Built with React 19, TypeScript (strict), Vite, and Tailwind CSS v4. All color
math and image processing runs in the browser, so photos never leave the device.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Getting started

```bash
npm install
npm run dev        # start the Vite dev server
npm run build      # type-check (tsc -b) then a production build
npm run preview    # serve the production build locally
npm run lint       # run eslint
npm run typecheck  # type-check only, no emit
```

The dev server prints a local URL (default http://localhost:5173, or the next
free port). The build output is written to `dist/`.

## The tools

The dashboard is open: every tool is browsable without an account. Signing in
only personalizes things such as the display name and saved data.

| Tool     | Route                 | What it does                                                        |
| -------- | --------------------- | ------------------------------------------------------------------- |
| HueScan  | `/dashboard/scan`     | Name the color at the center of a photo, with HEX, RGB, and HSL.    |
| HueMatch | `/dashboard/compare`  | Check whether two colors are distinguishable, for you and per CVD.  |
| HueDrobe | `/dashboard/outfit`   | Photograph an outfit and get a worded verdict on how the pieces go. |
| HueRipe  | `/dashboard/ripeness` | Estimate produce ripeness from skin color, located by a detector.   |
| HueLens  | `/dashboard/simulate` | Compare an image against a protanopia, deuteranopia, or tritanopia simulation. |
| HueVault | `/dashboard/saved`    | Keep named colors and analysis history, shared across the tools.    |

The dashboard home is an interactive workspace: a Color Studio (drag a hue and
see related colors named live), a daily color challenge, a progress panel, a
tool rail, and the recently saved colors.

## Architecture

Feature-based, with one shared color engine everything sits on. Code lives under
`features/<name>/`; something is promoted to `shared/` only when two or more
features need it.

```
src/
  app/
    App.tsx            two-zone router (public site + dashboard), preloader, toaster
    lenses.ts          the lens registry: the single source of truth for the tools
    layouts/           public layout, dashboard shell, side rail and bottom nav
  features/
    landing/ about/ features-page/ faq/ contact/   public marketing pages
    auth/              client-only stub sign-in (name + email, no password)
    dashboard-home/    the interactive home: studio, challenge, progress, tool rail
    color-scanner/     HueScan
    compare-colors/    HueMatch
    outfit-matching/   HueDrobe
    food-ripeness/     HueRipe (on-device fruit detector + per-fruit ripeness rules)
    cvd-simulator/     HueLens
    saved-colors/      HueVault
    settings/ welcome-tour/ not-found/
  shared/
    color-engine/      framework-free TypeScript, unit-testable
    progress/          the award hook that grants XP and celebrates unlocks
    ui/                Button, StatusBadge, CameraUpload, CompareSlider, Preloader, and more
  stores/              zustand stores, persisted to localStorage
  styles/index.css     Tailwind v4 design tokens (@theme) and globals
```

The `@` import alias points at `src` (see `vite.config.ts`).

### Routing

`App.tsx` runs two zones under one router. The public zone (landing, about,
features, FAQ, contact, login, register) is never redirected to the dashboard.
The app zone (`/dashboard` and each tool) is a separate layout. Route components
are lazy-loaded, so the landing page ships without the dashboard and each tool's
heavy code loads only when it is opened.

### Color engine (`shared/color-engine`)

No external color library. The engine provides:

- Color space conversion: HEX, RGB, HSL.
- WCAG relative luminance and contrast ratio, with a body/large threshold check.
- Perceptual color difference in CIE Lab (Delta-E CIE76) and a 0 to 100
  similarity score.
- CVD simulation for protanopia, deuteranopia, and tritanopia using a
  Brettel-style linear transform in linear RGB.
- Plain-language color naming with a brightness and saturation description and a
  confidence value.
- Color harmony (complementary, analogous, monochromatic) with a plain reason.

### On-device fruit detection (HueRipe)

HueRipe loads TensorFlow.js and the COCO-SSD object-detection model lazily, only
on the first check, so the model and tfjs stay in the ripeness route chunk and
never touch the main bundle. When the model recognizes the produce (COCO knows
banana, apple, and orange) it locates the fruit and crops the color read to it,
then draws the box and label over the captured photo. For produce COCO does not
know (tomato, mango, avocado, strawberry) it samples the center of the frame and
says so. The result is a color-only estimate, never a food-safety guarantee.

### State (`stores/`)

Small zustand stores, each persisted to its own localStorage key:

- `auth` (client-only session), `vision-profile`, `saved-colors`,
  `preferences` (reduced motion, larger text, higher contrast), `onboarding`,
  and `progress` (XP, level, streak, achievements).

XP is granted only for genuine actions (naming or saving a color, running a
ripeness check, winning the daily challenge). Levels are derived from XP and
achievements unlock from the same real counters.

## Principles

- Never color alone. `StatusBadge` refuses to render a status by color only; it
  requires a text label and an icon. Status tokens are separated by luminance,
  not only hue, so they hold up under any CVD and in grayscale.
- Lead with meaning. Results show a color's name and plain description first,
  not a bare hex.
- Mobile-first. Designed at phone width, with a thumb-reachable bottom nav,
  44px touch targets, and 16px base text. A side rail replaces the bottom bar
  from the `md` breakpoint up.
- Accessibility. Semantic HTML, keyboard operability, visible focus rings,
  contrast targets that follow WCAG, and `prefers-reduced-motion` respected
  (and forceable in Settings).
- Performance. Tools are lazy-loaded routes, and heavy work (camera, image
  processing, the ML model) is code-split into the route that needs it.
- Honest maturity. Each tool advertises its state (ready, prototype, planned)
  through one shared `StateTag`.

## Notes and limitations

- Sign-in is a client-only stub for the prototype: it stores a display name and
  email locally and never checks or stores a password.
- All data lives in the browser (localStorage). Clearing site data resets saved
  colors, progress, and preferences.
- The ripeness and simulation results are approximations for everyday use, not
  measurements or medical or food-safety assessments.
