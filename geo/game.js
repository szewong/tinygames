/* ============================================================
   認識世界 — tap-the-location geography game
   Equirectangular world map (1000 × 500 viewBox). Country pins at
   real lat/lon. Tap the map where you think the country is, nearest
   pin wins.
   ============================================================ */

(() => {
  'use strict';

  const ROUNDS = 10;
  const MAP_W = 1000;
  const MAP_H = 500;

  // Max distance (in SVG units) from tap point to target pin that still
  // counts as a correct answer. Pins rendered at r≈10; this is generous.
  const HIT_TOLERANCE = 42;

  // Country centroids (lat, lon). Traditional Chinese names.
  const COUNTRIES = [
    // Europe
    { iso: 'GB', name: '英國',        lat: 54,   lon: -2,  region: 'europe' },
    { iso: 'IE', name: '愛爾蘭',      lat: 53,   lon: -8,  region: 'europe' },
    { iso: 'FR', name: '法國',        lat: 46,   lon: 2,   region: 'europe' },
    { iso: 'DE', name: '德國',        lat: 51,   lon: 10,  region: 'europe' },
    { iso: 'IT', name: '義大利',      lat: 42,   lon: 12,  region: 'europe' },
    { iso: 'ES', name: '西班牙',      lat: 40,   lon: -4,  region: 'europe' },
    { iso: 'PT', name: '葡萄牙',      lat: 39,   lon: -8,  region: 'europe' },
    { iso: 'NL', name: '荷蘭',        lat: 52,   lon: 5,   region: 'europe' },
    { iso: 'BE', name: '比利時',      lat: 50,   lon: 4,   region: 'europe' },
    { iso: 'CH', name: '瑞士',        lat: 47,   lon: 8,   region: 'europe' },
    { iso: 'AT', name: '奧地利',      lat: 47,   lon: 14,  region: 'europe' },
    { iso: 'SE', name: '瑞典',        lat: 62,   lon: 15,  region: 'europe' },
    { iso: 'NO', name: '挪威',        lat: 62,   lon: 10,  region: 'europe' },
    { iso: 'DK', name: '丹麥',        lat: 56,   lon: 10,  region: 'europe' },
    { iso: 'FI', name: '芬蘭',        lat: 64,   lon: 26,  region: 'europe' },
    { iso: 'PL', name: '波蘭',        lat: 52,   lon: 20,  region: 'europe' },
    { iso: 'CZ', name: '捷克',        lat: 50,   lon: 15,  region: 'europe' },
    { iso: 'GR', name: '希臘',        lat: 39,   lon: 22,  region: 'europe' },
    { iso: 'RU', name: '俄羅斯',      lat: 62,   lon: 90,  region: 'europe' },
    { iso: 'UA', name: '烏克蘭',      lat: 49,   lon: 32,  region: 'europe' },
    { iso: 'HU', name: '匈牙利',      lat: 47,   lon: 19,  region: 'europe' },
    { iso: 'RO', name: '羅馬尼亞',    lat: 46,   lon: 25,  region: 'europe' },
    { iso: 'TR', name: '土耳其',      lat: 39,   lon: 35,  region: 'europe' },

    // Asia + Middle East
    { iso: 'CN', name: '中國',        lat: 35,   lon: 105, region: 'asia' },
    { iso: 'JP', name: '日本',        lat: 36,   lon: 138, region: 'asia' },
    { iso: 'KR', name: '南韓',        lat: 36,   lon: 128, region: 'asia' },
    { iso: 'TW', name: '台灣',        lat: 24,   lon: 121, region: 'asia' },
    { iso: 'HK', name: '香港',        lat: 22,   lon: 114, region: 'asia' },
    { iso: 'SG', name: '新加坡',      lat: 1,    lon: 104, region: 'asia' },
    { iso: 'TH', name: '泰國',        lat: 15,   lon: 101, region: 'asia' },
    { iso: 'VN', name: '越南',        lat: 16,   lon: 108, region: 'asia' },
    { iso: 'MY', name: '馬來西亞',    lat: 4,    lon: 102, region: 'asia' },
    { iso: 'IN', name: '印度',        lat: 22,   lon: 78,  region: 'asia' },
    { iso: 'ID', name: '印尼',        lat: -2,   lon: 118, region: 'asia' },
    { iso: 'PH', name: '菲律賓',      lat: 13,   lon: 122, region: 'asia' },
    { iso: 'PK', name: '巴基斯坦',    lat: 30,   lon: 70,  region: 'asia' },
    { iso: 'BD', name: '孟加拉',      lat: 24,   lon: 90,  region: 'asia' },
    { iso: 'MN', name: '蒙古',        lat: 46,   lon: 105, region: 'asia' },
    { iso: 'KZ', name: '哈薩克',      lat: 48,   lon: 68,  region: 'asia' },
    { iso: 'NP', name: '尼泊爾',      lat: 28,   lon: 84,  region: 'asia' },
    { iso: 'MM', name: '緬甸',        lat: 21,   lon: 96,  region: 'asia' },
    { iso: 'IR', name: '伊朗',        lat: 32,   lon: 53,  region: 'asia' },
    { iso: 'SA', name: '沙烏地阿拉伯', lat: 24,   lon: 45,  region: 'asia' },
    { iso: 'AE', name: '阿聯',        lat: 24,   lon: 54,  region: 'asia' },
    { iso: 'IL', name: '以色列',      lat: 31,   lon: 35,  region: 'asia' },
    { iso: 'IQ', name: '伊拉克',      lat: 33,   lon: 44,  region: 'asia' },

    // Africa
    { iso: 'EG', name: '埃及',        lat: 27,   lon: 30,  region: 'africa' },
    { iso: 'MA', name: '摩洛哥',      lat: 32,   lon: -6,  region: 'africa' },
    { iso: 'DZ', name: '阿爾及利亞',  lat: 28,   lon: 3,   region: 'africa' },
    { iso: 'NG', name: '奈及利亞',    lat: 9,    lon: 8,   region: 'africa' },
    { iso: 'KE', name: '肯亞',        lat: -1,   lon: 38,  region: 'africa' },
    { iso: 'ET', name: '衣索比亞',    lat: 9,    lon: 40,  region: 'africa' },
    { iso: 'GH', name: '迦納',        lat: 8,    lon: -1,  region: 'africa' },
    { iso: 'TZ', name: '坦尚尼亞',    lat: -6,   lon: 35,  region: 'africa' },
    { iso: 'ZA', name: '南非',        lat: -30,  lon: 24,  region: 'africa' },
    { iso: 'MG', name: '馬達加斯加',  lat: -19,  lon: 47,  region: 'africa' },

    // Americas
    { iso: 'US', name: '美國',        lat: 40,   lon: -98, region: 'americas' },
    { iso: 'CA', name: '加拿大',      lat: 58,   lon: -100,region: 'americas' },
    { iso: 'MX', name: '墨西哥',      lat: 23,   lon: -102,region: 'americas' },
    { iso: 'CU', name: '古巴',        lat: 22,   lon: -78, region: 'americas' },
    { iso: 'BR', name: '巴西',        lat: -14,  lon: -53, region: 'americas' },
    { iso: 'AR', name: '阿根廷',      lat: -35,  lon: -65, region: 'americas' },
    { iso: 'CL', name: '智利',        lat: -33,  lon: -71, region: 'americas' },
    { iso: 'PE', name: '秘魯',        lat: -10,  lon: -76, region: 'americas' },
    { iso: 'CO', name: '哥倫比亞',    lat: 4,    lon: -74, region: 'americas' },
    { iso: 'VE', name: '委內瑞拉',    lat: 7,    lon: -66, region: 'americas' },

    // Oceania
    { iso: 'AU', name: '澳洲',        lat: -25,  lon: 135, region: 'oceania' },
    { iso: 'NZ', name: '紐西蘭',      lat: -41,  lon: 172, region: 'oceania' },
  ];

  // Region viewBoxes (zoom) — some padding included.
  const REGIONS = {
    world:    { label: '世界',   viewBox: '0 0 1000 500' },
    europe:   { label: '歐洲',   viewBox: '430 55 215 160' },
    asia:     { label: '亞洲',   viewBox: '600 50 360 260' },
    americas: { label: '美洲',   viewBox: '70 40 320 450' },
    africa:   { label: '非洲',   viewBox: '430 150 240 280' },
    oceania:  { label: '大洋洲', viewBox: '770 310 220 160' },
  };

  function regionFilter(region) {
    if (region === 'world')  return () => true;
    if (region === 'asia')   return c => c.region === 'asia';
    if (region === 'europe') return c => c.region === 'europe';
    return c => c.region === region;
  }

  function project(lat, lon) {
    return {
      x: ((lon + 180) / 360) * MAP_W,
      y: ((90 - lat)  / 180) * MAP_H,
    };
  }

  // --- DOM ---
  const mapEl = document.getElementById('map');
  const pinsEl = document.getElementById('pins');
  const overlayEl = document.getElementById('overlay');
  const promptTarget = document.getElementById('prompt-target');
  const qNumEl = document.getElementById('q-num');
  const scoreEl = document.getElementById('score');
  const regionBtn = document.getElementById('region-btn');
  const regionLabel = document.getElementById('region-label');
  const regionModal = document.getElementById('region-modal');
  const regionOptions = document.getElementById('region-options');
  const regionCancel = document.getElementById('region-cancel');

  const endModal = document.getElementById('end-modal');
  const endTitle = document.getElementById('end-title');
  const endSub = document.getElementById('end-sub');
  const endScoreEl = document.getElementById('end-score');
  const endBestEl = document.getElementById('end-best');
  const endRestart = document.getElementById('end-restart');

  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  // --- State ---
  let region = 'world';
  let activeCountries = [];
  let questions = [];
  let qIdx = 0;
  let score = 0;
  let locked = false;
  const bestScores = {};

  try {
    const saved = localStorage.getItem('geo-region');
    if (saved && REGIONS[saved]) region = saved;
    const savedBest = JSON.parse(localStorage.getItem('geo-best-map') || '{}');
    Object.assign(bestScores, savedBest);
  } catch (_) {}

  // --- Sound effects ---
  const SFX = (() => {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem('geo-muted') === '1'; } catch (_) {}
    const ensureCtx = () => {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (_) { return null; }
      return ctx;
    };
    const unlock = () => {
      const c = ensureCtx();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    };
    const tone = ({ freq, dur = 0.12, vol = 0.16, delay = 0, type = 'sine', freqEnd }) => {
      if (muted) return;
      const c = ensureCtx(); if (!c) return;
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      osc.type = type; osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    };
    return {
      unlock,
      correct() {
        tone({ freq: 660, dur: 0.12, vol: 0.18 });
        tone({ freq: 990, dur: 0.18, vol: 0.18, delay: 0.10 });
      },
      wrong() { tone({ freq: 280, dur: 0.20, vol: 0.16, freqEnd: 170 }); },
      end(won) {
        const notes = won ? [523, 659, 784, 1046] : [392, 330, 262];
        notes.forEach((f, i) => tone({ freq: f, dur: 0.22, vol: 0.18, delay: i * 0.12 }));
      },
    };
  })();

  // --- Utilities ---
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function randomFrom(arr, n) { return shuffle(arr).slice(0, n); }

  // --- Rendering ---
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function renderPins() {
    pinsEl.innerHTML = '';
    overlayEl.innerHTML = '';
    for (const c of activeCountries) {
      const { x, y } = project(c.lat, c.lon);
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.classList.add('pin-dot');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      dot.setAttribute('r', 7);
      dot.dataset.iso = c.iso;
      pinsEl.appendChild(dot);
    }
  }

  function setRegionView() {
    mapEl.setAttribute('viewBox', REGIONS[region].viewBox);
    regionLabel.textContent = REGIONS[region].label;
  }

  // --- Question flow ---
  function buildQuestions() {
    activeCountries = COUNTRIES.filter(regionFilter(region));
    // If fewer countries than ROUNDS, allow repeats but prefer uniqueness
    const pool = activeCountries.slice();
    if (pool.length < ROUNDS) {
      questions = randomFrom(pool, pool.length);
      // Pad with random picks
      while (questions.length < ROUNDS) {
        questions.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    } else {
      questions = randomFrom(pool, ROUNDS);
    }
  }

  function renderRound() {
    overlayEl.innerHTML = '';
    const q = questions[qIdx];
    promptTarget.textContent = q.name;
    qNumEl.textContent = String(qIdx + 1);
    scoreEl.textContent = String(score);
    locked = false;
  }

  function svgPointFromEvent(e) {
    const pt = mapEl.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = mapEl.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  function nearestPin(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const c of activeCountries) {
      const p = project(c.lat, c.lon);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestD) { bestD = d; best = c; }
    }
    return { country: best, distance: bestD };
  }

  function onMapPointerDown(e) {
    if (locked) return;
    SFX.unlock();
    const p = svgPointFromEvent(e);
    if (!p) return;
    const target = questions[qIdx];
    const targetP = project(target.lat, target.lon);
    const tapDistanceToTarget = Math.hypot(targetP.x - p.x, targetP.y - p.y);
    const { country: nearest } = nearestPin(p.x, p.y);

    const isCorrect = nearest && nearest.iso === target.iso && tapDistanceToTarget <= HIT_TOLERANCE;

    locked = true;

    if (isCorrect) {
      score++;
      scoreEl.textContent = String(score);
      SFX.correct();
      showFeedbackPin(targetP, target.name, 'correct');
      setTimeout(advance, 950);
    } else {
      SFX.wrong();
      // Show the user's tap as a wrong marker
      showFeedbackPin({ x: p.x, y: p.y }, '', 'wrong');
      // Show the correct location in green
      showFeedbackPin(targetP, target.name, 'correct');
      setTimeout(advance, 2000);
    }
  }

  function showFeedbackPin(pt, label, kind) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.classList.add(kind === 'correct' ? 'pin-correct' : 'pin-wrong');
    dot.setAttribute('cx', pt.x);
    dot.setAttribute('cy', pt.y);
    dot.setAttribute('r', 11);
    overlayEl.appendChild(dot);
    if (label) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.classList.add('pin-label', kind);
      text.setAttribute('x', pt.x);
      text.setAttribute('y', pt.y - 16);
      text.textContent = label;
      overlayEl.appendChild(text);
    }
  }

  function advance() {
    qIdx++;
    if (qIdx >= questions.length) {
      showEnd();
    } else {
      renderRound();
    }
  }

  function showEnd() {
    const prev = bestScores[region] || 0;
    const newBest = Math.max(prev, score);
    bestScores[region] = newBest;
    try { localStorage.setItem('geo-best-map', JSON.stringify(bestScores)); } catch (_) {}

    endTitle.textContent = score === ROUNDS
      ? '\u{1F3C6} 完美！全部答對！'
      : score >= ROUNDS * 0.8 ? '\u{1F31F} 太厲害了！'
      : score >= ROUNDS * 0.5 ? '\u{1F44D} 不錯的表現！'
      : '這局結束';
    endSub.textContent = '再來一局，慢慢就會熟悉';
    endScoreEl.textContent = String(score);
    endBestEl.textContent = String(newBest);
    SFX.end(score >= ROUNDS * 0.5);
    endModal.classList.add('show');
  }

  // --- Region picker ---
  function openRegionModal() {
    const opts = regionOptions.querySelectorAll('.target-option');
    opts.forEach(btn => {
      btn.classList.toggle('current', btn.dataset.region === region);
    });
    regionModal.classList.add('show');
  }
  function closeRegionModal() { regionModal.classList.remove('show'); }
  function applyRegion(r) {
    if (r === region) { closeRegionModal(); return; }
    region = r;
    try { localStorage.setItem('geo-region', r); } catch (_) {}
    closeRegionModal();
    newGame();
  }

  // --- Lifecycle ---
  function newGame() {
    score = 0;
    qIdx = 0;
    locked = false;
    endModal.classList.remove('show');
    setRegionView();
    buildQuestions();
    if (questions.length === 0) return;
    renderPins();
    renderRound();
  }

  // --- Wiring ---
  function setupEvents() {
    mapEl.addEventListener('pointerdown', onMapPointerDown);

    regionBtn.addEventListener('click', () => { SFX.unlock(); openRegionModal(); });
    regionCancel.addEventListener('click', closeRegionModal);
    regionModal.addEventListener('click', (e) => {
      if (e.target === regionModal) closeRegionModal();
    });
    regionOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.target-option');
      if (!btn) return;
      const r = btn.dataset.region;
      if (REGIONS[r]) applyRegion(r);
    });

    endRestart.addEventListener('click', () => { SFX.unlock(); newGame(); });

    helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
    helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    // iOS audio-unlock on first interaction
    const firstTouch = () => {
      SFX.unlock();
      document.removeEventListener('pointerdown', firstTouch, true);
      document.removeEventListener('touchstart', firstTouch, true);
    };
    document.addEventListener('pointerdown', firstTouch, true);
    document.addEventListener('touchstart', firstTouch, true);
  }

  // --- Init ---
  function init() {
    setupEvents();
    newGame();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
