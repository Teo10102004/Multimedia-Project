const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// let player = {
//     x:15,
//     y:15,
//     size: 30
// };

// function draw(){
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.fillStyle = "black"; //fill color for backround
//     ctx.fillRect(0, 0, canvas.width, canvas.height); //background

//     ctx.fillStyle = "cyan";
//     ctx.fillRect(player.x, player.y, player.size, player.size); //player
// }

// draw();

// document.addEventListener("keydown", movePlayer);

//     function movePlayer(event)
//     {
//         const speed = 20;
//         if(event.key === "ArrowUp") player.y -= speed;
//         if(event.key === "ArrowDown") player.y += speed;
//         if(event.key === "ArrowLeft") player.x -= speed;
//         if(event.key === "ArrowRight") player.x += speed;
    
//     draw();
//     }

// The above funtionality is pixel based but it will be harder to implement collisions and levels this way
// Instead we will use a grid based system

const TILE = 60;
const ROWS = 10;
const COLS = 10;

let player = {c:0, r:0, size: TILE *0.6}; //the player needs to be a bit smaller than the tile 

function clear() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
}

function drawPlayer() {
    const px = player.c * TILE + (TILE - player.size) / 2;//i don't think I need this anymore
    const py = player.r * TILE + (TILE - player.size) / 2;

    ctx.fillStyle = "cyan";
    ctx.fillRect(px, py, player.size, player.size);
}

function drawGridLines() {
    ctx.strokeStyle = "gray";

    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE);
        ctx.lineTo(canvas.width, r * TILE);
        ctx.stroke();
    }

    for (let c=0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * TILE, 0);
        ctx.lineTo(c * TILE, canvas.height);
        ctx.stroke();
    }
}

function draw() {
    clear();

    // ctx.fillStyle = "black";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMaze();
    drawGridLines();
    drawPlayer();
}


const mazeL1 =[

    [2,0,1,0,0,0,1,0,1,0],
    [0,1,1,0,1,0,1,0,1,0],
    [0,0,0,0,1,0,0,0,0,0],
    [1,1,1,0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,1,0,0],
    [0,1,1,1,1,1,0,1,1,0],
    [0,0,0,0,0,1,0,0,0,0],
    [1,1,1,1,0,1,1,1,1,0],
    [0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,1,1,0,0,3], 
]


function findCell(level, code) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (level[r][c] === code) { return { r, c }; }
        }
    }
    return { r: 0, c: 0 };
}

const startPos = findCell(mazeL1, 2);
const finishPos = findCell(mazeL1, 3);
let playerPos = {c: startPos.c, r: startPos.r};

function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE;
            const y = r * TILE;
            const cell = mazeL1[r][c];

        if (cell === 1) {
            ctx.fillStyle = "red"; // wall (asteroid later)
        } else if (cell === 3) {
            ctx.fillStyle = "green"; // finish bg
        } else {
            ctx.fillStyle = "#000";    // path
        }
        ctx.fillRect(x, y, TILE, TILE);
        }
    }
}


document.addEventListener("keydown", onKey)

function onKey(e) {
    const dir = { ArrowUp: [0, -1] , ArrowDown: [0, 1] , ArrowLeft: [-1, 0] , ArrowRight: [1, 0] }[e.key];
    if (!dir) return;

    const [dc, dr] = dir;  //delta columns, delta rows
    const nc = clamp(player.c +dc, 0, COLS -1); //new column
    const nr = clamp(player.r + dr, 0, ROWS -1); //new row

    if(mazeL1[nr][nc] !== 1){
        player.c = nc;
        player.r = nr;
        checkFinish();
        draw();
    }
}

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }//keeps the number in a valid range

function checkFinish(){
    if (player.c === finishPos.c && player.r === finishPos.r) {
        setTimeout(()=> alert("🏁 You reached the planet!"), 10);
    }
}


draw();

//todo de adaugat texturi
//todo de adaugat timer
//todo de adaugat alte nivele
//todo de adaugat obstacole