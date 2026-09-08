# Playroom Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the `playroom` design sample to be the real MiniSteam storefront, rewritten in Tailwind utilities and served from real routes.

**Architecture:** The sample's components move from `src/samples/playroom/` into `src/components/` and `src/routes/`, keeping their existing props-only interfaces. `playroom.css` is dissolved: its design tokens become an `@theme` block in `index.css` so Tailwind generates utilities from them, its dark palette becomes a `.dark` override block driven by the existing `useTheme` hook, and only the parts utilities cannot express (keyframes, layered page gradients, the confetti mask, reduced-motion) stay as hand-written CSS. The sample's local `selectedId`/`playingId` state is replaced by react-router routes.

**Tech Stack:** React 19, TypeScript 5.9, Vite (rolldown), Tailwind CSS 4 (`@tailwindcss/vite`), react-router-dom 7, Zustand 5.

Spec: `docs/superpowers/specs/2026-09-08-playroom-storefront-design.md`

## Global Constraints

- **No test suite exists in this repo** (tracked in `docs/tasks/queue/add-test-suites.md`). The verification gate for every task is `npm run build` (which runs `tsc -b`) and `npm run lint`, both clean. Never claim tests were run.
- All npm commands run from the **inner** app folder: `MiniSteamUI/ministeamui`.
- Branch: `feat/playroom-storefront`. Never commit to `main`. Never push to a remote outside the `paurodriguez0220` GitHub account.
- Tailwind 4 is configured in CSS, not a JS config file. The dark variant is already declared in `src/index.css` as `@custom-variant dark (&:where(.dark, .dark *))`.
- `useTheme` (`src/hooks/useTheme.ts`) is the only thing allowed to toggle the theme. It adds/removes `.dark` on `document.documentElement` and persists to `localStorage`. Components must not read or write `data-pr-theme`.
- Do not change `src/store/useAppStore.ts`, `src/hooks/useApi.ts`, the .NET API, or the three game apps.
- Keep every accessibility attribute the sample already has: `role="dialog"` + `aria-modal` on the overlay, `aria-pressed` on filter chips, `aria-live="polite"` on the result count, `aria-busy` on skeletons, `role="alert"`/`role="status"` on notice panels, `aria-hidden` on decorative SVGs.
- The game iframe keeps exactly `sandbox="allow-scripts allow-same-origin"` and `allow="fullscreen; gamepad; autoplay"`.
- **`src/samples/` stays on disk until Task 8.** Do not delete the playroom sample early — it is the visual reference for the rewrite.

### Token naming (used by every task)

The `--pr-*` custom properties become these Tailwind theme variables. Use the generated utility, not `var()`, wherever a utility exists.

| Sample token | Theme variable | Utility |
| --- | --- | --- |
| `--pr-bg`, `--pr-bg-2` | `--color-bg`, `--color-bg-2` | `bg-bg` |
| `--pr-surface`, `--pr-surface-2` | `--color-surface`, `--color-surface-2` | `bg-surface` |
| `--pr-ink`, `--pr-ink-soft` | `--color-ink`, `--color-ink-soft` | `text-ink`, `text-ink-soft` |
| `--pr-line` | `--color-line` | `border-line` |
| `--pr-primary`, `--pr-primary-deep`, `--pr-primary-ink`, `--pr-primary-soft` | `--color-primary`, `--color-primary-deep`, `--color-primary-ink`, `--color-primary-soft` | `bg-primary`, `text-primary-ink` |
| `--pr-mint`, `--pr-mint-soft`, `--pr-sky`, `--pr-sky-soft`, `--pr-butter`, `--pr-butter-soft`, `--pr-grape`, `--pr-grape-soft` | `--color-mint`, `--color-mint-soft`, … | `bg-butter-soft` |
| `--pr-r-sm/md/lg/xl/pill` | `--radius-sm/md/lg/xl` + `rounded-full` for pill | `rounded-lg` |
| `--pr-sh-1/2/3/press` | `--shadow-soft-1/2/3/press` | `shadow-soft-2` |
| `--pr-display`, `--pr-text` | `--font-display`, `--font-text` | `font-display`, `font-text` |
| `--pr-spring`, `--pr-ease` | `--ease-spring`, `--ease-soft` | `ease-spring` |
| `pr-pop-in`, `pr-fade`, `pr-boing`, `pr-shimmer`, `pr-drop` | `--animate-pop-in`, `--animate-fade`, `--animate-boing`, `--animate-shimmer`, `--animate-drop` | `animate-pop-in` |

