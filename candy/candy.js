/* ============================================================
   糖果消消樂 — Candy Crush-style match-3
   Tap-to-select, tap adjacent to swap. Senior-friendly rules:
   failed swaps just move the selection, they don't burn a move.
   ============================================================ */

(() => {
  'use strict';

  // ---------- Config ----------
  const SIZE = 8;
  const TYPES = 6;
  const START_MOVES = 30;
  const DEFAULT_TARGET = 2000;
  const TARGET_PRESETS = [1000, 2000, 3500, 5000];

  let targetScore = DEFAULT_TARGET;
  try {
    const saved = parseInt(localStorage.getItem('candy-target'), 10);
    if (!Number.isNaN(saved) && saved > 0) targetScore = saved;
  } catch (_) {}

  const POINTS_PER_CANDY = 20;
  const CLEAR_ANIM_MS = 260;
  const FALL_ANIM_MS = 300;
  const SWAP_ANIM_MS = 280;

  // Candy shapes — match the screenshot's visual vocabulary.
  // Each entry is an inline SVG factory; gradient/path IDs are plain.
  const CANDY_SVGS = [
    // 0 — RED jellybean
    `<svg viewBox="0 0 100 100">
      <ellipse cx="50" cy="52" rx="44" ry="22" fill="#c92b2b"/>
      <ellipse cx="50" cy="50" rx="42" ry="20" fill="#e84545"/>
      <ellipse cx="50" cy="40" rx="28" ry="7" fill="#ff9090" opacity="0.55"/>
      <ellipse cx="36" cy="38" rx="9" ry="3" fill="#ffffff" opacity="0.8"/>
    </svg>`,

    // 1 — BLUE sphere
    `<svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="38" fill="#2d5f9a"/>
      <circle cx="50" cy="48" r="36" fill="#4a90e2"/>
      <ellipse cx="40" cy="40" rx="14" ry="10" fill="#a4c8f0" opacity="0.6"/>
      <circle cx="35" cy="36" r="5" fill="#ffffff" opacity="0.9"/>
    </svg>`,

    // 2 — GREEN rounded-square pillow
    `<svg viewBox="0 0 100 100">
      <rect x="12" y="14" width="76" height="74" rx="16" fill="#5a9129"/>
      <rect x="12" y="12" width="76" height="74" rx="16" fill="#7ac142"/>
      <rect x="20" y="22" width="42" height="12" rx="6" fill="#c8e89a" opacity="0.55"/>
      <rect x="24" y="24" width="12" height="4" rx="2" fill="#ffffff" opacity="0.8"/>
    </svg>`,

    // 3 — YELLOW teardrop
    `<svg viewBox="0 0 100 100">
      <path d="M50 8 C 80 38 82 78 50 92 C 18 78 20 38 50 8 Z" fill="#d4a020"/>
      <path d="M50 12 C 76 40 78 74 50 87 C 22 74 24 40 50 12 Z" fill="#f9c74f"/>
      <path d="M50 20 C 66 38 68 62 50 74 C 32 62 34 38 50 20 Z" fill="#fde38a" opacity="0.6"/>
      <ellipse cx="42" cy="32" rx="4" ry="9" fill="#ffffff" opacity="0.75" transform="rotate(-20 42 32)"/>
    </svg>`,

    // 4 — ORANGE oval
    `<svg viewBox="0 0 100 100">
      <ellipse cx="50" cy="52" rx="42" ry="30" fill="#c77708"/>
      <ellipse cx="50" cy="50" rx="40" ry="28" fill="#f39c12"/>
      <ellipse cx="46" cy="38" rx="20" ry="7" fill="#fcc76a" opacity="0.65"/>
      <ellipse cx="40" cy="36" rx="7" ry="2.5" fill="#ffffff" opacity="0.85"/>
    </svg>`,

    // 5 — PURPLE hexagon with sparkle dots
    `<svg viewBox="0 0 100 100">
      <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" fill="#6d3c82"/>
      <polygon points="50,12 82,30 82,70 50,88 18,70 18,30" fill="#9b59b6"/>
      <polygon points="50,22 72,34 72,64 50,76 28,64 28,34" fill="#c38bd9" opacity="0.45"/>
      <circle cx="38" cy="38" r="3.5" fill="#ffffff" opacity="0.85"/>
      <circle cx="64" cy="52" r="2.5" fill="#ffffff" opacity="0.65"/>
      <circle cx="46" cy="62" r="2" fill="#ffffff" opacity="0.5"/>
    </svg>`,
  ];

  // ---------- DOM ----------
  const boardEl = document.getElementById('board');
  const boardWrapEl = document.querySelector('.board-wrap');
  const muteBtn = document.getElementById('mute-btn');
  const targetBtn = document.getElementById('target-btn');
  const targetModal = document.getElementById('target-modal');
  const targetOptions = document.getElementById('target-options');
  const targetCancel = document.getElementById('target-cancel');

  // ---------- Sound effects ----------
  // Web Audio synthesis — zero asset bytes, works offline, no autoplay issues.
  // iPad gotchas: AudioContext must be created / resumed inside a user gesture
  // (handled by unlockAudio on first tap). iPad respects the silent switch for
  // Web Audio, which is the expected behavior — users who want silence flip it.
  const SFX = (() => {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem('candy-muted') === '1'; } catch (_) {}

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

    function tone(opts) {
      if (muted) return;
      const c = ensureCtx();
      if (!c) return;
      const {
        freq, type = 'sine', dur = 0.1, vol = 0.18,
        delay = 0, attack = 0.005, freqEnd,
      } = opts;
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
      }
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    return {
      unlock,
      isMuted: () => muted,
      setMuted(v) {
        muted = v;
        try { localStorage.setItem('candy-muted', v ? '1' : '0'); } catch (_) {}
      },
      select()  { tone({ freq: 880, dur: 0.07, vol: 0.12 }); },
      swap()    {
        tone({ freq: 520, dur: 0.09, vol: 0.14 });
        tone({ freq: 780, dur: 0.11, vol: 0.14, delay: 0.07 });
      },
      revert()  { tone({ freq: 240, dur: 0.18, vol: 0.14, freqEnd: 140 }); },
      clear(cascade = 1) {
        const base = 420 + (Math.min(cascade, 5) - 1) * 90;
        tone({ freq: base,       type: 'triangle', dur: 0.10, vol: 0.15, freqEnd: base * 1.6 });
        tone({ freq: base * 2,   type: 'sine',     dur: 0.14, vol: 0.09, delay: 0.03 });
      },
      cascadeChime(n) {
        const notes = [523.25, 659.26, 783.99, 1046.5]; // C5 E5 G5 C6
        const idx = Math.min(notes.length - 1, n - 2);
        tone({ freq: notes[Math.max(0, idx)], dur: 0.22, vol: 0.18 });
      },
      win() {
        const notes = [523.25, 659.26, 783.99, 1046.5];
        notes.forEach((f, i) => tone({ freq: f, dur: 0.22, vol: 0.2, delay: i * 0.11 }));
      },
      lose() {
        const notes = [392, 329.63, 261.63]; // G4 E4 C4
        notes.forEach((f, i) => tone({ freq: f, dur: 0.28, vol: 0.16, delay: i * 0.16 }));
      },
      newGame() {
        tone({ freq: 587.33, dur: 0.10, vol: 0.14 });
        tone({ freq: 880,    dur: 0.14, vol: 0.14, delay: 0.08 });
      },
    };
  })();
  const scoreEl = document.getElementById('score');
  const movesEl = document.getElementById('moves');
  const targetEl = document.getElementById('target');

  const endModal = document.getElementById('end-modal');
  const endTitle = document.getElementById('end-title');
  const endSub = document.getElementById('end-sub');
  const endScore = document.getElementById('end-score');
  const endMoves = document.getElementById('end-moves');
  const endBtn = document.getElementById('end-btn');

  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  // ---------- State ----------
  // grid[r][c] = { type: 0..5, uid: number, el: HTMLElement } | null (transient)
  let grid = [];
  let nextUid = 1;
  let selected = null; // { row, col }
  let score = 0;
  let moves = START_MOVES;
  let busy = false;
  let gameOver = false;

  // ---------- Utilities ----------
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function fitBoard() {
    const rect = boardWrapEl.getBoundingClientRect();
    const size = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
    boardEl.style.width = size + 'px';
    boardEl.style.height = size + 'px';
  }

  function positionCandy(cell, row, col) {
    cell.style.left = (col * 12.5) + '%';
    cell.style.top = (row * 12.5) + '%';
  }

  function makeCandy(type, row, col) {
    const el = document.createElement('div');
    el.className = 'candy';
    el.dataset.uid = String(nextUid);
    el.dataset.type = String(type);
    el.innerHTML = CANDY_SVGS[type];
    positionCandy(el, row, col);
    // No per-candy click handler — the board uses delegated pointerdown,
    // so row/col are computed from the tap position and always match
    // whichever candy currently occupies that cell.
    boardEl.appendChild(el);
    return { type, uid: nextUid++, el };
  }

  function candyAt(r, c) {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
    return grid[r][c];
  }

  function isAdjacent(a, b) {
    return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
  }

  // ---------- Board setup ----------
  function buildCellBackdrops() {
    // Decorative cell backgrounds (one per grid cell; fixed, never moved)
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.left = (c * 12.5) + '%';
        cell.style.top = (r * 12.5) + '%';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        boardEl.appendChild(cell);
      }
    }
  }

  function randomTypeAvoiding(row, col) {
    // Pick a type that does not create a pre-existing run of 3.
    const tries = [];
    outer: for (let attempt = 0; attempt < 20; attempt++) {
      const t = Math.floor(Math.random() * TYPES);
      // Check horizontally and vertically for a run of 2 behind
      if (col >= 2 && grid[row][col-1]?.type === t && grid[row][col-2]?.type === t) continue outer;
      if (row >= 2 && grid[row-1][col]?.type === t && grid[row-2][col]?.type === t) continue outer;
      return t;
    }
    // Fallback: any type
    return Math.floor(Math.random() * TYPES);
  }

  function initBoard() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = randomTypeAvoiding(r, c);
        grid[r][c] = makeCandy(t, r, c);
      }
    }
  }

  // ---------- Matching ----------
  function findMatches() {
    const marks = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    // Horizontal runs
    for (let r = 0; r < SIZE; r++) {
      let runStart = 0;
      for (let c = 1; c <= SIZE; c++) {
        const prevType = grid[r][c-1]?.type;
        const curType = c < SIZE ? grid[r][c]?.type : null;
        if (curType !== prevType) {
          const runLen = c - runStart;
          if (runLen >= 3 && prevType !== null && prevType !== undefined) {
            for (let k = runStart; k < c; k++) marks[r][k] = true;
          }
          runStart = c;
        }
      }
    }

    // Vertical runs
    for (let c = 0; c < SIZE; c++) {
      let runStart = 0;
      for (let r = 1; r <= SIZE; r++) {
        const prevType = grid[r-1][c]?.type;
        const curType = r < SIZE ? grid[r][c]?.type : null;
        if (curType !== prevType) {
          const runLen = r - runStart;
          if (runLen >= 3 && prevType !== null && prevType !== undefined) {
            for (let k = runStart; k < r; k++) marks[k][c] = true;
          }
          runStart = r;
        }
      }
    }

    return marks;
  }

  function hasAnyMatch() {
    const m = findMatches();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (m[r][c]) return true;
      }
    }
    return false;
  }

  // ---------- Tap / swap ----------
  function onCandyTap(row, col) {
    if (busy || gameOver) return;

    const here = { row, col };
    if (!selected) {
      setSelected(here);
      return;
    }

    if (selected.row === row && selected.col === col) {
      clearSelection();
      return;
    }

    if (isAdjacent(selected, here)) {
      const a = selected;
      clearSelection();
      attemptSwap(a, here);
    } else {
      // Not adjacent — just move the selection (senior-friendly: no penalty)
      setSelected(here);
    }
  }

  function setSelected(pos) {
    clearSelection();
    selected = pos;
    const c = grid[pos.row][pos.col];
    if (c) c.el.classList.add('selected');
    SFX.select();
  }

  function clearSelection() {
    if (!selected) return;
    const c = grid[selected.row][selected.col];
    if (c) c.el.classList.remove('selected');
    selected = null;
  }

  async function attemptSwap(a, b) {
    busy = true;
    SFX.swap();

    // Swap in data and animate position change
    const ca = grid[a.row][a.col];
    const cb = grid[b.row][b.col];
    grid[a.row][a.col] = cb;
    grid[b.row][b.col] = ca;
    positionCandy(ca.el, b.row, b.col);
    positionCandy(cb.el, a.row, a.col);
    await sleep(SWAP_ANIM_MS);

    if (hasAnyMatch()) {
      moves--;
      updateHud();
      await resolveCascades();
      checkEndConditions();
    } else {
      // Swap back
      SFX.revert();
      grid[a.row][a.col] = ca;
      grid[b.row][b.col] = cb;
      positionCandy(ca.el, a.row, a.col);
      positionCandy(cb.el, b.row, b.col);
      await sleep(SWAP_ANIM_MS);
    }

    busy = false;
  }

  // ---------- Cascades ----------
  async function resolveCascades() {
    let cascade = 0;
    while (true) {
      const marks = findMatches();
      let count = 0;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) if (marks[r][c]) count++;
      }
      if (count === 0) break;
      cascade++;
      SFX.clear(cascade);
      if (cascade >= 2) SFX.cascadeChime(cascade);

      // Clear marked candies
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (marks[r][c]) {
            const candy = grid[r][c];
            if (candy) {
              candy.el.classList.add('clearing');
              grid[r][c] = null;
              setTimeout(((el) => () => el.remove())(candy.el), CLEAR_ANIM_MS + 40);
            }
          }
        }
      }

      score += count * POINTS_PER_CANDY * cascade;
      updateHud();

      await sleep(CLEAR_ANIM_MS);

      // Apply gravity + refill
      applyGravity();
      refillTop();

      await sleep(FALL_ANIM_MS + 40);
    }
  }

  function applyGravity() {
    for (let c = 0; c < SIZE; c++) {
      let writeRow = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          if (r !== writeRow) {
            const candy = grid[r][c];
            grid[writeRow][c] = candy;
            grid[r][c] = null;
            positionCandy(candy.el, writeRow, c);
          }
          writeRow--;
        }
      }
    }
  }

  function refillTop() {
    for (let c = 0; c < SIZE; c++) {
      for (let r = 0; r < SIZE; r++) {
        if (grid[r][c] === null) {
          const type = Math.floor(Math.random() * TYPES);
          const el = document.createElement('div');
          el.className = 'candy new';
          el.dataset.uid = String(nextUid);
          el.dataset.type = String(type);
          el.innerHTML = CANDY_SVGS[type];
          // Start above the board, then animate to final position
          el.style.left = (c * 12.5) + '%';
          el.style.top = ((r - SIZE) * 12.5) + '%';
          boardEl.appendChild(el);
          grid[r][c] = { type, uid: nextUid++, el };

          // Trigger transition to final position on next frame
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.remove('new');
              el.style.top = (r * 12.5) + '%';
            });
          });
        }
      }
    }
  }

  // ---------- Hint ----------
  function findHint() {
    // Try every possible adjacent swap; return the first that creates a match.
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const neighbors = [[0, 1], [1, 0]];
        for (const [dr, dc] of neighbors) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= SIZE || nc >= SIZE) continue;
          // Tentative swap
          const a = grid[r][c];
          const b = grid[nr][nc];
          grid[r][c] = b;
          grid[nr][nc] = a;
          const match = hasAnyMatch();
          // Revert
          grid[r][c] = a;
          grid[nr][nc] = b;
          if (match) return [{ row: r, col: c }, { row: nr, col: nc }];
        }
      }
    }
    return null;
  }

  function flashHint() {
    const hint = findHint();
    if (!hint) return;
    const cells = boardEl.querySelectorAll('.cell');
    for (const pos of hint) {
      const cell = Array.from(cells).find(
        el => Number(el.dataset.row) === pos.row && Number(el.dataset.col) === pos.col
      );
      if (cell) {
        cell.classList.add('hint');
        setTimeout(() => cell.classList.remove('hint'), 2800);
      }
    }
  }

  // ---------- HUD / end ----------
  function updateHud() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    targetEl.textContent = targetScore;
  }

  function checkEndConditions() {
    if (gameOver) return;
    if (score >= targetScore) {
      gameOver = true;
      showEnd(true);
    } else if (moves <= 0) {
      gameOver = true;
      showEnd(false);
    }
  }

  function openTargetModal() {
    // Mark the currently-selected preset for visual feedback
    const opts = targetOptions.querySelectorAll('.target-option');
    opts.forEach(btn => {
      const v = parseInt(btn.dataset.target, 10);
      btn.classList.toggle('current', v === targetScore);
    });
    targetModal.classList.add('show');
  }
  function closeTargetModal() {
    targetModal.classList.remove('show');
  }
  function applyTarget(newTarget) {
    if (newTarget === targetScore) {
      closeTargetModal();
      return;
    }
    targetScore = newTarget;
    try { localStorage.setItem('candy-target', String(newTarget)); } catch (_) {}
    closeTargetModal();
    newGame();
  }

  function showEnd(won) {
    endTitle.textContent = won ? '\u{1F389} 恭喜通關！' : '遊戲結束';
    endSub.textContent = won ? '您成功達到目標分數' : `差一點就達標了，再試一次吧`;
    endScore.textContent = score;
    endMoves.textContent = Math.max(0, moves);
    endModal.classList.add('show');
    if (won) SFX.win(); else SFX.lose();
  }

  // ---------- Lifecycle ----------
  function newGame() {
    // Clear DOM
    while (boardEl.firstChild) boardEl.removeChild(boardEl.firstChild);
    grid = [];
    selected = null;
    score = 0;
    moves = START_MOVES;
    gameOver = false;
    busy = false;
    endModal.classList.remove('show');

    fitBoard();
    buildCellBackdrops();
    initBoard();
    updateHud();
    SFX.newGame();
  }

  // ---------- Wiring ----------
  function refreshMuteBtn() {
    muteBtn.classList.toggle('muted', SFX.isMuted());
  }

  // Pointer gesture state — a touch can resolve as either a tap or a swipe,
  // decided on pointerup based on how far the finger moved.
  let pointerStart = null;

  function onBoardPointerDown(e) {
    SFX.unlock();
    if (busy || gameOver) return;
    const rect = boardEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor((x / rect.width) * SIZE);
    const row = Math.floor((y / rect.height) * SIZE);
    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
    if (!grid[row] || !grid[row][col]) return;
    e.preventDefault();
    pointerStart = {
      pointerId: e.pointerId,
      clientX: e.clientX, clientY: e.clientY,
      row, col,
      cellSize: rect.width / SIZE,
    };
    try { boardEl.setPointerCapture(e.pointerId); } catch (_) {}
  }

  function onBoardPointerUp(e) {
    if (!pointerStart || pointerStart.pointerId !== e.pointerId) return;
    const start = pointerStart;
    pointerStart = null;
    try { boardEl.releasePointerCapture(e.pointerId); } catch (_) {}

    if (busy || gameOver) return;

    const dx = e.clientX - start.clientX;
    const dy = e.clientY - start.clientY;
    const threshold = Math.max(14, start.cellSize * 0.3);
    const moved = Math.max(Math.abs(dx), Math.abs(dy)) >= threshold;

    if (!moved) {
      // Short tap — use the existing tap-to-select / tap-adjacent-to-swap flow
      onCandyTap(start.row, start.col);
      return;
    }

    // Swipe — swap with the neighbor in the dominant direction
    let dr = 0, dc = 0;
    if (Math.abs(dx) > Math.abs(dy)) dc = dx > 0 ? 1 : -1;
    else                              dr = dy > 0 ? 1 : -1;
    const toR = start.row + dr;
    const toC = start.col + dc;
    if (toR < 0 || toR >= SIZE || toC < 0 || toC >= SIZE) return;
    if (!grid[toR] || !grid[toR][toC]) return;

    clearSelection();
    attemptSwap({ row: start.row, col: start.col }, { row: toR, col: toC });
  }

  function onBoardPointerCancel(e) {
    if (pointerStart && pointerStart.pointerId === e.pointerId) {
      pointerStart = null;
    }
  }

  function setupEvents() {
    boardEl.addEventListener('pointerdown', onBoardPointerDown);
    boardEl.addEventListener('pointerup', onBoardPointerUp);
    boardEl.addEventListener('pointercancel', onBoardPointerCancel);
    document.getElementById('btn-new').addEventListener('click', () => {
      SFX.unlock();
      newGame();
    });
    document.getElementById('btn-hint').addEventListener('click', () => {
      SFX.unlock();
      if (!busy && !gameOver) flashHint();
    });
    endBtn.addEventListener('click', () => { SFX.unlock(); newGame(); });

    muteBtn.addEventListener('click', () => {
      SFX.unlock();
      SFX.setMuted(!SFX.isMuted());
      refreshMuteBtn();
      if (!SFX.isMuted()) SFX.select(); // confirmation blip when unmuting
    });
    refreshMuteBtn();

    // Target picker
    targetBtn.addEventListener('click', () => { SFX.unlock(); openTargetModal(); });
    targetCancel.addEventListener('click', closeTargetModal);
    targetModal.addEventListener('click', (e) => {
      if (e.target === targetModal) closeTargetModal();
    });
    targetOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.target-option');
      if (!btn) return;
      const v = parseInt(btn.dataset.target, 10);
      if (!Number.isNaN(v)) applyTarget(v);
    });

    // Unlock audio on the very first pointer/touch anywhere (iOS requirement).
    const firstTouch = () => {
      SFX.unlock();
      document.removeEventListener('pointerdown', firstTouch, true);
      document.removeEventListener('touchstart', firstTouch, true);
    };
    document.addEventListener('pointerdown', firstTouch, true);
    document.addEventListener('touchstart', firstTouch, true);

    helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
    helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    // Prevent page-level scroll gestures on the game
    document.body.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    // Keep the board square and fitted to available space.
    // ResizeObserver fires for any layout change that affects board-wrap,
    // not just window resizes.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fitBoard).observe(boardWrapEl);
    } else {
      window.addEventListener('resize', fitBoard);
      window.addEventListener('orientationchange', fitBoard);
    }
  }

  // ---------- Init ----------
  function init() {
    setupEvents();
    newGame();

    // SW is registered by the inline update script in index.html
  }

  init();
})();
