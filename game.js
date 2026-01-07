const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ============ TEXTURE SYSTEM ============
const textures = {
    wall: new Image(),
    path: new Image(),
    start: new Image(),
    finish: new Image(),
    player: new Image(),
    alien: new Image()
};

textures.wall.src = 'Images/blueAsteroidwithStars.png';
textures.path.src = 'Images/blueStarFilling3.jpg';
textures.start.src = 'Images/Start1.png';
textures.finish.src = 'Images/Finish.png';
textures.player.src = 'Images/spaceship.png';
textures.alien.src = 'Images/alien.png';

let texturesLoaded = 0;
const totalTextures = 6;

function onTextureLoad() {
    texturesLoaded++;
    if (texturesLoaded === totalTextures) {
        draw(); // Redraw once all textures are loaded
    }
}

textures.wall.onload = onTextureLoad; //onTextureLoad means when the texture is loaded, call this function
textures.path.onload = onTextureLoad;
textures.start.onload = onTextureLoad;
textures.finish.onload = onTextureLoad;
textures.player.onload = onTextureLoad;


// ============ AUDIO SYSTEM ============
class AudioManager { 
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup background music
        this.bgMusic = new Audio('Audio/space-ambient.mp3'); // Change to your file path
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.2; // Set to 20% volume so it doesn't drown out SFX
    }

    // Ensure AudioContext is running (issue found: may be suspended after alerts/popups)
    ensureResumed() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play a simple tone with given frequency and duration
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        this.ensureResumed();

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;

        // Fade out to avoid clicks
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    playStep() {
        // Short, soft blip - for movement
        this.playTone(440, 0.08, 'sine', 0.2);
    }

    playHitWall() {
        // Low buzz - for hitting a wall
        this.playTone(150, 0.15, 'square', 0.25);
    }

    playWin() {
        // Victory fanfare - ascending tones
        this.playTone(523, 0.15, 'sine', 0.3); // C5
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 150); // E5
        setTimeout(() => this.playTone(784, 0.3, 'sine', 0.3), 300);  // G5
    }

    playObstacleHit() {
        // Danger sound - descending tones
        this.playTone(400, 0.1, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 0.2, 'sawtooth', 0.3), 100);
    }

    playLevelComplete() {
        // Short celebration
        this.playTone(523, 0.1, 'sine', 0.25);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.25), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.25), 200);
    }


    startMusic() {
        this.ensureResumed();
        // Check if music is already playing to avoid overlapping
        if (this.bgMusic.paused) {
            this.bgMusic.play().catch(e => console.log("Music wait for interaction"));
        }
    }
 }

    

const audio = new AudioManager();

// ============ TIMER SYSTEM ============
let startTime = Date.now();
let gameWon = false;

// ============ GAME CONSTANTS ============
const TILE = 60;
const ROWS = 10;
const COLS = 10;

// ============ LEVEL DEFINITIONS ============
// Cell codes: 0 = path, 1 = wall, 2 = start, 3 = finish

const mazeL1 = [
    [2, 0, 1, 0, 0, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 1, 0, 0, 3],
];

const mazeL2 = [
    [2, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 3],
];

const mazeL3 = [
    [2, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 1, 1, 3],
];

const mazeL4 = [
    [2, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 3],
];

const mazeL5 = [
    [2, 0, 0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 0, 3],
];