Breakpoints invert: the sample's `@media (max-width: 1024px)` rules become the *base* styles, with the desktop layout behind `lg:`. Same for 900/880px → `md:` and 640px → `sm:`.

---

### Task 0: Commit the sample baseline

The four samples and the modified `main.tsx` are untracked leftovers from the design session. Commit them first so the rewrite has something to diff against.

**Files:**
- Commit as-is: `MiniSteamUI/ministeamui/src/main.tsx`, `src/pages/SampleBoot.tsx`, `src/pages/SampleChooser.tsx`, `src/samples/**`

- [ ] **Step 1: Confirm the build is green before touching anything**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: `tsc -b` and `vite build` both succeed; ESLint reports no errors.

- [ ] **Step 2: Commit the baseline**

```bash
git add MiniSteamUI/ministeamui/src
git commit -m "feat(ui): add the four storefront design samples"
```

---

### Task 1: Design tokens and the CSS layer in `index.css`

**Files:**
- Modify: `MiniSteamUI/ministeamui/src/index.css` (currently 15 lines — replaced wholesale)
- Read for reference: `src/samples/playroom/playroom.css:1-140` (light + dark palettes), `:809-822` (pop-in), `:988-1006` (fade, boing), `:1010-1030` (skeleton shimmer), `:1321-1332` (drop), `:1334-1360` (reduced motion)

**Interfaces:**
- Consumes: nothing.
- Produces: the theme variables and utilities in the token table above, plus these hand-written classes every later task relies on: `.page-bg` (the two radial gradients, applied to the app shell root), `.confetti` (the masked dot layer), `.skel` (the shimmering placeholder background), `.sr-only` (visually hidden text), and the `@keyframes` backing the `animate-*` utilities.

