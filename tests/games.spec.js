// @ts-check
const { test, expect } = require('@playwright/test');
const { VIEWPORTS } = require('./viewports');
const {
  expectNoHorizontalScroll,
  expectAllOnScreen,
  detectLayoutBranch,
} = require('./helpers');

/**
 * Per-game viewport tests. For every game at every viewport, we check:
 *   - CSS branch matches the viewport (portrait-phone, landscape-phone,
 *     portrait-tablet, landscape-tablet)
 *   - no horizontal scroll
 *   - the main play area (board/grid/prompt) and primary controls are on
 *     screen and non-empty
 *   - on phone-landscape: the play area fits in the available height
 *     after the header + status bar (this was the iPad-only bug).
 */

/** @type {Array<{path: string, name: string, board: string, controls: string[]}>} */
const GAMES = [
  {
    path: '/sudoku/index.html',
    name: 'sudoku',
    board: '.grid-container',
    controls: ['.numpad', '.actions', '.new-game-btn', '.back-btn'],
  },
  {
    path: '/tetris/index.html',
    name: 'tetris',
    board: '.board-wrap',
    controls: ['#btn-left', '#btn-right', '#btn-rotate', '#btn-drop', '.back-btn'],
  },
  {
    path: '/2048/index.html',
    name: '2048',
    board: '.board-wrap',
    controls: ['#btn-up', '#btn-down', '#btn-left', '#btn-right', '#btn-undo', '#btn-new', '.back-btn'],
  },
  {
    path: '/candy/index.html',
    name: 'candy',
    board: '.board-wrap',
    controls: ['#btn-hint', '#btn-new', '.back-btn'],
  },
  {
    path: '/geo/index.html',
    name: 'geo',
    board: '.prompt-wrap',
    controls: ['.choices', '.back-btn', '.help-btn'],
  },
];

for (const game of GAMES) {
  for (const vp of VIEWPORTS) {
    test(`${game.name} · ${vp.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(game.path);
      // Wait for JS-driven sizing (board fit on 2048/candy, resize on tetris).
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(200);

      const branch = await detectLayoutBranch(page);
      expect(branch).toBe(vp.layout);

      await expectNoHorizontalScroll(page, expect);

      // Core structural elements must be on-screen.
      await expectAllOnScreen(page, expect, [
        '.title',
        '.status-bar',
        game.board,
        ...game.controls,
      ]);

      // Board must have non-zero size.
      const boardRect = await page.$eval(game.board, (el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
      expect(boardRect.w).toBeGreaterThan(50);
      expect(boardRect.h).toBeGreaterThan(50);

      // On phone-landscape the board must not be silly-small (< 25% of
      // min(viewport)). Catches the case where it gets squished by a
      // wrongly-matched tablet layout.
      if (vp.layout === 'phone-landscape') {
        const minDim = Math.min(vp.width, vp.height);
        const boardMin = Math.min(boardRect.w, boardRect.h);
        expect.soft(
          boardMin,
          `board too small on ${vp.name}: ${boardMin} < ${minDim * 0.25}`
        ).toBeGreaterThan(minDim * 0.25);
      }

      // Save a debug screenshot for the snapshot folder (also useful for
      // humans reviewing the PR).
      await testInfo.attach(`${game.name}-${vp.name}.png`, {
        body: await page.screenshot({ fullPage: false }),
        contentType: 'image/png',
      });
    });
  }
}
