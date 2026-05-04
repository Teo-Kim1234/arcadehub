document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements ---
  const screens = {
    main: document.getElementById("main-screen"),
    game: document.getElementById("game-screen"),
    fail: document.getElementById("fail-screen")
  };

  const modeTrack = document.getElementById("mode-track");
  const prevModeBtn = document.getElementById("prev-mode");
  const nextModeBtn = document.getElementById("next-mode");
  const modeCards = document.querySelectorAll(".mode-card");

  // --- State ---
  let currentMode = "practice";
  let stateHistory = [];

  // --- Navigation ---
  function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    if (screens[screenKey]) {
      screens[screenKey].classList.add("active");
    }
  }

  // --- Carousel Logic ---
  let currentModeIndex = 0;
  const totalModes = modeCards.length;

  function updateCarousel() {
    const offset = -currentModeIndex * 320;
    if (modeTrack) modeTrack.style.transform = `translateX(${offset}px)`;
    
    modeCards.forEach((card, index) => {
      if (index === currentModeIndex) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  if (prevModeBtn) {
    prevModeBtn.onclick = () => {
      currentModeIndex = (currentModeIndex - 1 + totalModes) % totalModes;
      updateCarousel();
    };
  }

  if (nextModeBtn) {
    nextModeBtn.onclick = () => {
      currentModeIndex = (currentModeIndex + 1) % totalModes;
      updateCarousel();
    };
  }

  modeCards.forEach(card => {
    card.onclick = () => {
      currentMode = card.dataset.mode;
      showScreen("game");
      startGame();
    };
  });

  // --- Tutorial Modal ---
  const tutorialBtn = document.getElementById("btn-tutorial");
  const tutorialModal = document.getElementById("tutorial-modal");
  const modalClose = document.getElementById("modal-close");

  if (tutorialBtn) {
    tutorialBtn.onclick = () => tutorialModal.classList.add("active");
  }

  if (modalClose) {
    modalClose.onclick = () => tutorialModal.classList.remove("active");
  }

  window.onclick = (event) => {
    if (event.target === tutorialModal) {
      tutorialModal.classList.remove("active");
    }
  };

  // --- Rewind Logic (Time Travel) ---
  function saveGameState() {
    stateHistory.push({
      grid: JSON.parse(JSON.stringify(grid)),
      score: score,
      level: level,
      piece: JSON.parse(JSON.stringify(piece)),
      nextPiece: JSON.parse(JSON.stringify(nextPiece))
    });
    if (stateHistory.length > 30) stateHistory.shift();
  }

  function rewindState() {
    if (stateHistory.length === 0) return;
    const lastState = stateHistory.pop();
    grid = lastState.grid;
    score = lastState.score;
    level = lastState.level;
    piece = lastState.piece;
    nextPiece = lastState.nextPiece;
    updateScore();
    drawNext();
    draw();
  }

  // --- Tetris Game Logic ---
  const canvas = document.getElementById("tetris-canvas");
  const ctx = canvas.getContext("2d");
  const nextCanvas = document.getElementById("next-canvas");
  const nctx = nextCanvas.getContext("2d");
  
  const ROWS = 20;
  const COLS = 10;
  const BLOCK_SIZE = 30;

  let score = 0;
  let level = 1;
  let grid = createGrid();
  let piece = null;
  let nextPiece = null;
  let dropCounter = 0;
  let lastTime = 0;
  let animationId = null;

  function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  const PIECES = [
    { shape: [[1, 1, 1, 1]], color: "#00d4ff" }, // I
    { shape: [[1, 1, 1], [0, 1, 0]], color: "#ff00e5" }, // T
    { shape: [[1, 1], [1, 1]], color: "#7000ff" }, // O
    { shape: [[0, 1, 1], [1, 1, 0]], color: "#00ff9d" }, // S
    { shape: [[1, 1, 0], [0, 1, 1]], color: "#ff3e3e" }, // Z
    { shape: [[1, 1, 1], [1, 0, 0]], color: "#ff8c00" }, // L
    { shape: [[1, 1, 1], [0, 0, 1]], color: "#007bff" }  // J
  ];

  function randomPiece() {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: p.shape,
      color: p.color,
      pos: { x: Math.floor(COLS / 2) - 1, y: 0 }
    };
  }

  function draw() {
    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(grid, { x: 0, y: 0 });
    
    // Draw piece
    if (piece) {
      drawPiece(piece.shape, piece.pos, piece.color, ctx);
    }
  }

  function drawGrid(matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x + offset.x, y + offset.y, value, ctx);
        }
      });
    });
  }

  function drawPiece(matrix, offset, color, context) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x + offset.x, y + offset.y, color, context);
        }
      });
    });
  }

  function drawBlock(x, y, color, context) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = "rgba(0, 0, 0, 0.5)";
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    
    // Add glow effect
    context.shadowBlur = 15;
    context.shadowColor = color;
  }

  function collide(grid, piece) {
    const [m, o] = [piece.shape, piece.pos];
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (m[y][x] !== 0 &&
           (grid[y + o.y] && grid[y + o.y][x + o.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  function merge(grid, piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          grid[y + piece.pos.y][x + piece.pos.x] = piece.color;
        }
      });
    });
  }

  function rotate(matrix) {
    const result = matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
    return result;
  }

  function playerDrop() {
    piece.pos.y++;
    if (collide(grid, piece)) {
      piece.pos.y--;
      merge(grid, piece);
      resetPiece();
      arenaSweep();
      updateScore();
    }
    dropCounter = 0;
  }

  function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = grid.length - 1; y > 0; --y) {
      for (let x = 0; x < grid[y].length; ++x) {
        if (grid[y][x] === 0) {
          continue outer;
        }
      }
      const row = grid.splice(y, 1)[0].fill(0);
      grid.unshift(row);
      ++y;
      score += rowCount * 10;
      rowCount *= 2;
      
      if (window.parent && window.parent.playGameSound) {
          window.parent.playGameSound('clear');
      }
    }
  }

  function updateScore() {
    document.getElementById("score-val").textContent = score;
    level = Math.floor(score / 100) + 1;
    document.getElementById("level-val").textContent = level;
    
    // Update high score in hub (if parent window exists)
    if (window.parent && window.parent.updateHighScore) {
        window.parent.updateHighScore('tetris', score);
    }
  }

  function resetPiece() {
    if (currentMode === "practice") {
      saveGameState();
    }

    piece = nextPiece;
    nextPiece = randomPiece();
    if (collide(grid, piece)) {
      cancelAnimationFrame(animationId);
      document.getElementById("final-score-val").textContent = score;
      showScreen("fail");
      if (window.parent && window.parent.playGameSound) {
          window.parent.playGameSound('over');
      }
      return;
    }
    drawNext();
  }

  function drawNext() {
    nctx.fillStyle = "#000";
    nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const size = 20;
    const offsetX = (nextCanvas.width - nextPiece.shape[0].length * size) / 2;
    const offsetY = (nextCanvas.height - nextPiece.shape.length * size) / 2;

    nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          nctx.fillStyle = nextPiece.color;
          nctx.shadowBlur = 10;
          nctx.shadowColor = nextPiece.color;
          nctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
          nctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
          nctx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);
        }
      });
    });
  }

  function startGame() {
    grid = createGrid();
    score = 0;
    level = 1;
    stateHistory = [];
    updateScore();
    nextPiece = randomPiece();
    resetPiece();
    lastTime = 0;
    if (animationId) cancelAnimationFrame(animationId);
    requestAnimationFrame(update);
  }

  function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    const dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    if (dropCounter > dropInterval) {
      playerDrop();
    }

    draw();
    if (screens.game.classList.contains("active")) {
      animationId = requestAnimationFrame(update);
    }
  }

  // --- Controls ---
  document.addEventListener("keydown", event => {
    if (!screens.game.classList.contains("active")) return;

    if (event.keyCode === 37) { // Left
      piece.pos.x--;
      if (collide(grid, piece)) piece.pos.x++;
    } else if (event.keyCode === 39) { // Right
      piece.pos.x++;
      if (collide(grid, piece)) piece.pos.x--;
    } else if (event.keyCode === 40) { // Down
      playerDrop();
    } else if (event.keyCode === 38) { // Up (Rotate)
      const oldShape = piece.shape;
      piece.shape = rotate(piece.shape);
      if (collide(grid, piece)) piece.shape = oldShape;
    } else if (event.keyCode === 32) { // Space (Hard Drop)
      while (!collide(grid, piece)) {
        piece.pos.y++;
      }
      piece.pos.y--;
      merge(grid, piece);
      resetPiece();
      arenaSweep();
      updateScore();
    } else if (event.keyCode === 65) { // 'a' key
      if (currentMode === "practice") {
        rewindState();
      }
    }
  });

  // Initial carousel setup
  updateCarousel();
});