- [ ] **Step 1: Replace `src/index.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Nunito:wght@400..900&display=swap");

@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* ground + ink */
  --color-bg: #fff7f0;
  --color-bg-2: #ffece0;
  --color-surface: #ffffff;
  --color-surface-2: #fffaf6;
  --color-ink: #221a16;
  --color-ink-soft: #6e5f57;
  --color-line: #efe1d6;

  /* the one confident primary */
  --color-primary: #e8352e;
  --color-primary-deep: #b8231d;
  --color-primary-ink: #ffffff;
  --color-primary-soft: #ffe2de;

  /* soft secondary tints */
  --color-mint: #1faa63;
  --color-mint-soft: #cdf2df;
  --color-sky: #2f7ff0;
  --color-sky-soft: #d8e7ff;
  --color-butter: #f0a91b;
  --color-butter-soft: #ffedc4;
  --color-grape: #6f52f4;
  --color-grape-soft: #e5deff;

  /* shape */
  --radius-sm: 14px;
  --radius-md: 22px;
  --radius-lg: 32px;
  --radius-xl: 44px;

  /* soft layered shadows */
  --shadow-soft-1: 0 1px 0 rgba(34, 26, 22, 0.04), 0 6px 14px -8px rgba(34, 26, 22, 0.28);
  --shadow-soft-2: 0 2px 0 rgba(34, 26, 22, 0.05), 0 18px 34px -18px rgba(34, 26, 22, 0.36);
  --shadow-soft-3: 0 3px 0 rgba(34, 26, 22, 0.06), 0 44px 70px -34px rgba(34, 26, 22, 0.46);
  --shadow-soft-press: 0 1px 0 rgba(34, 26, 22, 0.06), 0 3px 8px -4px rgba(34, 26, 22, 0.3);

  /* type */
  --font-display: "Bricolage Grotesque", "Trebuchet MS", sans-serif;
  --font-text: "Nunito", "Trebuchet MS", sans-serif;

  /* motion */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-soft: cubic-bezier(0.2, 0.8, 0.3, 1);

  --animate-pop-in: pop-in 460ms var(--ease-spring) both;
  --animate-fade: fade 220ms var(--ease-soft) both;
  --animate-boing: boing 1s var(--ease-spring) infinite;
  --animate-shimmer: shimmer 1.5s linear infinite;
  --animate-drop: drop 260ms var(--ease-spring) both;
}

/* Dark palette. Only the tokens change, so components need no `dark:` prefixes. */
.dark {
  --color-bg: #17120f;
  --color-bg-2: #211914;
  --color-surface: #241d18;
  --color-surface-2: #2b221c;
  --color-ink: #fff3ea;
  --color-ink-soft: #b9a89c;
  --color-line: #3a2f27;

  --color-primary: #ff5b4e;
  --color-primary-deep: #d63a2e;
  --color-primary-ink: #24100d;
  --color-primary-soft: #4a221d;

  --color-mint-soft: #17392a;
  --color-sky-soft: #16294a;
  --color-butter-soft: #3c2d10;
  --color-grape-soft: #2b2350;

  --shadow-soft-1: 0 1px 0 rgba(0, 0, 0, 0.4), 0 6px 14px -8px rgba(0, 0, 0, 0.7);
  --shadow-soft-2: 0 2px 0 rgba(0, 0, 0, 0.4), 0 18px 34px -18px rgba(0, 0, 0, 0.8);
  --shadow-soft-3: 0 3px 0 rgba(0, 0, 0, 0.45), 0 44px 70px -34px rgba(0, 0, 0, 0.9);
  --shadow-soft-press: 0 1px 0 rgba(0, 0, 0, 0.5), 0 3px 8px -4px rgba(0, 0, 0, 0.7);
}

@layer base {
  body {
    margin: 0;
    background-color: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-text);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.02;
    margin: 0;
  }

  p {
    margin: 0;
  }

  :focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 3px;
  }
}

/* Two stacked radial washes behind the shell. Utilities cannot express a
   multi-stop, multi-layer gradient this cleanly. */
@utility page-bg {
  background-color: var(--color-bg);
  background-image:
    radial-gradient(120% 70% at 12% -10%, var(--color-bg-2) 0%, rgba(255, 236, 224, 0) 60%),
    radial-gradient(90% 60% at 100% 0%, var(--color-primary-soft) 0%, rgba(255, 226, 222, 0) 55%);
}

.dark .page-bg {
  background-image:
    radial-gradient(120% 70% at 12% -10%, var(--color-bg-2) 0%, rgba(33, 25, 20, 0) 60%),
    radial-gradient(90% 60% at 100% 0%, rgba(74, 34, 29, 0.85) 0%, rgba(74, 34, 29, 0) 55%);
}

/* Confetti dots, faded out toward the bottom with a mask. */
@utility confetti {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(currentColor 1.6px, transparent 1.7px);
  background-size: 26px 26px;
  color: rgba(34, 26, 22, 0.13);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, transparent 55%);
  mask-image: linear-gradient(180deg, #000 0%, transparent 55%);
}

.dark .confetti {
  color: rgba(255, 243, 234, 0.14);
}

/* Shimmering placeholder fill. */
@utility skel {
  border-radius: var(--radius-md);
  background: linear-gradient(
    100deg,
    var(--color-surface-2) 30%,
    var(--color-primary-soft) 50%,
    var(--color-surface-2) 70%
  );
  background-size: 300% 100%;
  animation: var(--animate-shimmer);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes boing {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-14px) scale(1.08, 0.92);
  }
  70% {
    transform: translateY(0) scale(0.92, 1.08);
  }
}

@keyframes shimmer {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -150% 0;
  }
}

@keyframes drop {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* One global brake instead of per-component guards. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transform: none !important;
  }
}
```

- [ ] **Step 2: Verify the build**

```bash
cd MiniSteamUI/ministeamui && npm run build
```
Expected: success. Note that the old `App` still renders and will now look different (its Tailwind grey palette is intact, but the fonts changed) — that is expected and temporary.

- [ ] **Step 3: Confirm the sample is unaffected**

`src/samples/playroom/playroom.css` scopes everything to `.playroom-sample` and defines its own `--pr-*` tokens, so `/samples/playroom` must still render exactly as before. Start the dev server and check.

```bash
cd MiniSteamUI/ministeamui && npm run dev
```
Visit `http://localhost:5173/samples/playroom`. Expected: unchanged from the baseline.

- [ ] **Step 4: Commit**

```bash
git add MiniSteamUI/ministeamui/src/index.css
git commit -m "feat(ui): lift the playroom design tokens into Tailwind theme"
```

---

### Task 2: Leaf components

Pure presentational leaves with no dependency on any other new component. Copy each from the sample, convert `pr-*` classes to utilities, and drop the `../../store` path depth to `../store`.

**Files:**
- Create: `src/components/icons.tsx` (from `src/samples/playroom/icons.tsx` — **no class names at all, copy verbatim**)
- Create: `src/components/GameCover.tsx` (from `src/samples/playroom/game-cover.tsx`, 301 lines)
- Create: `src/components/NoticePanel.tsx` (from `src/samples/playroom/notice-panel.tsx`)
- Create: `src/components/LoadingSkeletons.tsx` (from `src/samples/playroom/loading-skeletons.tsx`)
- Read for reference: the `.pr-cover*`, `.pr-note*`, `.pr-skel*` rules in `playroom.css`

