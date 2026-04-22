/* ============================================================
   2048 — slide & merge
   Senior-friendly: big d-pad, undo, editable target, swipe too.
   ============================================================ */

(() => {
  'use strict';

  const SIZE = 4;
  const STEP_PCT = 24.5;
  const OFFSET_PCT = 2;
  const MOVE_MS = 140;

  // ---------- DOM ----------
  const boardEl = document.getElementById('board');
  const boardWrapEl = document.querySelector('.board-wrap');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const targetEl = document.getElementById('target');

  const undoBtn = document.getElementById('btn-undo');
  const newBtn = document.getElementById('btn-new');
  const upBtn = document.getElementById('btn-up');
  const downBtn = document.getElementById('btn-down');
  const leftBtn = document.getElementById('btn-left');
  const rightBtn = document.getElementById('btn-right');

  const endModal = document.getElementById('end-modal');
  const endTitle = document.getElementById('end-title');
  const endSub = document.getElementById('end-sub');
  const endScore = document.getElementById('end-score');
  const endBestTile = document.getElementById('end-best-tile');
  const endContinue = document.getElementById('end-continue');
  const endRestart = document.getElementById('end-restart');

  const targetBtn = document.getElementById('target-btn');
  const targetModal = document.getElementById('target-modal');
  const targetOptions = document.getElementById('target-options');
  const targetCancel = document.getElementById('target-cancel');

  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  // ---------- State ----------
  let grid;                       // grid[r][c] = {uid, value} | null
  const tileEls = new Map();      // uid -> DOM element
  let score = 0;
  let best = 0;
  let nextUid = 1;
  let history = [];               // one-step undo snapshots
  let busy = false;
  let won = false;
  let keepPlaying = false;
  let gameOver = false;
  let targetValue = 2048;

  try {
    const savedBest = parseInt(localStorage.getItem('2048-best'), 10);
    if (!Number.isNaN(savedBest) && savedBest > 0) best = savedBest;
    const savedTarget = parseInt(localStorage.getItem('2048-target'), 10);
    if (!Number.isNaN(savedTarget) && savedTarget > 0) targetValue = savedTarget;
  } catch (_) {}

  // ---------- Utilities ----------
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function fitBoard() {
    const rect = boardWrapEl.getBoundingClientRect();
    const size = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
    boardEl.style.width = size + 'px';
    boardEl.style.height = size + 'px';
  }

  function positionEl(el, row, col) {
    el.style.left = (col * STEP_PCT + OFFSET_PCT) + '%';
    el.style.top  = (row * STEP_PCT + OFFSET_PCT) + '%';
  }

  function cloneGrid(g) {
    return g.map(row => row.map(c => c ? { uid: c.uid, value: c.value } : null));
  }

  // ---------- Board setup ----------
  function buildCellBackdrops() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        positionEl(cell, r, c);
        boardEl.appendChild(cell);
      }
    }
  }

  function createTileElement(uid, value, row, col, isNew) {
    const el = document.createElement('div');
    el.className = 'tile' + (isNew ? ' new' : '');
    el.dataset.value = String(value);
    el.dataset.uid = String(uid);
    el.textContent = String(value);
    positionEl(el, row, col);
    boardEl.appendChild(el);
    if (isNew) setTimeout(() => el.classList.remove('new'), 200);
    return el;
  }

  function spawnRandomTile() {
    const empties = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!grid[r][c]) empties.push({ r, c });
      }
    }
    if (empties.length === 0) return null;
    const pos = empties[Math.floor(Math.random() * empties.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const uid = nextUid++;
    grid[pos.r][pos.c] = { uid, value };
    const el = createTileElement(uid, value, pos.r, pos.c, true);
    tileEls.set(uid, el);
    return { pos, value };
  }

  // ---------- Move logic ----------
  function getLines(dir) {
    const lines = [];
    if (dir === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const line = [];
        for (let c = 0; c < SIZE; c++) line.push({ r, c });
        lines.push(line);
      }
    } else if (dir === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const line = [];
        for (let c = SIZE - 1; c >= 0; c--) line.push({ r, c });
        lines.push(line);
      }
    } else if (dir === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const line = [];
        for (let r = 0; r < SIZE; r++) line.push({ r, c });
        lines.push(line);
      }
    } else if (dir === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const line = [];
        for (let r = SIZE - 1; r >= 0; r--) line.push({ r, c });
        lines.push(line);
      }
    }
    return lines;
  }

  function computeSlide(dir) {
    // Returns { anyChanged, moves, newGrid, scoreGained }
    const moves = [];
    const newGrid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    let anyChanged = false;
    let scoreGained = 0;

    for (const line of getLines(dir)) {
      // Collect tiles along line in traversal order
      const items = [];
      for (const pos of line) {
        if (grid[pos.r][pos.c]) {
          items.push({ pos, uid: grid[pos.r][pos.c].uid, value: grid[pos.r][pos.c].value });
        }
      }

      let destIdx = 0;
      let prevPlaced = null;

      for (const t of items) {
        if (prevPlaced && prevPlaced.value === t.value && !prevPlaced.merged) {
          // Absorb into prevPlaced
          const mergePos = line[prevPlaced.destIdx];
          prevPlaced.value *= 2;
          prevPlaced.merged = true;
          newGrid[mergePos.r][mergePos.c] = { uid: prevPlaced.uid, value: prevPlaced.value };
          scoreGained += prevPlaced.value;
          moves.push({
            uid: t.uid,
            fromR: t.pos.r, fromC: t.pos.c,
            toR: mergePos.r, toC: mergePos.c,
            absorbed: true,
          });
          anyChanged = true;
        } else {
          const destPos = line[destIdx];
          newGrid[destPos.r][destPos.c] = { uid: t.uid, value: t.value };
          if (t.pos.r !== destPos.r || t.pos.c !== destPos.c) anyChanged = true;
          moves.push({
            uid: t.uid,
            fromR: t.pos.r, fromC: t.pos.c,
            toR: destPos.r, toC: destPos.c,
            absorbed: false,
          });
          prevPlaced = { uid: t.uid, value: t.value, destIdx, merged: false };
          destIdx++;
        }
      }
    }

    return { anyChanged, moves, newGrid, scoreGained };
  }

  async function doMove(dir) {
    if (busy || gameOver) return;
    const result = computeSlide(dir);
    if (!result.anyChanged) return;

    busy = true;

    // Snapshot for undo (before applying)
    history = [{ grid: cloneGrid(grid), score }];
    updateUndoBtn();

    // Commit grid
    grid = result.newGrid;
    score += result.scoreGained;

    // Animate moves
    for (const m of result.moves) {
      const el = tileEls.get(m.uid);
      if (!el) continue;
      positionEl(el, m.toR, m.toC);
    }

    await sleep(MOVE_MS);

    // Clean up absorbed tiles
    for (const m of result.moves) {
      if (m.absorbed) {
        const el = tileEls.get(m.uid);
        if (el) {
          el.remove();
          tileEls.delete(m.uid);
        }
      }
    }

    // Apply merged values to absorber tiles (bump animation)
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const g = grid[r][c];
        if (!g) continue;
        const el = tileEls.get(g.uid);
        if (el && Number(el.dataset.value) !== g.value) {
          el.dataset.value = String(g.value);
          el.textContent = String(g.value);
          el.classList.remove('merged');
          void el.offsetWidth; // force reflow
          el.classList.add('merged');
          setTimeout(((e) => () => e.classList.remove('merged'))(el), 220);
        }
      }
    }

    spawnRandomTile();
    updateHud();
    checkEnd();

    busy = false;
  }

  // ---------- Undo ----------
  function undo() {
    if (busy || history.length === 0) return;
    const h = history.pop();
    grid = h.grid;
    score = h.score;
    gameOver = false;
    renderAll();
    updateHud();
    updateUndoBtn();
  }

  function updateUndoBtn() {
    undoBtn.disabled = history.length === 0;
  }

  function renderAll() {
    // Remove all existing tile elements
    for (const el of tileEls.values()) el.remove();
    tileEls.clear();
    // Create fresh tiles from grid
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const g = grid[r][c];
        if (!g) continue;
        const el = createTileElement(g.uid, g.value, r, c, false);
        tileEls.set(g.uid, el);
      }
    }
  }

  // ---------- End conditions ----------
  function maxTile() {
    let m = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] && grid[r][c].value > m) m = grid[r][c].value;
      }
    }
    return m;
  }

  function canMove() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!grid[r][c]) return true;
      }
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c].value;
        if (r + 1 < SIZE && grid[r + 1][c] && grid[r + 1][c].value === v) return true;
        if (c + 1 < SIZE && grid[r][c + 1] && grid[r][c + 1].value === v) return true;
      }
    }
    return false;
  }

  function checkEnd() {
    const m = maxTile();
    if (score > best) {
      best = score;
      try { localStorage.setItem('2048-best', String(best)); } catch (_) {}
      updateHud();
    }

    if (!won && !keepPlaying && m >= targetValue) {
      won = true;
      showEnd(true, m);
      return;
    }
    if (!canMove()) {
      gameOver = true;
      showEnd(false, m);
    }
  }

  function showEnd(didWin, bestT) {
    endTitle.textContent = didWin ? '\u{1F389} 恭喜達標！' : '遊戲結束';
    endSub.textContent = didWin
      ? `您成功合成了 ${targetValue}！`
      : '沒有可以移動的步了，再試一次吧';
    endScore.textContent = score;
    endBestTile.textContent = bestT;
    endContinue.style.display = didWin ? '' : 'none';
    endModal.classList.add('show');
  }

  function hideEnd() {
    endModal.classList.remove('show');
  }

  // ---------- Target picker ----------
  function openTargetModal() {
    const opts = targetOptions.querySelectorAll('.target-option');
    opts.forEach(btn => {
      const v = parseInt(btn.dataset.target, 10);
      btn.classList.toggle('current', v === targetValue);
    });
    targetModal.classList.add('show');
  }
  function closeTargetModal() { targetModal.classList.remove('show'); }
  function applyTarget(v) {
    if (v === targetValue) { closeTargetModal(); return; }
    targetValue = v;
    try { localStorage.setItem('2048-target', String(v)); } catch (_) {}
    closeTargetModal();
    newGame();
  }

  // ---------- HUD ----------
  function updateHud() {
    scoreEl.textContent = score;
    bestEl.textContent = best;
    targetEl.textContent = targetValue;
  }

  // ---------- Lifecycle ----------
  function newGame() {
    hideEnd();
    for (const el of tileEls.values()) el.remove();
    tileEls.clear();
    // Also wipe any leftover cell backdrops (they persist across games)
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    score = 0;
    won = false;
    keepPlaying = false;
    gameOver = false;
    history = [];
    busy = false;
    updateUndoBtn();

    fitBoard();
    if (!boardEl.querySelector('.cell')) {
      buildCellBackdrops();
    }
    spawnRandomTile();
    spawnRandomTile();
    updateHud();
  }

  // ---------- Input ----------
  function setupSwipe() {
    let startX = 0, startY = 0, startT = 0, swiping = false;
    boardEl.addEventListener('pointerdown', (e) => {
      startX = e.clientX; startY = e.clientY;
      startT = Date.now(); swiping = true;
    });
    const end = (e) => {
      if (!swiping) return;
      swiping = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = Date.now() - startT;
      if (dt > 700) return;
      const threshold = 28;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
      else doMove(dy > 0 ? 'down' : 'up');
    };
    boardEl.addEventListener('pointerup', end);
    boardEl.addEventListener('pointercancel', () => { swiping = false; });
  }

  function setupEvents() {
    upBtn.addEventListener('click', () => doMove('up'));
    downBtn.addEventListener('click', () => doMove('down'));
    leftBtn.addEventListener('click', () => doMove('left'));
    rightBtn.addEventListener('click', () => doMove('right'));

    undoBtn.addEventListener('click', undo);
    newBtn.addEventListener('click', newGame);

    endRestart.addEventListener('click', newGame);
    endContinue.addEventListener('click', () => {
      keepPlaying = true;
      hideEnd();
    });

    targetBtn.addEventListener('click', openTargetModal);
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

    helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
    helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
      if (helpModal.classList.contains('show') || targetModal.classList.contains('show')) return;
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) { e.preventDefault(); doMove(map[e.key]); return; }
      if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); undo(); }
    });

    // Prevent page scroll from swipe gestures on the game
    document.body.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    setupSwipe();

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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
