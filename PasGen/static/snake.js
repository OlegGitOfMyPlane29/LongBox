"use strict";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const snakeToggleBtn = document.getElementById("snake-toggle-btn");
const snakeCard      = document.getElementById("snake-card");
const snakeScoreEl   = document.getElementById("snake-score");
const canvas         = document.getElementById("snake-canvas");
const ctx            = canvas.getContext("2d");

// ── Constants ─────────────────────────────────────────────────────────────────
const CELL  = 16;
const COLS  = canvas.width  / CELL;  // 20
const ROWS  = canvas.height / CELL;  // 20
const TICK  = 130;

const COLOR_BG   = "#1a0d14";
const COLOR_GRID = "#2b1221";
const COLOR_HEAD = "#dc2626";
const COLOR_BODY = "#ef4444";
const COLOR_FOOD = "#f472b6";
const COLOR_TEXT = "#fce7f3";
const COLOR_MUTED = "#c084a0";

// ── Game state ────────────────────────────────────────────────────────────────
let snake, dir, nextDir, food, score, gameOver, loopId;

// ── Toggle show/hide ──────────────────────────────────────────────────────────
let gameStarted = false;

snakeToggleBtn.addEventListener("click", () => {
    const hidden = snakeCard.classList.toggle("hidden");
    snakeToggleBtn.textContent = hidden ? "Play Snake" : "Hide Snake";
    if (!hidden && !gameStarted) {
        startGame();
        gameStarted = true;
    }
});

// ── Init / restart ────────────────────────────────────────────────────────────
function startGame() {
    clearInterval(loopId);

    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    snake = [
        { x: startX,     y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
    ];

    dir      = { x: 1, y: 0 };
    nextDir  = { x: 1, y: 0 };
    score    = 0;
    gameOver = false;

    snakeScoreEl.textContent = "Score: 0";
    spawnFood();
    loopId = setInterval(gameTick, TICK);
}

// ── Food spawn ────────────────────────────────────────────────────────────────
function spawnFood() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
        };
    } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    food = pos;
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameTick() {
    if (gameOver) return;

    dir = nextDir;

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        endGame(); return;
    }

    // Self collision (exclude tail tip — it moves away this tick)
    if (snake.slice(0, -1).some(seg => seg.x === head.x && seg.y === head.y)) {
        endGame(); return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        snakeScoreEl.textContent = "Score: " + score;
        spawnFood();
        // tail stays — snake grows
    } else {
        snake.pop();
    }

    draw();
}

function endGame() {
    gameOver = true;
    clearInterval(loopId);
    drawGameOver();
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function draw() {
    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += CELL) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += CELL) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Food — pink circle
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake — red rounded squares
    snake.forEach((seg, i) => {
        ctx.fillStyle = (i === 0) ? COLOR_HEAD : COLOR_BODY;
        const pad = 1;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 3);
        ctx.fill();
    });
}

function drawGameOver() {
    draw();

    // Overlay
    ctx.fillStyle = "rgba(26, 13, 20, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 28px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "16px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = COLOR_MUTED;
    ctx.font = "13px 'Segoe UI', system-ui, sans-serif";
    ctx.fillText("Try better", canvas.width / 2, canvas.height / 2 + 36);

    ctx.textAlign = "left";
}

// ── Controls ──────────────────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
        if (gameStarted) startGame();
        return;
    }

    if (snakeCard.classList.contains("hidden")) return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case "ArrowUp":    case "w": case "W":
            if (dir.y !== 1)  nextDir = { x: 0, y: -1 }; break;
        case "ArrowDown":  case "s": case "S":
            if (dir.y !== -1) nextDir = { x: 0, y:  1 }; break;
        case "ArrowLeft":  case "a": case "A":
            if (dir.x !== 1)  nextDir = { x: -1, y: 0 }; break;
        case "ArrowRight": case "d": case "D":
            if (dir.x !== -1) nextDir = { x:  1, y: 0 }; break;
    }
});

// Click canvas to restart after game over
canvas.addEventListener("click", () => {
    if (gameOver) startGame();
});
