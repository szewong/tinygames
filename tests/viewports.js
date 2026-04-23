// @ts-check
/**
 * Viewport matrix for iPhone + iPad, portrait and landscape.
 * Dimensions match Apple's developer docs (CSS pixels).
 *
 * `layout` hints at which CSS branch should win at that viewport:
 *   - "phone-portrait"  : base mobile styles (< 700px wide)
 *   - "phone-landscape" : short + wide (max-height: 500px)
 *   - "tablet-portrait" : min-width: 748px + orientation: portrait
 *   - "tablet-landscape": min-width: 700px + min-height: 500px + landscape
 */
const VIEWPORTS = [
  // iPhone SE — smallest active iPhone, 375 × 667
  { name: 'iPhone SE portrait',        width: 375,  height: 667, layout: 'phone-portrait'  },
  { name: 'iPhone SE landscape',       width: 667,  height: 375, layout: 'phone-landscape' },

  // iPhone 14 / 15 (standard), 393 × 852
  { name: 'iPhone 14 portrait',        width: 393,  height: 852, layout: 'phone-portrait'  },
  { name: 'iPhone 14 landscape',       width: 852,  height: 393, layout: 'phone-landscape' },

  // iPhone 15 Pro Max, 430 × 932
  { name: 'iPhone 15 Pro Max portrait',  width: 430,  height: 932, layout: 'phone-portrait'  },
  { name: 'iPhone 15 Pro Max landscape', width: 932,  height: 430, layout: 'phone-landscape' },

  // iPad mini (6th gen), 744 × 1133
  { name: 'iPad mini portrait',        width: 744,  height: 1133, layout: 'tablet-portrait'  },
  { name: 'iPad mini landscape',       width: 1133, height: 744,  layout: 'tablet-landscape' },

  // iPad Pro 11" (M4), 834 × 1194
  { name: 'iPad Pro 11 portrait',      width: 834,  height: 1194, layout: 'tablet-portrait'  },
  { name: 'iPad Pro 11 landscape',     width: 1194, height: 834,  layout: 'tablet-landscape' },

  // iPad Pro 12.9" (M2), 1024 × 1366
  { name: 'iPad Pro 12.9 portrait',    width: 1024, height: 1366, layout: 'tablet-portrait'  },
  { name: 'iPad Pro 12.9 landscape',   width: 1366, height: 1024, layout: 'tablet-landscape' },
];

const PHONES  = VIEWPORTS.filter(v => v.layout.startsWith('phone'));
const TABLETS = VIEWPORTS.filter(v => v.layout.startsWith('tablet'));

module.exports = { VIEWPORTS, PHONES, TABLETS };