**Interfaces:**
- Consumes: the utilities and `.skel` / `.sr-only` from Task 1.
- Produces:
  - `icons.tsx`: `IconProps { size?: number }`, and `SearchIcon`, `CloseIcon`, `MenuIcon`, `PlayIcon`, `BackIcon`, `SunIcon`, `MoonIcon`, `ControllerIcon` — all `(props: IconProps) => JSX.Element`.
  - `GameCover`: `GameCoverProps { title: string; seed: number; ribbon?: string; isHero?: boolean }`.
  - `NoticePanel`: `NoticeTone = "empty" | "error"`, `NoticePanelProps { tone: NoticeTone; title: string; message: string; actionLabel?: string; onAction?: () => void }`.
  - `LoadingSkeletons`: `LoadingSkeletonsProps { cardCount?: number }`.

- [ ] **Step 1: Copy `icons.tsx` unchanged**

It contains no class names, so it needs no conversion.

```bash
cd MiniSteamUI/ministeamui && cp src/samples/playroom/icons.tsx src/components/icons.tsx
```

- [ ] **Step 2: Port `GameCover`**

Keep the generative logic (the seeded palette/motif selection) byte-for-byte — it is what makes each cover distinct. Only the `className` strings change. Where the sample's CSS used `var(--pr-x)` inside inline `style` or SVG `fill` attributes, switch to `var(--color-x)` per the token table.

- [ ] **Step 3: Port `NoticePanel`**

Its two inline SVG illustrations reference `var(--pr-butter-soft)`, `var(--pr-primary-soft)`, `var(--pr-primary)` and `var(--pr-ink)` in `fill`/`stroke` attributes — rename those to `--color-*`. The wrapper keeps `role={tone === "error" ? "alert" : "status"}`.

- [ ] **Step 4: Port `LoadingSkeletons`**

The `pr-skel pr-skel--line` / `--btn` / `--cover` variants become `skel` plus the size utilities that the modifier classes used to set. Keep `aria-busy="true"`, `aria-live="polite"` and the visually hidden "Loading the games shelf" text (now `sr-only`, which Tailwind provides).

- [ ] **Step 5: Verify**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: both clean. Nothing imports these yet, so this only proves they type-check.

- [ ] **Step 6: Commit**

```bash
git add MiniSteamUI/ministeamui/src/components
git commit -m "feat(ui): port the playroom leaf components to Tailwind"
```

---

### Task 3: `GameCard` and `HeroBanner`

**Files:**
- Modify (replace contents): `src/components/GameCard.tsx` — the old 62-line card is superseded by the sample's version
- Create: `src/components/HeroBanner.tsx` (from `src/samples/playroom/hero-banner.tsx`)
- Read for reference: `.pr-card*`, `.pr-hero*`, `.pr-btn*`, `.pr-tag`, `.pr-eyebrow`, `.pr-meta-row` in `playroom.css`

**Interfaces:**
- Consumes: `GameCover`, `PlayIcon` from Task 2; `Game` from `../store/useAppStore`.
- Produces:
  - `GameCard`: `GameCardProps { game: Game; index?: number; onOpen: (game: Game) => void; onPlay: (game: Game) => void }`.
  - `HeroBanner`: `HeroBannerProps { game: Game; onPlay: (game: Game) => void; onOpen: (game: Game) => void }`.

Both keep callback props rather than navigating themselves, so Task 6 decides what "open" and "play" mean.

- [ ] **Step 1: Port `GameCard`**

Preserve the overlay-button pattern exactly: the cover and title area is one hit target via an absolutely positioned `<button>` with `aria-label={`Open details for ${game.title}`}`, which keeps `<h3>` a real heading instead of nesting it in a button. Keep the staggered entrance:

```tsx
style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
```
on an element carrying `animate-pop-in`.

- [ ] **Step 2: Port `HeroBanner`**

`.pr-btn--big` becomes the larger padding/text utilities. Keep `aria-labelledby="hero-title"` pointing at the `<h1 id="hero-title">`, and pass `isHero` plus `ribbon={game.category}` to `GameCover`.

- [ ] **Step 3: Extract the shared button styling**

