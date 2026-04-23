// @ts-check
const { test, expect } = require('@playwright/test');
const { VIEWPORTS } = require('./viewports');
const {
  expectNoHorizontalScroll,
  expectAllOnScreen,
  expectTapTargets,
  detectLayoutBranch,
} = require('./helpers');

/**
 * The launcher (/) is the entry point shown every time the PWA opens.
 * It must render all 5 game cards and the share + refresh buttons
 * without horizontal overflow on every supported device.
 */

for (const vp of VIEWPORTS) {
  test(`launcher · ${vp.name} · renders every card on screen`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    // The launcher is mostly static HTML — a single rAF is enough.
    await page.waitForLoadState('networkidle');

    // Right CSS branch is picked up at this viewport.
    const branch = await detectLayoutBranch(page);
    expect(branch).toBe(vp.layout);

    // No horizontal scroll.
    await expectNoHorizontalScroll(page, expect);

    // Title + subtitle render. (Subtitle is hidden on phone landscape by
    // design, so we only check title there.)
    if (vp.layout === 'phone-landscape') {
      await expectAllOnScreen(page, expect, ['.launcher-title', '.share-btn']);
    } else {
      await expectAllOnScreen(page, expect, [
        '.launcher-title',
        '.launcher-subtitle',
        '.share-btn',
      ]);
    }

    // Every game card must be on-screen (not clipped by scroll).
    await expectAllOnScreen(page, expect, [
      '.sudoku-card',
      '.tetris-card',
      '.candy-card',
      '.nums-card',
      '.geo-card',
    ]);

    // Card titles must not wrap (white-space: nowrap + must fit).
    const titles = await page.$$eval('.game-card .card-title', (els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        const parent = el.closest('.game-card');
        const pr = parent ? parent.getBoundingClientRect() : r;
        return { text: el.textContent, w: r.width, parentW: pr.width, fits: r.width <= pr.width + 1 };
      })
    );
    for (const t of titles) {
      expect.soft(t.fits, `card title "${t.text}" overflows: ${t.w} > ${t.parentW}`).toBeTruthy();
    }

    // Tap-target floor for game cards — 40×40 on phones, 52×52 on tablets.
    const tgtMin = vp.layout.startsWith('tablet') ? 52 : 40;
    await expectTapTargets(
      page,
      expect,
      ['.sudoku-card', '.tetris-card', '.candy-card', '.nums-card', '.geo-card'],
      tgtMin,
      tgtMin
    );
    // Share button is primary, must be generous.
    await expectTapTargets(page, expect, ['.share-btn'], 40, 40);
    // Refresh is a secondary utility; 28×28 is acceptable on phones.
    await expectTapTargets(page, expect, ['.refresh-btn'], 28, 28);
  });
}

test('launcher footer label is device-neutral (not "iPad 平板觸控優化")', async ({ page }) => {
  await page.goto('/');
  const footer = await page.textContent('.launcher-footer');
  expect(footer).not.toContain('iPad 平板');
});
