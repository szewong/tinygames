// ============================================================
// Sudoku Game Engine + UI Controller
// ============================================================

(function () {
  'use strict';

  // --- Puzzle Generator & Solver ---

  function createEmptyGrid() {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
  }

  function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    const r0 = Math.floor(row / 3) * 3;
    const c0 = Math.floor(col / 3) * 3;
    for (let r = r0; r < r0 + 3; r++) {
      for (let c = c0; c < c0 + 3; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function solve(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const n of nums) {
            if (isValid(grid, r, c, n)) {
              grid[r][c] = n;
              if (solve(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function countSolutions(grid, limit) {
    let count = 0;
    function inner() {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            for (let n = 1; n <= 9; n++) {
              if (isValid(grid, r, c, n)) {
                grid[r][c] = n;
                inner();
                if (count >= limit) { grid[r][c] = 0; return; }
                grid[r][c] = 0;
              }
            }
            return;
          }
        }
      }
      count++;
    }
    inner();
    return count;
  }

  function generatePuzzle(difficulty) {
    const solution = createEmptyGrid();
    solve(solution);

    const puzzle = solution.map(r => [...r]);
    const cellsToRemove = { easy: 36, medium: 46, hard: 54 }[difficulty] || 46;

    const positions = shuffle(
      Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
    );

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= cellsToRemove) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;
      const test = puzzle.map(row => [...row]);
      if (countSolutions(test, 2) === 1) {
        removed++;
      } else {
        puzzle[r][c] = backup;
      }
    }

    return { puzzle, solution };
  }

  // --- Game State ---

  let state = {
    puzzle: null,       // original puzzle (0 = blank)
    solution: null,
    board: null,        // current player board
    notes: null,        // 9x9 array of Set<number>
    selected: null,     // { row, col }
    notesMode: false,
    difficulty: 'easy',
    history: [],        // for undo
    timer: 0,
    timerInterval: null,
    paused: false,
    errors: 0,
    complete: false
  };

  // --- DOM refs ---

  const $ = id => document.getElementById(id);
  const grid = $('grid');
  const numpad = $('numpad');
  const timerEl = $('timer');
  const errorsEl = $('errors');
  const notesBtn = $('notes-btn');
  const undoBtn = $('undo-btn');
  const eraseBtn = $('erase-btn');
  const hintBtn = $('hint-btn');
  const newGameBtn = $('new-game-btn');
  const diffBtns = document.querySelectorAll('.diff-btn');
  const modal = $('win-modal');
  const modalTime = $('modal-time');
  const modalErrors = $('modal-errors');
  const modalNewGame = $('modal-new-game');
  const helpModal = $('help-modal');
  const helpBtn = $('help-btn');
  const helpClose = $('help-close');

  // --- Rendering ---

  function buildGrid() {
    grid.innerHTML = '';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // thick borders for 3x3 boxes
        if (c % 3 === 0 && c !== 0) cell.classList.add('box-left');
        if (r % 3 === 0 && r !== 0) cell.classList.add('box-top');

        cell.addEventListener('click', () => selectCell(r, c));
        grid.appendChild(cell);
      }
    }
  }

  function renderBoard() {
    const cells = grid.querySelectorAll('.cell');
    const selRow = state.selected?.row;
    const selCol = state.selected?.col;
    const selNum = (selRow != null) ? state.board[selRow][selCol] : 0;

    cells.forEach(cell => {
      const r = +cell.dataset.row;
      const c = +cell.dataset.col;
      const val = state.board[r][c];
      const isGiven = state.puzzle[r][c] !== 0;
      const isSelected = r === selRow && c === selCol;
      const isSameNum = selNum && val === selNum;
      const isSameRowCol = r === selRow || c === selCol;
      const isSameBox = selRow != null &&
        Math.floor(r / 3) === Math.floor(selRow / 3) &&
        Math.floor(c / 3) === Math.floor(selCol / 3);
      const isError = !isGiven && val !== 0 && val !== state.solution[r][c];

      cell.className = 'cell';
      if (c % 3 === 0 && c !== 0) cell.classList.add('box-left');
      if (r % 3 === 0 && r !== 0) cell.classList.add('box-top');
      if (isGiven) cell.classList.add('given');
      if (isSelected) cell.classList.add('selected');
      else if (isSameNum) cell.classList.add('same-num');
      else if (isSameRowCol || isSameBox) cell.classList.add('highlight');
      if (isError) cell.classList.add('error');

      if (val !== 0) {
        cell.textContent = val;
        cell.classList.remove('has-notes');
      } else {
        cell.textContent = '';
        const noteSet = state.notes[r][c];
        if (noteSet.size > 0) {
          cell.classList.add('has-notes');
          cell.innerHTML = '';
          const noteGrid = document.createElement('div');
          noteGrid.className = 'note-grid';
          for (let n = 1; n <= 9; n++) {
            const span = document.createElement('span');
            span.textContent = noteSet.has(n) ? n : '';
            noteGrid.appendChild(span);
          }
          cell.appendChild(noteGrid);
        }
      }
    });

    // highlight active numpad
    numpad.querySelectorAll('.num-btn').forEach(btn => {
      const n = +btn.dataset.num;
      btn.classList.toggle('active-num', n === selNum && selNum !== 0);
      // count remaining
      if (n >= 1 && n <= 9) {
        let placed = 0;
        for (let r = 0; r < 9; r++)
          for (let c = 0; c < 9; c++)
            if (state.board[r][c] === n) placed++;
        btn.classList.toggle('num-done', placed >= 9);
      }
    });

    notesBtn.classList.toggle('active', state.notesMode);
    errorsEl.textContent = state.errors;
  }

  // --- Actions ---

  function selectCell(r, c) {
    if (state.complete) return;
    state.selected = { row: r, col: c };
    renderBoard();
  }

  function placeNumber(num) {
    if (!state.selected || state.complete) return;
    const { row, col } = state.selected;
    if (state.puzzle[row][col] !== 0) return; // given cell

    if (state.notesMode) {
      state.history.push({
        row, col,
        value: state.board[row][col],
        notes: new Set(state.notes[row][col])
      });
      if (state.notes[row][col].has(num)) {
        state.notes[row][col].delete(num);
      } else {
        state.notes[row][col].add(num);
      }
      state.board[row][col] = 0; // clear value if toggling notes
    } else {
      state.history.push({
        row, col,
        value: state.board[row][col],
        notes: new Set(state.notes[row][col])
      });
      state.board[row][col] = num;
      state.notes[row][col].clear();

      // auto-clear notes in same row/col/box
      for (let i = 0; i < 9; i++) {
        state.notes[row][i].delete(num);
        state.notes[i][col].delete(num);
      }
      const r0 = Math.floor(row / 3) * 3;
      const c0 = Math.floor(col / 3) * 3;
      for (let r = r0; r < r0 + 3; r++)
        for (let c = c0; c < c0 + 3; c++)
          state.notes[r][c].delete(num);

      if (num !== state.solution[row][col]) {
        state.errors++;
      }

      checkWin();
    }
    renderBoard();
  }

  function eraseCell() {
    if (!state.selected || state.complete) return;
    const { row, col } = state.selected;
    if (state.puzzle[row][col] !== 0) return;
    state.history.push({
      row, col,
      value: state.board[row][col],
      notes: new Set(state.notes[row][col])
    });
    state.board[row][col] = 0;
    state.notes[row][col].clear();
    renderBoard();
  }

  function undo() {
    if (state.history.length === 0 || state.complete) return;
    const last = state.history.pop();
    state.board[last.row][last.col] = last.value;
    state.notes[last.row][last.col] = last.notes;
    state.selected = { row: last.row, col: last.col };
    renderBoard();
  }

  function giveHint() {
    if (state.complete) return;
    // find an empty cell and fill it
    const empties = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (state.board[r][c] === 0)
          empties.push([r, c]);
    if (empties.length === 0) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    state.history.push({ row: r, col: c, value: 0, notes: new Set(state.notes[r][c]) });
    state.board[r][c] = state.solution[r][c];
    state.notes[r][c].clear();
    state.selected = { row: r, col: c };
    checkWin();
    renderBoard();
  }

  function checkWin() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (state.board[r][c] !== state.solution[r][c]) return;

    state.complete = true;
    clearInterval(state.timerInterval);
    setTimeout(showWinModal, 400);
  }

  // --- Timer ---

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function startTimer() {
    clearInterval(state.timerInterval);
    state.timer = 0;
    state.paused = false;
    timerEl.textContent = '00:00';
    state.timerInterval = setInterval(() => {
      if (!state.paused) {
        state.timer++;
        timerEl.textContent = formatTime(state.timer);
      }
    }, 1000);
  }

  // --- Win Modal ---

  function showWinModal() {
    modalTime.textContent = formatTime(state.timer);
    modalErrors.textContent = state.errors;
    modal.classList.add('show');
    // confetti
    createConfetti();
  }

  function hideWinModal() {
    modal.classList.remove('show');
  }

  function createConfetti() {
    const container = $('confetti');
    container.innerHTML = '';
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 2 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      container.appendChild(piece);
    }
    setTimeout(() => container.innerHTML = '', 5000);
  }

  // --- New Game ---

  function newGame(difficulty) {
    state.difficulty = difficulty || state.difficulty;
    state.complete = false;
    state.errors = 0;
    state.history = [];
    state.notesMode = false;
    state.selected = null;

    // show loading state
    grid.classList.add('loading');

    // generate puzzle async to avoid UI block
    setTimeout(() => {
      const { puzzle, solution } = generatePuzzle(state.difficulty);
      state.puzzle = puzzle;
      state.solution = solution;
      state.board = puzzle.map(r => [...r]);
      state.notes = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set())
      );
      grid.classList.remove('loading');
      renderBoard();
      startTimer();
      hideWinModal();
      saveGame();
    }, 50);

    // update difficulty buttons
    diffBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === state.difficulty);
    });
  }

  // --- Persistence ---

  function saveGame() {
    try {
      const data = {
        puzzle: state.puzzle,
        solution: state.solution,
        board: state.board,
        notes: state.notes.map(row => row.map(s => [...s])),
        difficulty: state.difficulty,
        timer: state.timer,
        errors: state.errors
      };
      localStorage.setItem('sudoku-save', JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem('sudoku-save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      state.puzzle = data.puzzle;
      state.solution = data.solution;
      state.board = data.board;
      state.notes = data.notes.map(row => row.map(arr => new Set(arr)));
      state.difficulty = data.difficulty;
      state.timer = data.timer;
      state.errors = data.errors;
      state.history = [];
      state.notesMode = false;
      state.selected = null;
      state.complete = false;

      // check if already complete
      let allDone = true;
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (state.board[r][c] !== state.solution[r][c]) allDone = false;
      if (allDone) return false; // start fresh

      diffBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.diff === state.difficulty));
      renderBoard();
      // resume timer
      timerEl.textContent = formatTime(state.timer);
      state.timerInterval = setInterval(() => {
        if (!state.paused) {
          state.timer++;
          timerEl.textContent = formatTime(state.timer);
        }
      }, 1000);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Auto-save periodically
  setInterval(saveGame, 10000);

  // --- Keyboard support ---

  document.addEventListener('keydown', e => {
    if (state.complete) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      placeNumber(num);
      return;
    }
    switch (e.key) {
      case 'Backspace':
      case 'Delete':
        eraseCell(); break;
      case 'z':
        if (e.metaKey || e.ctrlKey) undo(); break;
      case 'n':
        state.notesMode = !state.notesMode; renderBoard(); break;
      case 'ArrowUp':
        if (state.selected && state.selected.row > 0)
          selectCell(state.selected.row - 1, state.selected.col);
        break;
      case 'ArrowDown':
        if (state.selected && state.selected.row < 8)
          selectCell(state.selected.row + 1, state.selected.col);
        break;
      case 'ArrowLeft':
        if (state.selected && state.selected.col > 0)
          selectCell(state.selected.row, state.selected.col - 1);
        break;
      case 'ArrowRight':
        if (state.selected && state.selected.col < 8)
          selectCell(state.selected.row, state.selected.col + 1);
        break;
    }
  });

  // --- Event Bindings ---

  numpad.addEventListener('click', e => {
    const btn = e.target.closest('.num-btn');
    if (!btn) return;
    const n = +btn.dataset.num;
    if (n >= 1 && n <= 9) placeNumber(n);
  });

  eraseBtn.addEventListener('click', eraseCell);
  undoBtn.addEventListener('click', undo);
  hintBtn.addEventListener('click', giveHint);
  notesBtn.addEventListener('click', () => {
    state.notesMode = !state.notesMode;
    renderBoard();
  });
  newGameBtn.addEventListener('click', () => newGame());
  modalNewGame.addEventListener('click', () => newGame());
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => newGame(btn.dataset.diff));
  });

  helpBtn.addEventListener('click', () => helpModal.classList.add('show'));
  helpClose.addEventListener('click', () => helpModal.classList.remove('show'));
  helpModal.addEventListener('click', e => {
    if (e.target === helpModal) helpModal.classList.remove('show');
  });

  // --- Init ---

  buildGrid();
  if (!loadGame()) {
    newGame('easy');
  }

  // Service worker is registered by the inline update script in index.html.

})();