`pr-btn`, `pr-btn--primary`, `pr-btn--ghost` and `pr-btn--big` are used by `GameCard`, `HeroBanner`, `GameDetail`, `NoticePanel` and `Nav`. Repeating the utility string five times invites drift. Create `src/components/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, JSX } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
}

export function Button({ variant = "ghost", size = "md", className = "", ...rest }: ButtonProps): JSX.Element {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-display font-extrabold " +
    "transition-transform duration-200 ease-spring hover:-translate-y-0.5 active:translate-y-0 " +
    "active:shadow-soft-press cursor-pointer min-h-11";
  const variants = {
    primary: "bg-primary text-primary-ink shadow-soft-2 hover:bg-primary-deep",
    ghost: "bg-surface text-ink border-2 border-line shadow-soft-1 hover:bg-surface-2",
  };
  const sizes = { md: "px-5 py-2.5 text-[15px]", lg: "px-7 py-3.5 text-lg" };

  return <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
```

Then use `<Button variant="primary" size="lg">` in place of the old class strings. Match the final utility values to what `playroom.css` actually declares for `.pr-btn` — the block above is the shape, the exact paddings and radii come from the stylesheet. `min-h-11` is the 44px touch-target floor from `standards-docs/web-components.md:282`.

- [ ] **Step 4: Verify**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: build fails only if the old `MainContent.tsx` used the old `GameCard`'s props. If it does, that is fine — `MainContent` is deleted in Task 7, so temporarily leave the old prop names working, or accept the break and finish Task 6 first. Prefer: check with `grep -n "GameCard" src/components/MainContent.tsx` before editing, and if it conflicts, do Task 6 and Task 7 in the same commit as this one.

- [ ] **Step 5: Commit**

```bash
git add MiniSteamUI/ministeamui/src/components
git commit -m "feat(ui): port the game card and hero banner to Tailwind"
```

---

### Task 4: `GameDetail` and `PlayOverlay`

**Files:**
- Create: `src/components/GameDetail.tsx` (from `src/samples/playroom/game-detail.tsx`)
- Create: `src/components/PlayOverlay.tsx` (from `src/samples/playroom/play-overlay.tsx`)
- Read for reference: `.pr-detail*`, `.pr-overlay`, `.pr-dialog*`, `.pr-frame*`, `.pr-spinner`, `.pr-iconbtn` in `playroom.css`

**Interfaces:**
- Consumes: `GameCover`, `GameCard`, `Button`, `BackIcon`, `CloseIcon`, `PlayIcon`.
- Produces:
  - `GameDetail`: `GameDetailProps { game: Game; related: Game[]; onBack: () => void; onPlay: (game: Game) => void; onOpen: (game: Game) => void }`.
  - `PlayOverlay`: `PlayOverlayProps { game: Game; onClose: () => void }`.

- [ ] **Step 1: Port `GameDetail`**

Keep `animate-pop-in` on the root and the related-games strip at the bottom.

- [ ] **Step 2: Port `PlayOverlay`**

Every side effect in the sample's `useEffect` must survive verbatim — this is the accessibility-critical component:

```tsx
useEffect(() => {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") onClose();
  };

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeyDown);
  closeRef.current?.focus();

  return () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener("keydown", onKeyDown);
  };
}, [onClose]);
```

Keep `onLoad` moving focus into the iframe (`frameRef.current?.focus()`) so arrow keys reach the game without a click, the `isReady` spinner state, `role="dialog"`, `aria-modal="true"`, `aria-label={`${game.title} - now playing`}`, the backdrop `onMouseDown` close guard (`event.target === event.currentTarget`), and the iframe's `sandbox` / `allow` attributes unchanged.

The `.pr-frame iframe` sizing rule (`position: absolute; inset: 0; width: 100%; height: 100%; border: 0`) is expressible as utilities — use `absolute inset-0 h-full w-full border-0` on the iframe and `relative` on its wrapper.