// Level configurations with obstacles
// Obstacle format: { r, c, direction: 'h'|'v', range, speed (ms) }
const levels = [
    {
        name: "Stage 1 - First Steps",
        maze: mazeL1,
        obstacles: []  // No obstacles for tutorial level
    },
    {
        name: "Stage 2 - Space Debris",
        maze: mazeL2,
        obstacles: [
            { r: 2, c: 2, direction: 'h', range: 3, speed: 600 }
        ]
    },
    {
        name: "Stage 3 - Asteroid Belt",
        maze: mazeL3,
        obstacles: [
            { r: 4, c: 4, direction: 'h', range: 3, speed: 500 },
            { r: 6, c: 6, direction: 'h', range: 3, speed: 550 }
        ]
    },
    {
        name: "Stage 4 - Danger Zone",
        maze: mazeL4,
        obstacles: [
            { r: 2, c: 2, direction: 'h', range: 3, speed: 450 },
            { r: 4, c: 4, direction: 'h', range: 2, speed: 400 },
            { r: 6, c: 2, direction: 'h', range: 5, speed: 500 }
        ]
    },
    {
        name: "Stage 5 - Final Frontier",
        maze: mazeL5,
        obstacles: [
            { r: 2, c: 2, direction: 'h', range: 4, speed: 350 },
            { r: 4, c: 4, direction: 'h', range: 2, speed: 300 },
            { r: 6, c: 2, direction: 'h', range: 4, speed: 350 },
            { r: 8, c: 2, direction: 'h', range: 5, speed: 400 }
        ]
    }
];

// ============ OBSTACLE CLASS ============
class Obstacle {
    constructor(r, c, direction, range, speed) {
        this.r = r;
        this.c = c;
        this.startR = r;
        this.startC = c;
        this.direction = direction;
        this.range = range;
        this.speed = speed;
        this.forward = true;
        this.moveCount = 0;
    }

    move(maze) {
        let nextR = this.r;
        let nextC = this.c;

        if (this.direction === 'h') {
            nextC = this.forward ? this.c + 1 : this.c - 1;
        } else {
            nextR = this.forward ? this.r + 1 : this.r - 1;
        }

        // Check range limits
        const distFromStart = this.direction === 'h'
            ? Math.abs(nextC - this.startC)
            : Math.abs(nextR - this.startR);

        // Check if next position is valid (not wall, in bounds, within range)
        if (nextR >= 0 && nextR < ROWS && nextC >= 0 && nextC < COLS &&
            maze[nextR][nextC] !== 1 && distFromStart <= this.range) {
            this.r = nextR;
            this.c = nextC;
        } else {
            // Reverse direction
            this.forward = !this.forward;
        }

    }
    checkCollision(playerR, playerC) {
        return this.r === playerR && this.c === playerC;  
    }

   draw() {
    const x = this.c * TILE;
    const y = this.r * TILE;

    // 1. Create an animation offset using time
    // This makes the alien "hover" or pulse
    const bobbing = Math.sin(Date.now() / 200) * 5; 
    const pulse = Math.sin(Date.now() / 150) * 0.1;

    if (textures.alien.complete && textures.alien.naturalWidth > 0) {
        ctx.save();
        
        // Add a red "danger" glow behind the alien
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 15;

        // Draw the alien image centered in the tile with bobbing effect
        // We add (1 + pulse) to the size to make it breathe
        const size = TILE * (0.8 + pulse);
        const offset = (TILE - size) / 2;

        ctx.drawImage(
            textures.alien, 
            x + offset, 
            y + offset + bobbing, 
            size, 
            size
        );
        
        ctx.restore();
    } else {
        // Fallback: If image fails, draw a red circle so the game is still playable
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(x + TILE/2, y + TILE/2 + bobbing, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}
}


// ============ GAME STATE ============
let currentLevel = 0;
let currentMaze = levels[currentLevel].maze;
let activeObstacles = [];
let obstacleIntervals = [];
let player = { c: 0, r: 0, size: TILE * 0.8, angle: 0 };

function findCell(maze, code) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (maze[r][c] === code) { return { r, c }; }
        }
    }
    return { r: 0, c: 0 };
}

