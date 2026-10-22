for (const t of ["contextmenu", "copy", "paste", "cut", "selectstart"]) document.addEventListener(t, e => e.preventDefault());

const $ = id => document.getElementById(id);
const play = id => $(id).play();
const img = src => Object.assign(new Image(), { src });
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1;
const W = innerWidth;
const H = innerHeight;

canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
ctx.scale(dpr, dpr);

const imgs = {
    left: img("lily_left.webp"),
    right: img("lily_right.webp"),
    leftStop: img("lily_left_stop.webp"),
    rightStop: img("lily_right_stop.webp"),
};
const cheeseImg = img("cheese.webp");
const p = { x: W / 2, y: H - 272, w: 180, h: 180, img: imgs.right, speed: 7 };
const keys = {};

let score = 0, highScore = 0, lives = 5, started = false;
let cheeses = [], speed = 3, last = Date.now(), touch = null;

const hud = () => {
    $("score").textContent = score;
    $("lives").textContent = lives;
    $("highScore").textContent = highScore;
};

const go = (dir, im) => {
    p.x += dir * p.speed;
    p.img = im;
    last = Date.now();
};

function movePlayer() {
    const max = W - p.w;
    if (keys.ArrowLeft && p.x > 0) go(-1, imgs.left);
    if (keys.ArrowRight && p.x < max) go(1, imgs.right);
    if (touch != null) {
        if (touch < W / 2 && p.x > 0) go(-1, imgs.left);
        else if (touch > W / 2 && p.x < max) go(1, imgs.right);
    }
    if (Date.now() - last > 500) p.img = p.x > W / 2 ? imgs.rightStop : imgs.leftStop;
}

function loseLife() {
    lives--;
    play("fallSound");
    if (lives <= 0) gameOver();
}

function updateCheese() {
    if (Math.random() < 0.02) cheeses.push({ x: Math.random() * W, y: 0, w: 45, h: 45 });
    cheeses = cheeses.filter(c => {
        c.y += speed;
        if (c.y <= H) return true;
        loseLife();
        navigator.vibrate?.(200);
    });
    speed += 0.001;
}

function checkCollisions() {
    cheeses = cheeses.filter(c => {
        const hit = p.x < c.x + c.w && p.x + p.w > c.x && p.y < c.y + c.h && p.y + p.h > c.y;
        if (hit) {
            score++;
            new Audio("catch.mp3").play();
        }
        return !hit;
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
    for (const c of cheeses) ctx.drawImage(cheeseImg, c.x, c.y, c.w, c.h);
    hud();
}

function loop() {
    if (!started) return;
    movePlayer();
    updateCheese();
    checkCollisions();
    render();
    requestAnimationFrame(loop);
}

function startGame() {
    $("startMenu").style.display = "none";
    started = true;
    play("backgroundMusic");
    p.img = imgs.right;
    loop();
}

function gameOver() {
    play("gameOverSound");
    started = false;
    highScore = Math.max(highScore, score);
    $("finalScore").textContent = score;
    $("gameOverPopup").style.display = "block";
}

$("lily").onclick = e => {
    navigator.vibrate?.(200);
    const el = e.currentTarget;
    el.classList.add("cute-bouncyy");
    setTimeout(() => el.classList.remove("cute-bouncyy"), 400);
};

$("startButton").onclick = startGame;

$("restartButton").onclick = () => {
    $("gameOverPopup").style.display = "none";
    score = 0;
    lives = 5;
    cheeses = [];
    speed = 3;
    hud();
    startGame();
};

for (const t of ["touchstart", "touchmove"]) canvas.addEventListener(t, e => touch = e.touches[0].clientX);
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

const clock = () => $("digitalClock").textContent = new Date().toTimeString().slice(0, 5);
setInterval(clock, 1000);
clock();
navigator.serviceWorker?.register("sw.js");