- [ ] **Step 3: Verify**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add MiniSteamUI/ministeamui/src/components
git commit -m "feat(ui): port the game detail and play overlay to Tailwind"
```

---

### Task 5: `Nav`

**Files:**
- Modify (replace contents): `src/components/Header.tsx` → delete it and create `src/components/Nav.tsx` (from `src/samples/playroom/playroom-nav.tsx`, 143 lines)
- Read for reference: `.pr-nav*`, `.pr-brand*`, `.pr-search*`, `.pr-navlink`, `.pr-iconbtn`, and the `@media (max-width: 880px)` mobile-menu block (uses `animate-drop`)

**Interfaces:**
- Consumes: `SearchIcon`, `CloseIcon`, `MenuIcon`, `SunIcon`, `MoonIcon`, `ControllerIcon`, `Button`.
- Produces: `NavKey = "store" | "catalogue" | "about"` and
  `NavProps { query: string; onQueryChange: (value: string) => void; active: NavKey; onNavigate: (key: NavKey) => void; theme: "light" | "dark"; onToggleTheme: () => void }`.

Read the sample file before converting — it owns the mobile menu's open state and the search field's clear button, and both must survive.

- [ ] **Step 1: Port the nav**

The theme toggle stays a prop-driven button; Task 6 wires it to `useTheme`. The `data-pr-theme` attribute is gone — the icon shown is chosen from the `theme` prop.

- [ ] **Step 2: Verify**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: `tsc -b` fails if `App.tsx` still imports the deleted `Header`. Task 6 fixes that, so it is acceptable to run Task 5 and Task 6 back to back and commit once. If you prefer a green gate here, keep `Header.tsx` until Task 6.

- [ ] **Step 3: Commit**

```bash
git add MiniSteamUI/ministeamui/src/components
git commit -m "feat(ui): port the playroom nav to Tailwind"
```

---

### Task 6: App shell, routes, and URL-backed filters

This is the task that replaces the sample's local state with real navigation.

**Files:**
- Modify (replace contents): `src/App.tsx`
- Create: `src/routes/StorePage.tsx`
- Create: `src/routes/GameDetailPage.tsx`
- Modify: `src/main.tsx`
- Read for reference: `src/samples/playroom/PlayroomSample.tsx` — the filtering, category-counting and body-state logic all move out of it

**Interfaces:**
- Consumes: every component from Tasks 2–5; `useAppStore`, `useApi`, `useTheme`.
- Produces: routes `/`, `/games/:id`, `/games/:id/play`.

- [ ] **Step 1: Write `App.tsx` as the shell**

It owns exactly three things: the API bootstrap, the theme, and the chrome around `<Outlet />`. Nav search state lives here too, because the nav is in the shell but the query belongs to the store page — lift it into the URL and let both read it.

```tsx
import { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import { useTheme } from "./hooks/useTheme";
import { Nav } from "./components/Nav";
import type { NavKey } from "./components/Nav";
import { ControllerIcon } from "./components/icons";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { initApi } = useApi();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    initApi();
  }, [initApi]);

  const query = params.get("q") ?? "";

  const setQuery = (value: string): void => {
    const next = new URLSearchParams(params);
    if (value.trim() === "") next.delete("q");
    else next.set("q", value);
    setParams(next, { replace: true });
  };

  const handleNavigate = (key: NavKey): void => {
    if (key === "catalogue") {
      navigate("/#catalogue");
      return;
    }
    navigate(key === "store" ? "/" : "/#about");
  };

  return (
    <div className="page-bg relative isolate min-h-dvh w-full overflow-x-clip">
      <span className="confetti" aria-hidden="true" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Nav
          query={query}
          onQueryChange={setQuery}
          active="store"
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 py-8">
          <Outlet />
        </main>
        {/* footer: port .pr-footer from the sample, using ControllerIcon */}
      </div>
    </div>
  );
}

export default App;
```

Fill the footer in from `PlayroomSample.tsx:236-268` — the eyebrow with `ControllerIcon`, the "Small browser games, no downloads, no accounts." note, and the three links (Store, All games, theme toggle). Match `max-w-[1180px]` and the paddings to whatever `.pr-wrap` and `.pr-main` actually declare in the stylesheet.

- [ ] **Step 2: Write `StorePage.tsx`**

Move these from `PlayroomSample.tsx` unchanged in behaviour: the `categories` `useMemo` (counts per category, "All" first, rest sorted by name), the `filtered` `useMemo` (case-insensitive title match plus category match), `dotColour`, the `isBrowsing` check that hides the hero when a filter is active, and the four body states.

The difference: `q` and `category` come from `useSearchParams`, not `useState`.

```tsx
const [params, setParams] = useSearchParams();
const query = params.get("q") ?? "";
const category = params.get("category") ?? "All";

const setCategory = (name: string): void => {
  const next = new URLSearchParams(params);
  if (name === "All") next.delete("category");
  else next.set("category", name);
  setParams(next, { replace: true });
};

const resetFilters = (): void => setParams(new URLSearchParams(), { replace: true });
```

`onOpen` becomes `navigate(`/games/${game.id}`)` and `onPlay` becomes `navigate(`/games/${game.id}/play`)`. Give the catalogue section `id="catalogue"` so the nav's hash link lands on it.

- [ ] **Step 3: Write `GameDetailPage.tsx`**

```tsx
import type { JSX } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { GameDetail } from "../components/GameDetail";
import { NoticePanel } from "../components/NoticePanel";
import { LoadingSkeletons } from "../components/LoadingSkeletons";