function initLevel(levelIndex) {
    // Safety check: if the level doesn't exist, don't try to load it
    if (!levels[levelIndex]) {
        console.error("Level " + levelIndex + " does not exist!");
        return;
    }

    // Clear old intervals
    obstacleIntervals.forEach(interval => clearInterval(interval));
    obstacleIntervals = [];

    currentLevel = levelIndex;
    currentMaze = levels[currentLevel].maze;

    // Reset player position
    const startPos = findCell(currentMaze, 2);
    player.c = startPos.c;
    player.r = startPos.r;

    gameWon = false;
    startTime = Date.now();

    // Re-create obstacles
    activeObstacles = levels[currentLevel].obstacles.map(obs =>
        new Obstacle(obs.r, obs.c, obs.direction, obs.range, obs.speed)
    );

    activeObstacles.forEach((obstacle) => {
    const interval = setInterval(() => {
        obstacle.move(currentMaze);
        // Check if the alien moved INTO the player
        if (obstacle.checkCollision(player.r, player.c)) {
            resetPlayer();
        }
    }, obstacle.speed);
    obstacleIntervals.push(interval);
});

    // SAFE HTML UPDATE
    const title = document.querySelector('h1');
    if (title) {
        title.textContent = levels[currentLevel].name;
    }

    draw();
}

function resetPlayer() {
    const startPos = findCell(currentMaze, 2);
    player.c = startPos.c;
    player.r = startPos.r;
    audio.playObstacleHit();
}

// ============ DRAWING FUNCTIONS ============
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
    const centerX = player.c * TILE + TILE / 2; // Center of player is tile center
    const centerY = player.r * TILE + TILE / 2;

    ctx.save(); // Save current state
    ctx.translate(centerX, centerY); // Move origin to player center
    ctx.rotate(player.angle); // Rotate the canvas, not the player

    // Add glow effect 
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;

    if (textures.player.complete && textures.player.naturalWidth > 0) { 
        // Draw the image centered at the new (0,0)
        ctx.drawImage(
            textures.player, 
            -player.size / 2, 
            -player.size / 2, 
            player.size, 
            player.size
        );
    } else {
        // Fallback if image fails to load
        ctx.fillStyle = "cyan";
        ctx.fillRect(-player.size/2, -player.size/2, player.size, player.size); 
    }

    ctx.restore(); // Restore state (prevents other things from being rotated, like the timer, maze, etc.)
}
function drawGridLines() {
    ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
    ctx.lineWidth = 1;

    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE);
        ctx.lineTo(canvas.width, r * TILE);
        ctx.stroke();
    }

    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * TILE, 0);
        ctx.lineTo(c * TILE, canvas.height);
        ctx.stroke();
    }
}

function drawMaze() {
    const finishPos = findCell(currentMaze, 3);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE;
            const y = r * TILE;
            const cell = currentMaze[r][c];

            // Draw path texture as background for all cells first
            if (textures.path.complete && textures.path.naturalWidth > 0) {
                ctx.drawImage(textures.path, x, y, TILE, TILE);
            } else {
                ctx.fillStyle = "#0a0a2e";
                ctx.fillRect(x, y, TILE, TILE);
            }

            if (cell === 1) {
                // Wall - draw asteroid texture
                if (textures.wall.complete && textures.wall.naturalWidth > 0) {
                    ctx.drawImage(textures.wall, x, y, TILE, TILE);
                } else {
                    ctx.fillStyle = "red";
                    ctx.fillRect(x, y, TILE, TILE);
                }
            } else if (cell === 2) {
                // Start position - draw start texture
                if (textures.start.complete && textures.start.naturalWidth > 0) {
                    ctx.drawImage(textures.start, x, y, TILE, TILE);
                } else {
                    ctx.fillStyle = "#00ff88";
                    ctx.fillRect(x, y, TILE, TILE);
                }
            } else if (cell === 3) {
                // Finish position - draw finish texture
                if (textures.finish.complete && textures.finish.naturalWidth > 0) {
                    ctx.drawImage(textures.finish, x, y, TILE, TILE);
                } else {
                    ctx.fillStyle = "green";
                    ctx.fillRect(x, y, TILE, TILE);
                }
            }
        }
    }
}

