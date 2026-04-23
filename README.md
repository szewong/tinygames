# 小遊戲 — TinyGames

A senior-friendly launching pad for simple browser games, optimised for both
iPhone and iPad.

Big fonts, simple controls, traditional Chinese interface, designed for full-screen
PWA play.

## What's inside

| Game | Folder | Notes |
|------|--------|-------|
| 數獨 (Sudoku) | `sudoku/` | Existing PWA, dropped in as-is |
| 俄羅斯方塊 (Tetris) | `tetris/` | New web port from the Pygame source — touch buttons, ghost piece, 7-bag random |
| 糖果消消樂 (Candy Crush) | `candy/` | 8×8 match-3 — tap candy, tap adjacent to swap; cascades with score multiplier |
| 2048 數字合成 | `2048/` | Slide-and-merge powers of 2 — big d-pad + swipe, undo, editable target |
| 認識世界 (Geography) | `geo/` | Geography knowledge quiz — mixed question types (country→capital, capital→country, country→continent), 10 rounds, regional filter |

The root is a launchpad with two big game tiles. Each game lives in its own
subdirectory and registers its own service worker for offline play.

## Run locally

```bash
# any static file server works
python3 -m http.server 8080
# then open http://localhost:8080
```

The launchpad lives at `/`, sudoku at `/sudoku/`, tetris at `/tetris/`.

## Install on iPad

1. Open the deployed URL in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen icon — runs full-screen, no browser chrome.

You can also install each game individually from its own page so they appear as
separate icons on the home screen.

## Design notes — built for seniors

- **Big tap targets** — every interactive element is at least 60px tall.
- **High contrast** — warm cream background (`#faf7f2`) with strong dark text.
- **Limited choices** — the launchpad shows two tiles, nothing else.
- **No gestures** — every action has a labelled button. No swipes required.
- **Hold-to-repeat** — Tetris move buttons auto-repeat after 220ms hold,
  so a single press still moves once but a long press slides smoothly.

## Tech

Vanilla HTML / CSS / JS. No build step. Each subdirectory is self-contained and
could be deployed standalone.

## Responsive testing

Playwright tests exercise every page at iPhone SE / 14 / 15 Pro Max and
iPad mini / Pro 11" / Pro 12.9" viewports in both orientations, asserting:

- the right CSS branch is matched (phone vs tablet × portrait vs landscape)
- no horizontal scroll
- all cards / boards / controls are on-screen (not clipped below the fold)
- tap targets meet a minimum size

```bash
npm install
npm test                  # chromium + webkit, all viewports
npm run test:ui           # Playwright UI for debugging
npx playwright test snapshots   # screenshot every page × viewport combo
npm run test:report       # open the HTML report with attached screenshots
```

Adding a new viewport or page: extend `tests/viewports.js` and
`tests/games.spec.js`.

## Adding another game

1. Create a new subdirectory, e.g. `mahjong/`, with its own `index.html`.
2. Add a `<a class="game-card" href="mahjong/index.html">` tile to
   `index.html` in the launchpad.
3. Match the warm palette in `style.css` for visual consistency.
