/* ============================================================
   認識世界 — geography knowledge quiz
   Three question types mixed across a round of 10:
     A: country → capital       "日本 的首都是？"
     B: capital → country       "曼谷 是哪個國家的首都？"
     C: country → continent     "巴西 在哪個洲？"
   ============================================================ */

(() => {
  'use strict';

  const ROUNDS = 10;

  // Country data: iso, Chinese name, capital, continent, region (for filtering)
  const COUNTRIES = [
    // Asia
    { iso: 'CN', name: '中國',        capital: '北京',       continent: '亞洲',   region: 'asia' },
    { iso: 'JP', name: '日本',        capital: '東京',       continent: '亞洲',   region: 'asia' },
    { iso: 'KR', name: '南韓',        capital: '首爾',       continent: '亞洲',   region: 'asia' },
    { iso: 'TW', name: '台灣',        capital: '台北',       continent: '亞洲',   region: 'asia' },
    { iso: 'SG', name: '新加坡',      capital: '新加坡',     continent: '亞洲',   region: 'asia' },
    { iso: 'TH', name: '泰國',        capital: '曼谷',       continent: '亞洲',   region: 'asia' },
    { iso: 'VN', name: '越南',        capital: '河內',       continent: '亞洲',   region: 'asia' },
    { iso: 'MY', name: '馬來西亞',    capital: '吉隆坡',     continent: '亞洲',   region: 'asia' },
    { iso: 'ID', name: '印尼',        capital: '雅加達',     continent: '亞洲',   region: 'asia' },
    { iso: 'PH', name: '菲律賓',      capital: '馬尼拉',     continent: '亞洲',   region: 'asia' },
    { iso: 'IN', name: '印度',        capital: '新德里',     continent: '亞洲',   region: 'asia' },
    { iso: 'PK', name: '巴基斯坦',    capital: '伊斯蘭瑪巴德', continent: '亞洲', region: 'asia' },
    { iso: 'BD', name: '孟加拉',      capital: '達卡',       continent: '亞洲',   region: 'asia' },
    { iso: 'NP', name: '尼泊爾',      capital: '加德滿都',   continent: '亞洲',   region: 'asia' },
    { iso: 'MM', name: '緬甸',        capital: '奈比多',     continent: '亞洲',   region: 'asia' },
    { iso: 'KH', name: '柬埔寨',      capital: '金邊',       continent: '亞洲',   region: 'asia' },
    { iso: 'MN', name: '蒙古',        capital: '烏蘭巴托',   continent: '亞洲',   region: 'asia' },
    { iso: 'KZ', name: '哈薩克',      capital: '阿斯塔納',   continent: '亞洲',   region: 'asia' },
    { iso: 'IR', name: '伊朗',        capital: '德黑蘭',     continent: '亞洲',   region: 'asia' },
    { iso: 'SA', name: '沙烏地阿拉伯', capital: '利雅德',     continent: '亞洲',   region: 'asia' },
    { iso: 'AE', name: '阿聯',        capital: '阿布達比',   continent: '亞洲',   region: 'asia' },
    { iso: 'IL', name: '以色列',      capital: '耶路撒冷',   continent: '亞洲',   region: 'asia' },
    { iso: 'TR', name: '土耳其',      capital: '安卡拉',     continent: '亞洲',   region: 'asia' },
    { iso: 'IQ', name: '伊拉克',      capital: '巴格達',     continent: '亞洲',   region: 'asia' },

    // Europe
    { iso: 'GB', name: '英國',        capital: '倫敦',       continent: '歐洲',   region: 'europe' },
    { iso: 'IE', name: '愛爾蘭',      capital: '都柏林',     continent: '歐洲',   region: 'europe' },
    { iso: 'FR', name: '法國',        capital: '巴黎',       continent: '歐洲',   region: 'europe' },
    { iso: 'DE', name: '德國',        capital: '柏林',       continent: '歐洲',   region: 'europe' },
    { iso: 'IT', name: '義大利',      capital: '羅馬',       continent: '歐洲',   region: 'europe' },
    { iso: 'ES', name: '西班牙',      capital: '馬德里',     continent: '歐洲',   region: 'europe' },
    { iso: 'PT', name: '葡萄牙',      capital: '里斯本',     continent: '歐洲',   region: 'europe' },
    { iso: 'NL', name: '荷蘭',        capital: '阿姆斯特丹', continent: '歐洲',   region: 'europe' },
    { iso: 'BE', name: '比利時',      capital: '布魯塞爾',   continent: '歐洲',   region: 'europe' },
    { iso: 'CH', name: '瑞士',        capital: '伯恩',       continent: '歐洲',   region: 'europe' },
    { iso: 'AT', name: '奧地利',      capital: '維也納',     continent: '歐洲',   region: 'europe' },
    { iso: 'SE', name: '瑞典',        capital: '斯德哥爾摩', continent: '歐洲',   region: 'europe' },
    { iso: 'NO', name: '挪威',        capital: '奧斯陸',     continent: '歐洲',   region: 'europe' },
    { iso: 'DK', name: '丹麥',        capital: '哥本哈根',   continent: '歐洲',   region: 'europe' },
    { iso: 'FI', name: '芬蘭',        capital: '赫爾辛基',   continent: '歐洲',   region: 'europe' },
    { iso: 'PL', name: '波蘭',        capital: '華沙',       continent: '歐洲',   region: 'europe' },
    { iso: 'CZ', name: '捷克',        capital: '布拉格',     continent: '歐洲',   region: 'europe' },
    { iso: 'HU', name: '匈牙利',      capital: '布達佩斯',   continent: '歐洲',   region: 'europe' },
    { iso: 'GR', name: '希臘',        capital: '雅典',       continent: '歐洲',   region: 'europe' },
    { iso: 'RO', name: '羅馬尼亞',    capital: '布加勒斯特', continent: '歐洲',   region: 'europe' },
    { iso: 'UA', name: '烏克蘭',      capital: '基輔',       continent: '歐洲',   region: 'europe' },
    { iso: 'RU', name: '俄羅斯',      capital: '莫斯科',     continent: '歐洲',   region: 'europe' },

    // Africa
    { iso: 'EG', name: '埃及',        capital: '開羅',       continent: '非洲',   region: 'africa' },
    { iso: 'MA', name: '摩洛哥',      capital: '拉巴特',     continent: '非洲',   region: 'africa' },
    { iso: 'DZ', name: '阿爾及利亞',  capital: '阿爾及爾',   continent: '非洲',   region: 'africa' },
    { iso: 'NG', name: '奈及利亞',    capital: '阿布加',     continent: '非洲',   region: 'africa' },
    { iso: 'KE', name: '肯亞',        capital: '奈洛比',     continent: '非洲',   region: 'africa' },
    { iso: 'ET', name: '衣索比亞',    capital: '阿迪斯阿貝巴', continent: '非洲', region: 'africa' },
    { iso: 'GH', name: '迦納',        capital: '阿克拉',     continent: '非洲',   region: 'africa' },
    { iso: 'ZA', name: '南非',        capital: '普利托利亞', continent: '非洲',   region: 'africa' },

    // Americas
    { iso: 'US', name: '美國',        capital: '華盛頓',     continent: '北美洲', region: 'americas' },
    { iso: 'CA', name: '加拿大',      capital: '渥太華',     continent: '北美洲', region: 'americas' },
    { iso: 'MX', name: '墨西哥',      capital: '墨西哥城',   continent: '北美洲', region: 'americas' },
    { iso: 'CU', name: '古巴',        capital: '哈瓦那',     continent: '北美洲', region: 'americas' },
    { iso: 'BR', name: '巴西',        capital: '巴西利亞',   continent: '南美洲', region: 'americas' },
    { iso: 'AR', name: '阿根廷',      capital: '布宜諾斯艾利斯', continent: '南美洲', region: 'americas' },
    { iso: 'CL', name: '智利',        capital: '聖地牙哥',   continent: '南美洲', region: 'americas' },
    { iso: 'PE', name: '秘魯',        capital: '利馬',       continent: '南美洲', region: 'americas' },
    { iso: 'CO', name: '哥倫比亞',    capital: '波哥大',     continent: '南美洲', region: 'americas' },
    { iso: 'VE', name: '委內瑞拉',    capital: '卡拉卡斯',   continent: '南美洲', region: 'americas' },

    // Oceania
    { iso: 'AU', name: '澳洲',        capital: '坎培拉',     continent: '大洋洲', region: 'oceania' },
    { iso: 'NZ', name: '紐西蘭',      capital: '威靈頓',     continent: '大洋洲', region: 'oceania' },
  ];

  const ALL_CONTINENTS = ['亞洲', '歐洲', '非洲', '北美洲', '南美洲', '大洋洲'];

  const REGIONS = {
    world:    { label: '世界' },
    asia:     { label: '亞洲' },
    europe:   { label: '歐洲' },
    americas: { label: '美洲' },
    africa:   { label: '非洲' },
    oceania:  { label: '大洋洲' },
  };

  function regionFilter(region) {
    if (region === 'world') return () => true;
    return c => c.region === region;
  }

  function flagEmoji(iso) {
    return String.fromCodePoint(
      ...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  }

  // --- DOM ---
  const qFlag = document.getElementById('q-flag');
  const qPre  = document.getElementById('q-pre');
  const qMain = document.getElementById('q-main');
  const qPost = document.getElementById('q-post');
  const choicesEl = document.getElementById('choices');
  const qNumEl = document.getElementById('q-num');
  const scoreEl = document.getElementById('score');

  const regionBtn = document.getElementById('region-btn');
  const regionLabel = document.getElementById('region-label');
  const regionModal = document.getElementById('region-modal');
  const regionOptions = document.getElementById('region-options');
  const regionCancel = document.getElementById('region-cancel');

  const endModal = document.getElementById('end-modal');
  const endTitle = document.getElementById('end-title');
  const endSub   = document.getElementById('end-sub');
  const endScoreEl = document.getElementById('end-score');
  const endBestEl  = document.getElementById('end-best');
  const endRestart = document.getElementById('end-restart');

  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  // --- State ---
  let region = 'world';
  let pool = [];
  let questions = [];
  let qIdx = 0;
  let score = 0;
  let locked = false;
  const bestScores = {};

  try {
    const saved = localStorage.getItem('geo2-region');
    if (saved && REGIONS[saved]) region = saved;
    const savedBest = JSON.parse(localStorage.getItem('geo2-best') || '{}');
    Object.assign(bestScores, savedBest);
  } catch (_) {}

  // --- Sound (same synth as before) ---
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
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // --- Question builders ---
  function qCountryToCapital(target) {
    const distractors = randomFrom(pool.filter(c => c.iso !== target.iso), 3);
    const choices = shuffle([target, ...distractors]).map(c => ({ label: c.capital, correct: c.iso === target.iso }));
    return {
      type: 'cap',
      flag: flagEmoji(target.iso),
      pre: '',
      main: target.name,
      post: ' 的首都是？',
      choices,
      answer: target.capital,
    };
  }

  function qCapitalToCountry(target) {
    const distractors = randomFrom(pool.filter(c => c.iso !== target.iso), 3);
    const choices = shuffle([target, ...distractors]).map(c => ({ label: c.name, correct: c.iso === target.iso }));
    return {
      type: 'country',
      flag: '',
      pre: '',
      main: target.capital,
      post: ' 是哪個國家的首都？',
      choices,
      answer: target.name,
    };
  }

  function qCountryToContinent(target) {
    // Distractors: other continents; keep it simple — pick from full list
    const distractors = ALL_CONTINENTS.filter(c => c !== target.continent);
    const picked = randomFrom(distractors, Math.min(3, distractors.length));
    const choices = shuffle([target.continent, ...picked]).map(c => ({ label: c, correct: c === target.continent }));
    return {
      type: 'continent',
      flag: flagEmoji(target.iso),
      pre: '',
      main: target.name,
      post: ' 在哪個洲？',
      choices,
      answer: target.continent,
    };
  }

  function buildQuestion(target) {
    // Weighted mix: 40% cap, 40% country, 20% continent
    const r = Math.random();
    if (r < 0.4) return qCountryToCapital(target);
    if (r < 0.8) return qCapitalToCountry(target);
    return qCountryToContinent(target);
  }

  function buildQuestions() {
    pool = COUNTRIES.filter(regionFilter(region));
    const pickCount = Math.min(ROUNDS, pool.length);
    const targets = randomFrom(pool, pickCount);
    questions = targets.map(buildQuestion);
    // Pad if pool was small
    while (questions.length < ROUNDS) {
      questions.push(buildQuestion(pickOne(pool)));
    }
  }

  // --- Render ---
  function renderQuestion() {
    const q = questions[qIdx];
    qFlag.textContent = q.flag || '';
    qPre.textContent  = q.pre || '';
    qMain.textContent = q.main;
    qPost.textContent = q.post || '';

    choicesEl.innerHTML = '';
    q.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.type = 'button';
      btn.textContent = choice.label;
      btn.addEventListener('click', () => onChoice(btn, choice, q));
      choicesEl.appendChild(btn);
    });

    qNumEl.textContent = String(qIdx + 1);
    scoreEl.textContent = String(score);
    locked = false;
  }

  function onChoice(btn, choice, q) {
    if (locked) return;
    SFX.unlock();
    locked = true;

    Array.from(choicesEl.children).forEach(b => b.classList.add('locked'));

    if (choice.correct) {
      btn.classList.add('correct');
      score++;
      scoreEl.textContent = String(score);
      SFX.correct();
      setTimeout(advance, 900);
    } else {
      btn.classList.add('wrong');
      // Highlight the correct answer in green
      Array.from(choicesEl.children).forEach(b => {
        if (b.textContent === q.answer) b.classList.add('correct');
      });
      SFX.wrong();
      setTimeout(advance, 1800);
    }
  }

  function advance() {
    qIdx++;
    if (qIdx >= questions.length) showEnd();
    else renderQuestion();
  }

  function showEnd() {
    const prev = bestScores[region] || 0;
    const newBest = Math.max(prev, score);
    bestScores[region] = newBest;
    try { localStorage.setItem('geo2-best', JSON.stringify(bestScores)); } catch (_) {}

    endTitle.textContent = score === ROUNDS
      ? '\u{1F3C6} 完美！全部答對！'
      : score >= ROUNDS * 0.8 ? '\u{1F31F} 太厲害了！'
      : score >= ROUNDS * 0.5 ? '\u{1F44D} 不錯的表現！'
      : '這局結束';
    endSub.textContent = '再來一局，慢慢累積常識';
    endScoreEl.textContent = String(score);
    endBestEl.textContent = String(newBest);
    SFX.end(score >= ROUNDS * 0.5);
    endModal.classList.add('show');
  }

  // --- Region picker ---
  function openRegionModal() {
    const opts = regionOptions.querySelectorAll('.target-option');
    opts.forEach(btn => btn.classList.toggle('current', btn.dataset.region === region));
    regionModal.classList.add('show');
  }
  function closeRegionModal() { regionModal.classList.remove('show'); }
  function applyRegion(r) {
    if (r === region) { closeRegionModal(); return; }
    region = r;
    try { localStorage.setItem('geo2-region', r); } catch (_) {}
    closeRegionModal();
    newGame();
  }

  // --- Lifecycle ---
  function newGame() {
    score = 0;
    qIdx = 0;
    locked = false;
    endModal.classList.remove('show');
    regionLabel.textContent = REGIONS[region].label;
    buildQuestions();
    if (questions.length === 0) return;
    renderQuestion();
  }

  // --- Wiring ---
  function setupEvents() {
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

    // iOS audio unlock on first interaction
    const firstTouch = () => {
      SFX.unlock();
      document.removeEventListener('pointerdown', firstTouch, true);
      document.removeEventListener('touchstart', firstTouch, true);
    };
    document.addEventListener('pointerdown', firstTouch, true);
    document.addEventListener('touchstart', firstTouch, true);
  }

  function init() {
    setupEvents();
    newGame();
    // SW is registered by the inline update script in index.html
  }

  init();
})();
