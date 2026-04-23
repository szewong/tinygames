// @ts-check
/**
 * Shared helpers for viewport-matrix tests.
 */

/** Assert the page fits its viewport horizontally (no sideways scroll). */
async function expectNoHorizontalScroll(page, expect) {
  const overflow = await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const viewW = window.innerWidth;
    return { docW, viewW, overflow: docW - viewW };
  });
  // Allow a 1px rounding tolerance.
  expect(overflow.overflow, `horizontal overflow: doc=${overflow.docW} view=${overflow.viewW}`)
    .toBeLessThanOrEqual(1);
}

/**
 * Assert every element in `selectors` is visible *and* fully inside the
 * viewport (top/left ≥ 0, bottom/right ≤ inner size). Misses usually mean
 * the element is clipped off-screen or behind a fixed bar.
 */
async function expectAllOnScreen(page, expect, selectors) {
  const report = await page.evaluate((sels) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return sels.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { sel, ok: false, reason: 'missing' };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) {
        return { sel, ok: false, reason: 'hidden', rect: r };
      }
      if (r.width === 0 || r.height === 0) {
        return { sel, ok: false, reason: 'zero-size', rect: r };
      }
      // Allow 1px slack.
      const inside = r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1;
      return { sel, ok: inside, reason: inside ? 'ok' : 'clipped', rect: r, vw, vh };
    });
  }, selectors);

  for (const item of report) {
    expect.soft(item.ok, `${item.sel}: ${item.reason} ${item.rect ? JSON.stringify(item.rect) : ''}`).toBeTruthy();
  }
}

/**
 * Assert each listed selector has a minimum width × height. Seniors-friendly
 * tap targets should be at least ~40×40 on phones and larger on tablets.
 */
async function expectTapTargets(page, expect, selectors, minW, minH) {
  const report = await page.evaluate(
    ({ sels, minW, minH }) => {
      return sels.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, ok: false, reason: 'missing' };
        const r = el.getBoundingClientRect();
        return { sel, ok: r.width >= minW && r.height >= minH, w: r.width, h: r.height };
      });
    },
    { sels: selectors, minW, minH }
  );
  for (const item of report) {
    expect
      .soft(item.ok, `${item.sel}: ${item.w}×${item.h} < ${minW}×${minH}`)
      .toBeTruthy();
  }
}

/** Returns which CSS branch is actually active based on media-query matches. */
async function detectLayoutBranch(page) {
  return page.evaluate(() => {
    const match = (q) => window.matchMedia(q).matches;
    const tabletLandscape =
      match('(min-width: 700px)') &&
      match('(min-height: 500px)') &&
      match('(orientation: landscape)');
    const tabletPortrait =
      match('(min-width: 744px)') && match('(orientation: portrait)');
    const phoneLandscape =
      match('(orientation: landscape)') && match('(max-height: 500px)');
    if (tabletLandscape) return 'tablet-landscape';
    if (tabletPortrait)  return 'tablet-portrait';
    if (phoneLandscape)  return 'phone-landscape';
    return 'phone-portrait';
  });
}

module.exports = {
  expectNoHorizontalScroll,
  expectAllOnScreen,
  expectTapTargets,
  detectLayoutBranch,
};