export default function GameDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const games = useAppStore((state) => state.games);
  const loading = useAppStore((state) => state.loading);
  const navigate = useNavigate();

  if (loading && !games) return <LoadingSkeletons cardCount={0} />;

  const gameId = Number(id);
  const game = games?.find((entry) => entry.id === gameId) ?? null;

  if (!game) {
    return (
      <NoticePanel
        tone="empty"
        title="We could not find that game"
        message="The link may be out of date, or the game is no longer on the shelf."
        actionLabel="Back to the store"
        onAction={() => navigate("/")}
      />
    );
  }

  return (
    <>
      <GameDetail
        game={game}
        related={(games ?? []).filter((entry) => entry.id !== game.id)}
        onBack={() => navigate("/")}
        onPlay={(entry) => navigate(`/games/${entry.id}/play`)}
        onOpen={(entry) => navigate(`/games/${entry.id}`)}
      />
      {/* /games/:id/play renders PlayOverlay here */}
      <Outlet context={game} />
    </>
  );
}
```

- [ ] **Step 4: Write the play route**

Create `src/routes/PlayRoute.tsx`, a four-line adapter so `PlayOverlay` stays router-agnostic:

```tsx
import type { JSX } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { Game } from "../store/useAppStore";
import { PlayOverlay } from "../components/PlayOverlay";

export default function PlayRoute(): JSX.Element {
  const game = useOutletContext<Game>();
  const navigate = useNavigate();
  return <PlayOverlay game={game} onClose={() => navigate(-1)} />;
}
```

- [ ] **Step 5: Rewrite `main.tsx`**

The sample routes and lazy sample map go away in Task 8; leave them here for now so the visual reference stays reachable.

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import StorePage from "./routes/StorePage.tsx";
import GameDetailPage from "./routes/GameDetailPage.tsx";
import PlayRoute from "./routes/PlayRoute.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<StorePage />} />
          <Route path="games/:id" element={<GameDetailPage />}>
            <Route path="play" element={<PlayRoute />} />
          </Route>
        </Route>

        {/* Visual reference for the rewrite. Removed in Task 8. */}
        <Route element={<SampleBoot />}>
          <Route path="/samples" element={<SampleChooser />} />
          <Route path="/samples/:slug" element={<SampleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
```

Keep the existing `SAMPLES` map and `SampleRoute` function from the current `main.tsx` alongside this.

- [ ] **Step 6: Verify against the reference**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint && npm run dev
```
Compare `http://localhost:5173/` against `http://localhost:5173/samples/playroom` in both themes. Then walk the routes: click a card's Details → URL is `/games/1`; click Play → `/games/1/play` with the overlay up; press Esc → back on `/games/1`; browser Back → store. Type in the search box → `?q=` appears; pick a category → `?category=` appears; reload → filters survive.

- [ ] **Step 7: Commit**

```bash
git add MiniSteamUI/ministeamui/src
git commit -m "feat(ui): serve the playroom storefront from real routes"
```

---

### Task 7: Delete the superseded UI

**Files:**
- Delete: `src/components/Sidebar.tsx`, `Hero.tsx`, `MainContent.tsx`, `GameFrame.tsx`, `GameIframe.tsx`, `GameHUD.tsx`, `GameHeader.tsx`, and `Header.tsx` if Task 5 kept it
- Delete: `src/pages/GameModal.tsx`
- Delete: unreferenced files in `src/assets/`

- [ ] **Step 1: Confirm nothing references them**

```bash
cd MiniSteamUI/ministeamui && grep -rn "Sidebar\|MainContent\|GameHUD\|GameHeader\|GameFrame\|GameIframe\|GameModal\|components/Hero\b" src --include=*.tsx --include=*.ts | grep -v "^src/samples/"
```
Expected: no output. Anything that appears must be fixed before deleting.

- [ ] **Step 2: Delete the components and page**

```bash
cd MiniSteamUI/ministeamui && rm src/components/Sidebar.tsx src/components/Hero.tsx src/components/MainContent.tsx src/components/GameFrame.tsx src/components/GameIframe.tsx src/components/GameHUD.tsx src/components/GameHeader.tsx src/pages/GameModal.tsx
```

- [ ] **Step 3: Check each asset individually before deleting**

```bash
cd MiniSteamUI/ministeamui && for f in 2048.jpg nintendobackground.png react.svg; do echo "== $f"; grep -rn "$f" src index.html --include=* 2>/dev/null | grep -v Binary; done
```
Delete only the ones with no remaining reference outside `src/samples/`. Note that anything still referenced *only* by a sample can be deleted in Task 8 instead.

