// 1. Define the variables
const imgPlayer = new Image();
const imgWall = new Image();
const imgFinish = new Image();
const imgPath = new Image();
const imgStart = new Image(); // 

// 2. The Loading Counter 
let imagesLoaded = 0;
const totalImages = 5;

function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("All images loaded! Starting game...");
        
        // FIX: Set the player position to the actual start position before drawing
        const start = findCell(currentLevel, 2);
        player.c = start.c;
        player.r = start.r;

        draw(); // Only draw when images are ready
    }
}

imgPlayer.onload = onImageLoad;
imgWall.onload = onImageLoad;
imgFinish.onload = onImageLoad;
imgPath.onload = onImageLoad;
imgStart.onload = onImageLoad;

// 3. Set the source paths
imgPlayer.src = "Images/rocket1.png";                
imgWall.src   = "Images/blueAsteroidwithStars.png"; 
imgFinish.src = "Images/Finish.png";                
imgPath.src   = "Images/blueStarFilling3.jpg";      
imgStart.src  = "Images/Start1.png";                


const canvas = document.getElementById("gameCanvas"); //this is how we access the canvas element from the HTML
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

let player = {c:0, r:0, size: TILE *0.6, angle: 0}; //the player needs to be a bit smaller than the tile 

function clear() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
}

function drawPlayer() {
    const px = player.c * TILE + (TILE - player.size) / 2;//i don't think I need this anymore
    const py = player.r * TILE + (TILE - player.size) / 2;

    const centerX = player.c * TILE + TILE / 2; //calculate the center of the tile
    const centerY = player.r * TILE + TILE / 2;

    ctx.save(); //save the current context state so that we do not rotate the entire canvas

    ctx.translate(centerX, centerY); //move the origin to the center of the player
    ctx.rotate(player.angle); //rotate the canvas by the player's angle


    ctx.drawImage(imgPlayer, -player.size / 2, -player.size / 2, player.size, player.size); //draw the player centered at the origin, we use negative values becuqase we moved the origin to the center of the player

    ctx.restore(); //restore the context to its original state so that other elements do not get rotated

    
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


const level1 =[

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

const level2 = [
    [2, 0, 1, 0, 0, 0, 4, 0, 0, 1], // Row 0: Start (2) top-left. Watch out for the trap (4)!
    [1, 0, 1, 0, 1, 1, 1, 1, 0, 1], // Row 1: Tight corridor
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1], // Row 2: Open space, but deceptive
    [1, 1, 1, 1, 1, 0, 1, 1, 4, 1], // Row 3: A Trap (4) blocks a shortcut
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1], // Row 4: Zig-zag area
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1], // Row 5
    [1, 0, 0, 4, 0, 0, 0, 0, 0, 1], // Row 6: Trap in the middle of the open path
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1], // Row 7
    [1, 0, 0, 0, 0, 0, 4, 0, 0, 0], // Row 8: One last trap before the end
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 3]  // Row 9: Finish (3) bottom-right
];

const levels = [level1, level2];
let currentLevelIndex = 0;
let currentLevel = levels[currentLevelIndex];

function findCell(level, code) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (level[r][c] === code) { return { r, c }; }
        }
    }
    return { r: 0, c: 0 };
}

const startPos = findCell(currentLevel, 2);
const finishPos = findCell(currentLevel, 3);
let playerPos = {c: startPos.c, r: startPos.r};

function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE;
            const y = r * TILE;
            const cell = currentLevel[r][c];

        ctx.drawImage(imgPath, x, y, TILE, TILE); //default path image

        if (cell === 1) {
            ctx.drawImage(imgWall, x, y, TILE, TILE); //wall image
        } else if (cell === 3) {
            ctx.drawImage(imgFinish, x, y, TILE, TILE); //finish image
        } else if(cell ===2){
            ctx.drawImage(imgStart, x, y, TILE, TILE); //start image
        }
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

    if(currentLevel[nr][nc] !== 1){
        player.c = nc;
        player.r = nr;
        checkFinish();
        draw();
    }
}

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }//keeps the number in a valid range

function checkFinish(){
    if(player.r === finishPos.r && player.c === finishPos.c){

        if(currentLevelIndex < levels.length -1){
        alert("Level Complete! Moving to next level.");

        currentLevelIndex++;
        currentLevel = levels[currentLevelIndex];

        const newStart = findCell(currentLevel, 2);
        player.c = newStart.c;
        player.r = newStart.r;

        const newFinish = findCell(currentLevel, 3);
        finishPos.c = newFinish.c;
        finishPos.r = newFinish.r;

        draw();
        }
    else {
        alert("🏆 YOU WON THE WHOLE GAME!");
    }
    }
}



//todo de adaugat timer
//todo de adaugat obstacole
//todo de adaugat logica dde rotire in OnKey