function drawObstacles() {
    activeObstacles.forEach(obstacle => obstacle.draw());
}

function drawTimer() {
    // Draw semi-transparent background for UI
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, 40);

    if (gameWon) {
        const finalTime = Math.floor((gameWon - startTime) / 1000);
        ctx.fillStyle = "#0f0";
        ctx.font = "bold 20px Orbitron, sans-serif";
        ctx.fillText(`🏁 Time: ${finalTime}s`, 10, 28);
    } else {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        ctx.fillStyle = "#fff";
        ctx.font = "18px Orbitron, sans-serif";
        ctx.fillText(`⏱ Time: ${elapsed}s`, 10, 28);
    }

    // Draw level indicator
    ctx.fillStyle = "#0ff";
    ctx.font = "18px Orbitron, sans-serif";
    ctx.fillText(`Level ${currentLevel + 1}/5`, canvas.width - 110, 28);
}

function draw() {
    clear();
    drawMaze();
    drawGridLines();
    drawObstacles();
    drawPlayer();
    drawTimer();
}

// ============ INPUT HANDLING ============
document.addEventListener("keydown", onKey);

function onKey(e) {
    if (gameWon) return;

    audio.startMusic(); // Start background music on first interaction

    const directions = { 
        ArrowUp:    { move: [0, -1], angle: 0 },             // Pointing Up
        ArrowDown:  { move: [0, 1],  angle: Math.PI },       // Pointing Down (180°)
        ArrowLeft:  { move: [-1, 0], angle: -Math.PI / 2 },  // Pointing Left (-90°)
        ArrowRight: { move: [1, 0],  angle: Math.PI / 2 }    // Pointing Right (90°)
    };

    const action = directions[e.key];
    if (!action) return;

    player.angle = action.angle;
    const[dc, dr] = action.move;

    const nc = clamp(player.c + dc, 0, COLS - 1);
    const nr = clamp(player.r + dr, 0, ROWS - 1);

    if (currentMaze[nr][nc] !== 1) {
        player.c = nc;
        player.r = nr;
        audio.playStep();

        // Check obstacle collision after player moves
        for (const obstacle of activeObstacles) {
            if (obstacle.checkCollision(player.r, player.c)) {
                resetPlayer();
                draw();
                return;
            }
        }

        checkFinish();
        draw();
    } else {
        audio.playHitWall();
    }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function checkFinish() {
    const finishPos = findCell(currentMaze, 3);

    if (player.c === finishPos.c && player.r === finishPos.r) {
        // Stop current level intervals
        obstacleIntervals.forEach(interval => clearInterval(interval));
        obstacleIntervals = [];

        audio.playLevelComplete();

        if (currentLevel < levels.length - 1) {
            // Use a slight delay so the player sees they touched the finish icon
            setTimeout(() => {
                alert(`🎉 Stage ${currentLevel + 1} Complete!`);
                initLevel(currentLevel + 1); // Pass the NEXT number directly
            }, 50);
        } else {
            gameWon = Date.now();
            audio.playWin();
            setTimeout(() => {
                alert("🚀 MISSION COMPLETE! You found a new home!");
            }, 150);
        }
    }
}


// ============ INITIALIZATION ============
initLevel(0);

// Update timer display every second
setInterval(() => {
    if (!gameWon) draw();
}, 16);

// Locate the button in the HTML
const muteBtn = document.getElementById('muteBtn');
muteBtn.style.font = "16px Orbitron, sans-serif";

muteBtn.addEventListener('click', () => {
    // We check the "muted" property of the bgMusic object inside your audio manager
    if (audio.bgMusic.muted) {
        audio.bgMusic.muted = false;
        muteBtn.textContent = "🔈 Mute Music";
        // In case the music hasn't started yet, this helps "wake it up"
        audio.startMusic(); 
    } else {
        audio.bgMusic.muted = true;
        muteBtn.textContent = "🔇 Unmute Music";
    }
});