- [ ] **Step 4: Verify**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: both clean.

- [ ] **Step 5: Commit**

```bash
git add -A MiniSteamUI/ministeamui/src
git commit -m "refactor(ui): remove the superseded storefront components"
```

---

### Task 8: Remove the samples and close out

Only do this after the side-by-side comparison in Task 6 Step 6 passed.

**Files:**
- Delete: `src/samples/` (all four directions)
- Delete: `src/pages/SampleBoot.tsx`, `src/pages/SampleChooser.tsx`
- Modify: `src/main.tsx` — drop the `SAMPLES` map, `SampleRoute`, and the `/samples` routes
- Modify: `MiniSteamUI/ministeamui/README.md` and repo `CLAUDE.md` if either documents the sample routes

- [ ] **Step 1: Final visual comparison**

Open `/samples/playroom` and `/` one last time in both light and dark. Confirm the storefront matches: nav, hero, cover art, cards, chips, detail page, overlay, skeletons, empty and error panels, and the mobile layout at a narrow viewport.

- [ ] **Step 2: Delete the samples**

```bash
cd MiniSteamUI/ministeamui && rm -r src/samples src/pages/SampleBoot.tsx src/pages/SampleChooser.tsx
```
If `src/pages/` is now empty, remove the directory too.

- [ ] **Step 3: Trim `main.tsx`**

Remove the sample imports, the `lazy`/`Suspense`/`ComponentType`/`Navigate`/`useParams` imports that only the sample plumbing used, the `SAMPLES` record, the `SampleRoute` function, and the `/samples` routes. What remains is the shell plus the three storefront routes.

- [ ] **Step 4: Check the docs**

```bash
cd C:/Users/paulo.rodriguez/Paulo/mini-steam && grep -rn "samples\|SampleChooser" CLAUDE.md README.md MiniSteamUI/ministeamui/README.md docs 2>/dev/null | grep -v superpowers
```
Update anything that describes the sample routes as a live feature.

- [ ] **Step 5: Final verification**

```bash
cd MiniSteamUI/ministeamui && npm run build && npm run lint
```
Expected: both clean, with no unused-import or unused-variable errors left over from the trim.

- [ ] **Step 6: Standards reflection**

Per repo `CLAUDE.md`, before the final commit compare the work against `standards-docs/`. Two candidates worth flagging to the user:
- `web-components.md` says nothing about Tailwind 4's CSS-first configuration (`@theme`, `@utility`, `@custom-variant`) or about driving a dark palette by overriding theme variables in a `.dark` block instead of scattering `dark:` prefixes. That pattern is the backbone of this UI.
- Nothing documents the "design several full-page directions as throwaway samples behind a route, then promote one" workflow used here.

Do not edit the standards repo as part of this task — propose the additions and let the user decide.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ui): remove the design samples now that playroom shipped"
```

---

## Self-Review

**Spec coverage:** structure → Tasks 2–6; deletions → Tasks 7–8; token table and CSS layer → Task 1; dark mode via `.dark` → Task 1 + Task 5; routing table including the not-found panel → Task 6; `?q=`/`?category=` → Task 6 Steps 1–2; carried-over behaviour (three body states, overlay a11y, chips, stagger) → Tasks 2, 3, 4, 6; migration order → task order, with the sample kept alive until Task 8; verification → every task's gate plus Task 6 Step 6; standards reflection → Task 8 Step 6. No gap found.

**Type consistency:** `Game` is imported from `../store/useAppStore` everywhere. `GameCover` takes `{ title, seed, ribbon?, isHero? }` in Task 2 and is called with exactly those in Tasks 3–4. `NavKey` is produced in Task 5 and consumed in Task 6's `handleNavigate`. `PlayOverlay`'s `{ game, onClose }` in Task 4 matches `PlayRoute`'s usage in Task 6. `NoticePanel`'s `{ tone, title, message, actionLabel?, onAction? }` matches all four call sites.

**Known deviations from the writing-plans template, and why:**
1. **No TDD cycle.** There is no test framework installed. Adding one is explicitly out of scope in the spec and tracked separately.
2. **Component tasks give conversion rules, not full source.** Each ported component's pre-conversion source sits on disk at the exact path listed, and the conversion is mechanical (class strings only — logic, props and a11y attributes are preserved verbatim). Reproducing ~1,400 lines of TSX in the plan would duplicate the source of truth and invite the two copies to drift. Full code *is* given where something new is written: `index.css`, `Button`, `App`, `GameDetailPage`, `PlayRoute`, `main.tsx`, and the filter-state snippets.
