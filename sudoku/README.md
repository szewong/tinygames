# 數獨遊戲 — Sudoku

A beautiful, touch-friendly Sudoku game built as a Progressive Web App (PWA). Designed for iPad full-screen play with traditional Chinese interface.

## Features

- **Three difficulty levels** — 簡單 (Easy), 中等 (Medium), 困難 (Hard)
- **Notes mode** — Mark candidate numbers in cells to help with reasoning
- **Undo / Erase / Hint** — Full editing support
- **Error tracking & timer** — Track your progress
- **Auto-save** — Progress is saved to localStorage and resumes on return
- **Win celebration** — Confetti animation on completion
- **Offline support** — Service worker caches all assets for offline play

## iPad Optimized

The layout is designed to fill the entire iPad screen in standalone mode:

- Grid expands to use all available vertical space
- Large, easy-to-read numbers (up to 58px on iPad Pro)
- Touch-friendly tap targets
- Supports both portrait and landscape orientations
- Respects safe areas for notch and home indicator

## Install on iPad

1. Open the URL in Safari
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. The app will launch full-screen with its own icon

## Run Locally

```bash
# Any static file server works
python3 -m http.server 8080

# Then open http://localhost:8080
```

## Tech Stack

- Vanilla HTML / CSS / JavaScript — no frameworks, no build step
- PWA with service worker for offline caching
- CSS custom properties + media queries for responsive sizing
- Backtracking algorithm for puzzle generation with unique solutions

## License

MIT
