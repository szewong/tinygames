/* ============================================================
   認識世界 — flag → country multiple choice
   Traditional Chinese labels. Emoji flags render natively on iPad.
   ============================================================ */

(() => {
  'use strict';

  const ROUNDS = 10;

  // --- Country data ---
  // tier: 1 = most-known, 2 = moderately known, 3 = less common
  // region: asia, europe, americas, africa, oceania, middle_east
  const COUNTRIES = [
    // Tier 1 — most widely recognised
    { iso: 'US', name: '美國',       tier: 1, region: 'americas' },
    { iso: 'GB', name: '英國',       tier: 1, region: 'europe' },
    { iso: 'FR', name: '法國',       tier: 1, region: 'europe' },
    { iso: 'DE', name: '德國',       tier: 1, region: 'europe' },
    { iso: 'IT', name: '義大利',     tier: 1, region: 'europe' },
    { iso: 'ES', name: '西班牙',     tier: 1, region: 'europe' },
    { iso: 'NL', name: '荷蘭',       tier: 1, region: 'europe' },
    { iso: 'CH', name: '瑞士',       tier: 1, region: 'europe' },
    { iso: 'SE', name: '瑞典',       tier: 1, region: 'europe' },
    { iso: 'GR', name: '希臘',       tier: 1, region: 'europe' },
    { iso: 'RU', name: '俄羅斯',     tier: 1, region: 'europe' },
    { iso: 'TR', name: '土耳其',     tier: 1, region: 'europe' },
    { iso: 'CN', name: '中國',       tier: 1, region: 'asia' },
    { iso: 'JP', name: '日本',       tier: 1, region: 'asia' },
    { iso: 'KR', name: '南韓',       tier: 1, region: 'asia' },
    { iso: 'TW', name: '台灣',       tier: 1, region: 'asia' },
    { iso: 'HK', name: '香港',       tier: 1, region: 'asia' },
    { iso: 'SG', name: '新加坡',     tier: 1, region: 'asia' },
    { iso: 'TH', name: '泰國',       tier: 1, region: 'asia' },
    { iso: 'VN', name: '越南',       tier: 1, region: 'asia' },
    { iso: 'MY', name: '馬來西亞',   tier: 1, region: 'asia' },
    { iso: 'IN', name: '印度',       tier: 1, region: 'asia' },
    { iso: 'ID', name: '印尼',       tier: 1, region: 'asia' },
    { iso: 'PH', name: '菲律賓',     tier: 1, region: 'asia' },
    { iso: 'CA', name: '加拿大',     tier: 1, region: 'americas' },
    { iso: 'MX', name: '墨西哥',     tier: 1, region: 'americas' },
    { iso: 'BR', name: '巴西',       tier: 1, region: 'americas' },
    { iso: 'AR', name: '阿根廷',     tier: 1, region: 'americas' },
    { iso: 'AU', name: '澳洲',       tier: 1, region: 'oceania' },
    { iso: 'NZ', name: '紐西蘭',     tier: 1, region: 'oceania' },
    { iso: 'EG', name: '埃及',       tier: 1, region: 'africa' },
    { iso: 'ZA', name: '南非',       tier: 1, region: 'africa' },

    // Tier 2 — moderately known
    { iso: 'IE', name: '愛爾蘭',     tier: 2, region: 'europe' },
    { iso: 'PT', name: '葡萄牙',     tier: 2, region: 'europe' },
    { iso: 'BE', name: '比利時',     tier: 2, region: 'europe' },
    { iso: 'AT', name: '奧地利',     tier: 2, region: 'europe' },
    { iso: 'DK', name: '丹麥',       tier: 2, region: 'europe' },
    { iso: 'NO', name: '挪威',       tier: 2, region: 'europe' },
    { iso: 'FI', name: '芬蘭',       tier: 2, region: 'europe' },
    { iso: 'PL', name: '波蘭',       tier: 2, region: 'europe' },
    { iso: 'CZ', name: '捷克',       tier: 2, region: 'europe' },
    { iso: 'HU', name: '匈牙利',     tier: 2, region: 'europe' },
    { iso: 'RO', name: '羅馬尼亞',   tier: 2, region: 'europe' },
    { iso: 'UA', name: '烏克蘭',     tier: 2, region: 'europe' },
    { iso: 'PK', name: '巴基斯坦',   tier: 2, region: 'asia' },
    { iso: 'BD', name: '孟加拉',     tier: 2, region: 'asia' },
    { iso: 'LK', name: '斯里蘭卡',   tier: 2, region: 'asia' },
    { iso: 'MM', name: '緬甸',       tier: 2, region: 'asia' },
    { iso: 'KH', name: '柬埔寨',     tier: 2, region: 'asia' },
    { iso: 'NP', name: '尼泊爾',     tier: 2, region: 'asia' },
    { iso: 'MN', name: '蒙古',       tier: 2, region: 'asia' },
    { iso: 'IL', name: '以色列',     tier: 2, region: 'middle_east' },
    { iso: 'SA', name: '沙烏地阿拉伯', tier: 2, region: 'middle_east' },
    { iso: 'AE', name: '阿拉伯聯合大公國', tier: 2, region: 'middle_east' },
    { iso: 'IR', name: '伊朗',       tier: 2, region: 'middle_east' },
    { iso: 'MA', name: '摩洛哥',     tier: 2, region: 'africa' },
    { iso: 'NG', name: '奈及利亞',   tier: 2, region: 'africa' },
    { iso: 'KE', name: '肯亞',       tier: 2, region: 'africa' },
    { iso: 'ET', name: '衣索比亞',   tier: 2, region: 'africa' },
    { iso: 'CL', name: '智利',       tier: 2, region: 'americas' },
    { iso: 'PE', name: '秘魯',       tier: 2, region: 'americas' },
    { iso: 'CO', name: '哥倫比亞',   tier: 2, region: 'americas' },
    { iso: 'CU', name: '古巴',       tier: 2, region: 'americas' },

    // Tier 3 — less common
    { iso: 'IS', name: '冰島',       tier: 3, region: 'europe' },
    { iso: 'EE', name: '愛沙尼亞',   tier: 3, region: 'europe' },
    { iso: 'LV', name: '拉脫維亞',   tier: 3, region: 'europe' },
    { iso: 'LT', name: '立陶宛',     tier: 3, region: 'europe' },
    { iso: 'LU', name: '盧森堡',     tier: 3, region: 'europe' },
    { iso: 'MT', name: '馬爾他',     tier: 3, region: 'europe' },
    { iso: 'SI', name: '斯洛維尼亞', tier: 3, region: 'europe' },
    { iso: 'HR', name: '克羅埃西亞', tier: 3, region: 'europe' },
    { iso: 'RS', name: '塞爾維亞',   tier: 3, region: 'europe' },
    { iso: 'BG', name: '保加利亞',   tier: 3, region: 'europe' },
    { iso: 'SK', name: '斯洛伐克',   tier: 3, region: 'europe' },
    { iso: 'CY', name: '賽普勒斯',   tier: 3, region: 'europe' },
    { iso: 'GE', name: '喬治亞',     tier: 3, region: 'europe' },
    { iso: 'KZ', name: '哈薩克',     tier: 3, region: 'asia' },
    { iso: 'UZ', name: '烏茲別克',   tier: 3, region: 'asia' },
    { iso: 'AF', name: '阿富汗',     tier: 3, region: 'asia' },
    { iso: 'BT', name: '不丹',       tier: 3, region: 'asia' },
    { iso: 'LA', name: '寮國',       tier: 3, region: 'asia' },
    { iso: 'QA', name: '卡達',       tier: 3, region: 'middle_east' },
    { iso: 'KW', name: '科威特',     tier: 3, region: 'middle_east' },
    { iso: 'OM', name: '阿曼',       tier: 3, region: 'middle_east' },
    { iso: 'JO', name: '約旦',       tier: 3, region: 'middle_east' },
    { iso: 'LB', name: '黎巴嫩',     tier: 3, region: 'middle_east' },
    { iso: 'TN', name: '突尼西亞',   tier: 3, region: 'africa' },
    { iso: 'DZ', name: '阿爾及利亞', tier: 3, region: 'africa' },
    { iso: 'GH', name: '迦納',       tier: 3, region: 'africa' },
    { iso: 'TZ', name: '坦尚尼亞',   tier: 3, region: 'africa' },
    { iso: 'MG', name: '馬達加斯加', tier: 3, region: 'africa' },
    { iso: 'UY', name: '烏拉圭',     tier: 3, region: 'americas' },
    { iso: 'PY', name: '巴拉圭',     tier: 3, region: 'americas' },
    { iso: 'VE', name: '委內瑞拉',   tier: 3, region: 'americas' },
    { iso: 'FJ', name: '斐濟',       tier: 3, region: 'oceania' },
  ];

  function flagEmoji(iso) {
    return String.fromCodePoint(
      ...[...iso.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
    );
  }

  // --- Difficulty → country pool ---
  const DIFFICULTIES = {
    easy:   { label: '輕鬆', filter: c => c.tier === 1 },
    normal: { label: '普通', filter: c => c.tier <= 2 },
    hard:   { label: '挑戰', filter: c => true },
    asia:   { label: '亞洲', filter: c => c.region === 'asia' || c.region === 'middle_east' },
  };

  // --- DOM ---
  const flagEl = document.getElementById('flag');
  const revealEl = document.getElementById('reveal');
  const choicesEl = document.getElementById('choices');
  const qNumEl = document.getElementById('q-num');
  const scoreEl = document.getElementById('score');
  const diffBtn = document.getElementById('diff-btn');
  const diffLabel = document.getElementById('diff-label');
  const diffModal = document.getElementById('diff-modal');
  const diffOptions = document.getElementById('diff-options');
  const diffCancel = document.getElementById('diff-cancel');

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
  let difficulty = 'normal';
  let pool = [];
  let questions = [];   // array of { target, choices: [country] }
  let qIdx = 0;
  let score = 0;
  let locked = false;
  const bestScores = {};  // difficulty -> best score

  try {
    const saved = localStorage.getItem('geo-difficulty');
    if (saved && DIFFICULTIES[saved]) difficulty = saved;
    const savedBest = JSON.parse(localStorage.getItem('geo-best') || '{}');
    Object.assign(bestScores, savedBest);
  } catch (_) {}

  // --- Sound (minimal Web Audio synth) ---
  const SFX = (() => {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem('geo-muted') === '1'; } catch (_) {}
    function ensureCtx() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (_) { return null; }
      return ctx;
    }
    function unlock() {
      const c = ensureCtx();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    }
    function tone({ freq, dur = 0.12, vol = 0.16, delay = 0, type = 'sine', freqEnd }) {
      if (muted) return;
      const c = ensureCtx();
      if (!c) return;
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }
    return {
      unlock,
      correct() {
        tone({ freq: 660, dur: 0.12, vol: 0.18 });
        tone({ freq: 990, dur: 0.18, vol: 0.18, delay: 0.10 });
      },
      wrong() {
        tone({ freq: 280, dur: 0.20, vol: 0.16, freqEnd: 170 });
      },
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

  function randomFrom(arr, n) {
    return shuffle(arr).slice(0, n);
  }

  // --- Question generation ---
  function buildQuestions() {
    pool = COUNTRIES.filter(DIFFICULTIES[difficulty].filter);
    const targets = randomFrom(pool, Math.min(ROUNDS, pool.length));
    questions = targets.map(target => {
      const others = pool.filter(c => c.iso !== target.iso);
      const distractors = randomFrom(others, 3);
      const choices = shuffle([target, ...distractors]);
      return { target, choices };
    });
  }

  // --- Render ---
  function renderQuestion() {
    const q = questions[qIdx];
    flagEl.textContent = flagEmoji(q.target.iso);
    // re-trigger flag-in animation
    flagEl.style.animation = 'none';
    void flagEl.offsetWidth;
    flagEl.style.animation = '';

    revealEl.textContent = '';
    revealEl.classList.remove('show');

    choicesEl.innerHTML = '';
    q.choices.forEach(country => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.type = 'button';
      btn.textContent = country.name;
      btn.addEventListener('click', () => onChoice(btn, country));
      choicesEl.appendChild(btn);
    });

    qNumEl.textContent = String(qIdx + 1);
    scoreEl.textContent = String(score);
  }

  function onChoice(btn, country) {
    if (locked) return;
    SFX.unlock();
    locked = true;
    const q = questions[qIdx];
    const isCorrect = country.iso === q.target.iso;

    // Lock all buttons
    Array.from(choicesEl.children).forEach(b => b.classList.add('locked'));

    if (isCorrect) {
      btn.classList.add('correct');
      score++;
      scoreEl.textContent = String(score);
      SFX.correct();
      revealEl.textContent = q.target.name;
      revealEl.classList.add('show');
      setTimeout(advance, 900);
    } else {
      btn.classList.add('wrong');
      // Highlight the correct one
      Array.from(choicesEl.children).forEach(b => {
        if (b.textContent === q.target.name) b.classList.add('correct');
      });
      revealEl.textContent = q.target.name;
      revealEl.classList.add('show');
      SFX.wrong();
      setTimeout(advance, 1800);
    }
  }

  function advance() {
    qIdx++;
    locked = false;
    if (qIdx >= questions.length) {
      showEnd();
    } else {
      renderQuestion();
    }
  }

  function showEnd() {
    const prevBest = bestScores[difficulty] || 0;
    const newBest = Math.max(prevBest, score);
    bestScores[difficulty] = newBest;
    try { localStorage.setItem('geo-best', JSON.stringify(bestScores)); } catch (_) {}

    endTitle.textContent = score === ROUNDS
      ? '\u{1F3C6} 完美！全部答對！'
      : score >= ROUNDS * 0.8
        ? '\u{1F31F} 太厲害了！'
        : score >= ROUNDS * 0.5
          ? '\u{1F44D} 不錯的表現！'
          : '這局結束';
    endSub.textContent = '再來一局，看看能不能更進步';
    endScoreEl.textContent = String(score);
    endBestEl.textContent = String(newBest);
    SFX.end(score >= ROUNDS * 0.5);
    endModal.classList.add('show');
  }

  // --- Lifecycle ---
  function newGame() {
    score = 0;
    qIdx = 0;
    locked = false;
    endModal.classList.remove('show');
    buildQuestions();
    if (questions.length === 0) return;
    renderQuestion();
    diffLabel.textContent = DIFFICULTIES[difficulty].label;
  }

  // --- Difficulty picker ---
  function openDiffModal() {
    const opts = diffOptions.querySelectorAll('.target-option');
    opts.forEach(btn => {
      btn.classList.toggle('current', btn.dataset.diff === difficulty);
    });
    diffModal.classList.add('show');
  }
  function closeDiffModal() { diffModal.classList.remove('show'); }
  function applyDifficulty(d) {
    if (d === difficulty) { closeDiffModal(); return; }
    difficulty = d;
    try { localStorage.setItem('geo-difficulty', d); } catch (_) {}
    closeDiffModal();
    newGame();
  }

  // --- Wiring ---
  function setupEvents() {
    diffBtn.addEventListener('click', () => { SFX.unlock(); openDiffModal(); });
    diffCancel.addEventListener('click', closeDiffModal);
    diffModal.addEventListener('click', (e) => {
      if (e.target === diffModal) closeDiffModal();
    });
    diffOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.target-option');
      if (!btn) return;
      const d = btn.dataset.diff;
      if (DIFFICULTIES[d]) applyDifficulty(d);
    });

    endRestart.addEventListener('click', () => { SFX.unlock(); newGame(); });

    helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
    helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    // Unlock audio on first user interaction
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
