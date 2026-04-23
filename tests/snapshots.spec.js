// @ts-check
/**
 * Visual snapshots. Not part of the default assertions — these just
 * attach a full-page screenshot for every (page × viewport) combo so
 * a human can eyeball the responsive layouts in the HTML report.
 *
 * Run:    npx playwright test snapshots --project=chromium
 * View:   npx playwright show-report
 */
const { test } = require('@playwright/test');
const { VIEWPORTS } = require('./viewports');

const PAGES = [
  { path: '/',                  name: 'launcher' },
  { path: '/sudoku/index.html', name: 'sudoku'   },
  { path: '/tetris/index.html', name: 'tetris'   },
  { path: '/2048/index.html',   name: '2048'     },
  { path: '/candy/index.html',  name: 'candy'    },
  { path: '/geo/index.html',    name: 'geo'      },
];

test.describe('visual snapshots', () => {
  for (const p of PAGES) {
    for (const vp of VIEWPORTS) {
      test(`${p.name} @ ${vp.name}`, async ({ page }, info) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(p.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(250);
        await info.attach(`${p.name}-${vp.name}.png`, {
          body: await page.screenshot({ fullPage: false }),
          contentType: 'image/png',
        });
      });
    }
  }
});
