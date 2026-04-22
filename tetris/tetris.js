/* ============================================================
   俄羅斯方塊 — Web Tetris
   Canvas-based, touch-first, senior-friendly.
   ============================================================ */

(() => {
  'use strict';

  // ---------- Constants ----------
  const COLS = 10;
  const ROWS = 20;

  const COLORS = {
    I: '#5dc7d8',
    O: '#e3c64f',
    T: '#a87bc5',
    S: '#7bc77b',
    Z: '#d96a6a',
    J: '#5b80b6',
    L: '#d99a55',
  };

  // Tetromino rotations as (row, col) offsets — match the python version.
  const TETROMINOES = {
    I: [
      [[0,0],[0,1],[0,2],[0,3]],
      [[0,2],[1,2],[2,2],[3,2]],
      [[2,0],[2,1],[2,2],[2,3]],
      [[0,1],[1,1],[2,1],[3,1]],
    ],
    O: [
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
      [[0,0],[0,1],[1,0],[1,1]],
    ],
    T: [
      [[0,1],[1,0],[1,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,1]],
      [[1,0],[1,1],[1,2],[2,1]],
      [[0,1],[1,0],[1,1],[2,1]],
    ],
    S: [
      [[0,1],[0,2],[1,0],[1,1]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,1],[1,2],[2,0],[2,1]],
      [[0,0],[1,0],[1,1],[2,1]],
    ],
    Z: [
      [[0,0],[0,1],[1,1],[1,2]],
      [[0,2],[1,1],[1,2],[2,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[0,1],[1,0],[1,1],[2,0]],
    ],
    J: [
      [[0,0],[1,0],[1,1],[1,2]],
      [[0,1],[0,2],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,0],[2,1]],
    ],
    L: [
      [[0,2],[1,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
      [[1,0],[1,1],[1,2],[2,0]],
      [[0,0],[0,1],[1,1],[2,1]],
    ],
  };

  const TYPES = Object.keys(TETROMINOES);

  const FALL_SPEED_BASE = 700;     // ms per row at level 1 (slower for seniors)
  const FALL_SPEED_MIN = 120;
  const SOFT_DROP_INTERVAL = 60;
  const REPEAT_DELAY = 220;        // delay before button auto-repeat starts
  const REPEAT_INTERVAL = 90;      // interval between auto-repeats

  // ---------- DOM ----------
  const boardCanvas = document.getElementById('board');
  const boardCtx = boardCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');

  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySub = document.getElementById('overlay-sub');
  const overlayBtn = document.getElementById('overlay-btn');

  const helpBtn = document.getElementById('help-btn');
  const helpModal = document.getElementById('help-modal');
  const helpClose = document.getElementById('help-close');

  // ---------- State ----------
  let grid;          // 2D array of color strings or null
  let current;       // { type, rotation, row, col }
  let nextType;
  let bag = [];

  let score = 0;
  let level = 1;
  let linesCleared = 0;

  let fallSpeed = FALL_SPEED_BASE;
  let lastFallTime = 0;
  let isSoftDropping = false;

  let running = false;     // true when game loop is active and game is in play
  let paused = false;
  let gameOver = false;

  // ---------- Helpers ----------
  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function nextFromBag() {
    if (bag.length === 0) {
      bag = TYPES.slice();
      // Fisher-Yates shuffle
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }

  function makePiece(type) {
    return {
      type,
      rotation: 0,
      row: 0,
      col: Math.floor(COLS / 2) - 2,
    };
  }

  function pieceCells(piece, row, col, rotation) {
    const offsets = TETROMINOES[piece.type][rotation];
    return offsets.map(([dr, dc]) => [row + dr, col + dc]);
  }

  function isValid(cells) {
    for (const [r, c] of cells) {
      if (c < 0 || c >= COLS) return false;
      if (r >= ROWS) return false;
      if (r >= 0 && grid[r][c] !== null) return false;
    }
    return true;
  }

  // ---------- Game actions ----------
  function spawnPiece() {
    if (nextType === undefined) nextType = nextFromBag();
    current = makePiece(nextType);
    nextType = nextFromBag();

    if (!isValid(pieceCells(current, current.row, current.col, current.rotation))) {
      endGame();
      return;
    }
    drawNext();
  }

  function move(dr, dc) {
    if (!current) return false;
    const cells = pieceCells(current, current.row + dr, current.col + dc, current.rotation);
    if (isValid(cells)) {
      current.row += dr;
      current.col += dc;
      return true;
    }
    return false;
  }

  function rotate() {
    if (!current) return false;
    const newRot = (current.rotation + 1) % 4;
    const cells = pieceCells(current, current.row, current.col, newRot);
    if (isValid(cells)) {
      current.rotation = newRot;
      return true;
    }
    // Wall kicks
    for (const off of [1, -1, 2, -2]) {
      const c2 = pieceCells(current, current.row, current.col + off, newRot);
      if (isValid(c2)) {
        current.rotation = newRot;
        current.col += off;
        return true;
      }
    }
    return false;
  }

  function hardDrop() {
    if (!current) return;
    let dropped = 0;
    while (move(1, 0)) dropped++;
    score += dropped * 2;
    lockPiece();
  }

  function lockPiece() {
    if (!current) return;
    const color = COLORS[current.type];
    for (const [r, c] of pieceCells(current, current.row, current.col, current.rotation)) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        grid[r][c] = color;
      }
    }

    const cleared = clearLines();
    if (cleared > 0) {
      linesCleared += cleared;
      const lineScore = { 1: 100, 2: 300, 3: 500, 4: 800 }[cleared] || 0;
      score += lineScore * level;
      level = Math.floor(linesCleared / 10) + 1;
      fallSpeed = Math.max(FALL_SPEED_MIN, FALL_SPEED_BASE - (level - 1) * 60);
    }

    updateHud();
    spawnPiece();
  }

  function clearLines() {
    let count = 0;
    for (let r = ROWS - 1; r >= 0; ) {
      if (grid[r].every(cell => cell !== null)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(null));
        count++;
      } else {
        r--;
      }
    }
    return count;
  }

  function ghostRow() {
    if (!current) return 0;
    let r = current.row;
    while (isValid(pieceCells(current, r + 1, current.col, current.rotation))) {
      r++;
    }
    return r;
  }

  // ---------- Rendering ----------
  function fitCanvas(canvas, cellW, cols, rows) {
    // Match canvas pixel size to displayed size for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || cols * cellW;
    const cssH = canvas.clientHeight || rows * cellW;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cssW, cssH };
  }

  function drawCell(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Highlight (top-left)
    ctx.strokeStyle = lighten(color, 0.25);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + size - 3);
    ctx.lineTo(x + 2, y + 2);
    ctx.lineTo(x + size - 3, y + 2);
    ctx.stroke();

    // Shadow (bottom-right)
    ctx.strokeStyle = darken(color, 0.25);
    ctx.beginPath();
    ctx.moveTo(x + size - 3, y + 2);
    ctx.lineTo(x + size - 3, y + size - 3);
    ctx.lineTo(x + 2, y + size - 3);
    ctx.stroke();
  }

  function drawGhostCell(ctx, x, y, size, color) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.strokeStyle = hexToRgba(color, 0.6);
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }

  function drawBoard() {
    const { cssW, cssH } = fitCanvas(boardCanvas);
    const cellW = cssW / COLS;
    const cellH = cssH / ROWS;
    const size = Math.min(cellW, cellH);

    boardCtx.fillStyle = '#2b2520';
    boardCtx.fillRect(0, 0, cssW, cssH);

    // Grid lines
    boardCtx.strokeStyle = '#3a322c';
    boardCtx.lineWidth = 1;
    for (let r = 1; r < ROWS; r++) {
      const y = Math.round(r * cellH);
      boardCtx.beginPath();
      boardCtx.moveTo(0, y);
      boardCtx.lineTo(cssW, y);
      boardCtx.stroke();
    }
    for (let c = 1; c < COLS; c++) {
      const x = Math.round(c * cellW);
      boardCtx.beginPath();
      boardCtx.moveTo(x, 0);
      boardCtx.lineTo(x, cssH);
      boardCtx.stroke();
    }

    // Locked cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== null) {
          drawCell(boardCtx, c * cellW, r * cellH, Math.min(cellW, cellH), grid[r][c]);
        }
      }
    }

    // Ghost piece
    if (current && !gameOver) {
      const gr = ghostRow();
      if (gr !== current.row) {
        const cells = pieceCells(current, gr, current.col, current.rotation);
        for (const [r, c] of cells) {
          if (r >= 0) {
            drawGhostCell(boardCtx, c * cellW, r * cellH, Math.min(cellW, cellH), COLORS[current.type]);
          }
        }
      }
    }

    // Current piece
    if (current && !gameOver) {
      const cells = pieceCells(current, current.row, current.col, current.rotation);
      for (const [r, c] of cells) {
        if (r >= 0) {
          drawCell(boardCtx, c * cellW, r * cellH, Math.min(cellW, cellH), COLORS[current.type]);
        }
      }
    }
  }

  function drawNext() {
    fitCanvas(nextCanvas);
    const cssW = nextCanvas.clientWidth;
    const cssH = nextCanvas.clientHeight;
    nextCtx.clearRect(0, 0, cssW, cssH);

    if (!nextType) return;

    const offsets = TETROMINOES[nextType][0];
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of offsets) {
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    const w = maxC - minC + 1;
    const h = maxR - minR + 1;
    const size = Math.floor(Math.min(cssW / (w + 0.5), cssH / (h + 0.5)));
    const offsetX = (cssW - w * size) / 2;
    const offsetY = (cssH - h * size) / 2;

    for (const [r, c] of offsets) {
      drawCell(
        nextCtx,
        offsetX + (c - minC) * size,
        offsetY + (r - minR) * size,
        size,
        COLORS[nextType]
      );
    }
  }

  function lighten(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${clamp255(r + 255 * amt)},${clamp255(g + 255 * amt)},${clamp255(b + 255 * amt)})`;
  }
  function darken(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${clamp255(r - 255 * amt)},${clamp255(g - 255 * amt)},${clamp255(b - 255 * amt)})`;
  }
  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return {
      r: parseInt(m.substring(0, 2), 16),
      g: parseInt(m.substring(2, 4), 16),
      b: parseInt(m.substring(4, 6), 16),
    };
  }
  function hexToRgba(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  // ---------- HUD ----------
  function updateHud() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = linesCleared;
  }

  // ---------- Game loop ----------
  function tick(now) {
    if (running && !paused && !gameOver) {
      const interval = isSoftDropping ? SOFT_DROP_INTERVAL : fallSpeed;
      if (now - lastFallTime >= interval) {
        if (!move(1, 0)) {
          lockPiece();
        } else if (isSoftDropping) {
          score += 1;
          updateHud();
        }
        lastFallTime = now;
      }
    }
    drawBoard();
    requestAnimationFrame(tick);
  }

  // ---------- Lifecycle ----------
  function newGame() {
    grid = emptyGrid();
    bag = [];
    nextType = undefined;
    current = null;
    score = 0;
    level = 1;
    linesCleared = 0;
    fallSpeed = FALL_SPEED_BASE;
    lastFallTime = performance.now();
    paused = false;
    gameOver = false;
    running = true;

    spawnPiece();
    updateHud();
    hideOverlay();
  }

  function endGame() {
    gameOver = true;
    running = false;
    showOverlay('遊戲結束', `得分 ${score}`, '再來一局');
  }

  function togglePause() {
    if (gameOver || !current) return;
    paused = !paused;
    if (paused) {
      showOverlay('已暫停', '休息一下', '繼續');
    } else {
      lastFallTime = performance.now();
      hideOverlay();
    }
  }

  function showOverlay(title, sub, btn) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlayBtn.textContent = btn;
    overlay.classList.add('show');
  }
  function hideOverlay() {
    overlay.classList.remove('show');
  }

  // ---------- Input ----------
  // Auto-repeat for hold-to-move buttons.
  function bindRepeatable(btn, action) {
    let timeoutId = null;
    let intervalId = null;
    let active = false;

    const start = (e) => {
      e.preventDefault();
      if (active) return;
      active = true;
      action();
      timeoutId = setTimeout(() => {
        intervalId = setInterval(action, REPEAT_INTERVAL);
      }, REPEAT_DELAY);
    };
    const stop = () => {
      if (!active) return;
      active = false;
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    };

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('pointerleave', stop);
  }

  function bindTap(btn, action) {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      action();
    });
  }

  function setupControls() {
    bindRepeatable(document.getElementById('btn-left'), () => {
      if (running && !paused && !gameOver) move(0, -1);
    });
    bindRepeatable(document.getElementById('btn-right'), () => {
      if (running && !paused && !gameOver) move(0, 1);
    });

    // Down button: hold for soft drop
    const btnDown = document.getElementById('btn-down');
    btnDown.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (running && !paused && !gameOver) {
        isSoftDropping = true;
        // immediate step on press
        if (move(1, 0)) { score += 1; updateHud(); }
        lastFallTime = performance.now();
      }
    });
    const stopSoft = () => { isSoftDropping = false; };
    btnDown.addEventListener('pointerup', stopSoft);
    btnDown.addEventListener('pointercancel', stopSoft);
    btnDown.addEventListener('pointerleave', stopSoft);

    bindTap(document.getElementById('btn-rotate'), () => {
      if (running && !paused && !gameOver) rotate();
    });
    bindTap(document.getElementById('btn-drop'), () => {
      if (running && !paused && !gameOver) hardDrop();
    });

    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-new').addEventListener('click', newGame);
    overlayBtn.addEventListener('click', () => {
      if (gameOver || !running) {
        newGame();
      } else if (paused) {
        togglePause();
      }
    });

    helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
    helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && helpModal.classList.contains('show')) {
        helpModal.classList.remove('show');
        return;
      }
      if (!running && (e.key === 'Enter' || e.key === ' ')) {
        newGame();
        e.preventDefault();
        return;
      }
      if (gameOver || !current) return;
      if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
      if (paused) return;

      switch (e.key) {
        case 'ArrowLeft':  move(0, -1); e.preventDefault(); break;
        case 'ArrowRight': move(0, 1);  e.preventDefault(); break;
        case 'ArrowDown':
          if (move(1, 0)) { score += 1; updateHud(); lastFallTime = performance.now(); }
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'x': case 'X':
          rotate(); e.preventDefault(); break;
        case ' ':
          hardDrop(); e.preventDefault(); break;
      }
    });

    // Block the page from scrolling when the user drags on game UI.
    document.body.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  // ---------- Init ----------
  function init() {
    grid = emptyGrid();
    setupControls();
    updateHud();
    drawBoard();
    drawNext();
    showOverlay('俄羅斯方塊', '點擊下方按鈕開始遊戲', '開始');
    requestAnimationFrame(tick);

    // Re-fit canvases on resize/orientation
    window.addEventListener('resize', () => { drawBoard(); drawNext(); });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  init();
})();
