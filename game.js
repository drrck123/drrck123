 const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = 800;
const HEIGHT = 400;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 40;
const GROUND_HEIGHT = 50;

// Audio setup with preloading
const backgroundMusic = new Audio();
const jumpSound = new Audio();

function preloadAssets() {
    backgroundMusic.src = 'soundtrack.mp3';
    jumpSound.src = 'jump.mp3';
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    jumpSound.volume = 0.7;
    backgroundMusic.playing = false;
}
preloadAssets();

let player = {
    x: 100,
    y: HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
    velocityY: 0,
    jumping: false,
    frame: 0,
    flying: false,
    flyTimeLeft: 0
};

let obstacles = [];
let platforms = [];
let pits = [];
let coins = [];
let score = 0;
let gameOver = false;

let clouds = [];
let mountains = [];
let hills = [];
let trees = [];
let particles = [];

class Obstacle {
    constructor() {
        this.width = 30;
        this.height = 40 + Math.random() * 60;
        this.x = WIDTH + 20;
        this.y = HEIGHT - GROUND_HEIGHT - this.height;
    }
}

class Platform {
    constructor() {
        this.width = 80 + Math.random() * 40;
        this.height = 20;
        this.x = WIDTH + 20;
        this.y = HEIGHT - GROUND_HEIGHT - (100 + Math.random() * 150);
        this.speed = 3;
    }
}

class Pit {
    constructor(x) {
        this.width = 50 + Math.random() * 50;
        this.height = GROUND_HEIGHT + 20;
        this.x = x || WIDTH + 20;
        this.y = HEIGHT - GROUND_HEIGHT;
        this.speed = 3;
    }
}

class Coin {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.x = WIDTH + 20;
        this.y = HEIGHT - GROUND_HEIGHT - (50 + Math.random() * 200);
        this.speed = 3;
    }
}

class Cloud {
    constructor(x) {
        this.x = x;
        this.y = 20 + Math.random() * 100;
        this.radius = 20 + Math.random() * 30;
        this.speed = 0.1 + Math.random() * 0.2;
    }
}

class Mountain {
    constructor(x) {
        this.x = x;
        this.height = 100 + Math.random() * 150;
        this.width = 150 + Math.random() * 150;
        this.speed = 0.3 + Math.random() * 0.3;
        this.color = `rgb(100, ${100 + Math.random() * 50}, 100)`;
    }
}

class Hill {
    constructor(x) {
        this.x = x;
        this.height = 50 + Math.random() * 70;
        this.width = 80 + Math.random() * 80;
        this.speed = 0.8 + Math.random() * 0.4;
    }
}

class Tree {
    constructor(x) {
        this.x = x;
        this.height = 30 + Math.random() * 40;
        this.width = 20 + Math.random() * 30;
        this.speed = 1.2 + Math.random() * 0.6;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5 + Math.random() * 5;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = (Math.random() - 0.5) * 4;
        this.life = 30 + Math.random() * 20;
        this.color = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.5})`;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initializeBackground() {
    clouds = [];
    mountains = [];
    hills = [];
    trees = [];

    let cloudX = -300;
    while (cloudX < WIDTH + 300) {
        clouds.push(new Cloud(cloudX));
        cloudX += 200 + Math.random() * 300;
    }

    let mountainX = -400;
    while (mountainX < WIDTH + 400) {
        mountains.push(new Mountain(mountainX));
        mountainX += 300 + Math.random() * 400;
    }

    let hillX = -250;
    while (hillX < WIDTH + 250) {
        hills.push(new Hill(hillX));
        hillX += 120 + Math.random() * 200;
    }

    let treeX = -200;
    while (treeX < WIDTH + 200) {
        trees.push(new Tree(treeX));
        if (Math.random() < 0.3) {
            treeX += 20 + Math.random() * 40;
        } else {
            treeX += 100 + Math.random() * 200;
        }
    }
}

function spawnObstacle() {
    obstacles.push(new Obstacle());
}

function spawnPlatform() {
    platforms.push(new Platform());
}

function spawnPit() {
    let newPitX = WIDTH + 20;
    let overlaps = false;

    for (let obs of obstacles) {
        if (newPitX < obs.x + obs.width + 50 && newPitX + 100 > obs.x - 50) {
            overlaps = true;
            break;
        }
    }

    if (!overlaps) {
        pits.push(new Pit(newPitX));
    }
}

function spawnCoin() {
    coins.push(new Coin());
}

function spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

function drawPlayer() {
    const headSize = PLAYER_WIDTH * 0.4;
    const bodyHeight = PLAYER_HEIGHT * 0.6;
    const legHeight = PLAYER_HEIGHT * 0.35;
    const armLength = PLAYER_WIDTH * 0.5;
    const swordLength = PLAYER_WIDTH * 0.8;

    ctx.save();
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y);

    player.frame += 0.15;
    const cycle = Math.sin(player.frame);
    const headBob = Math.abs(cycle) * 2;

    // Shadow for depth (under feet, not waist)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, PLAYER_HEIGHT - 2, PLAYER_WIDTH * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!player.jumping && !player.flying) {
        const legSwing = Math.sin(player.frame * 1.5) * 0.7;
        const armSwing = Math.sin(player.frame * 1.5 + Math.PI / 2) * 0.6;

        // Head with glowing eyes
        ctx.fillStyle = '#2A2A2A';
        ctx.beginPath();
        ctx.arc(0, headSize / 2 - headBob, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(0, 255, 255, ${0.8 + Math.sin(player.frame * 2) * 0.2})`;
        ctx.fillRect(-headSize / 4 + 2, headSize / 2 - headBob - 2, headSize / 6, 4);
        ctx.fillRect(headSize / 4 - 2, headSize / 2 - headBob - 2, headSize / 6, 4);

        // Animated cape with gradient
        let capeGradient = ctx.createLinearGradient(-PLAYER_WIDTH * 0.25, headSize, -PLAYER_WIDTH * 0.5, headSize + bodyHeight);
        capeGradient.addColorStop(0, '#FF4444');
        capeGradient.addColorStop(1, '#AA0000');
        ctx.fillStyle = capeGradient;
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH * 0.25, headSize);
        ctx.quadraticCurveTo(-PLAYER_WIDTH * 0.4 - Math.sin(player.frame * 2) * 10, headSize + bodyHeight / 2, -PLAYER_WIDTH * 0.25, headSize + bodyHeight);
        ctx.lineTo(PLAYER_WIDTH * 0.25, headSize + bodyHeight);
        ctx.lineTo(PLAYER_WIDTH * 0.25, headSize);
        ctx.fill();

        // Torso with metallic sheen
        let torsoGradient = ctx.createLinearGradient(-PLAYER_WIDTH * 0.25, headSize, PLAYER_WIDTH * 0.25, headSize + bodyHeight);
        torsoGradient.addColorStop(0, '#666666');
        torsoGradient.addColorStop(0.5, '#AAAAAA');
        torsoGradient.addColorStop(1, '#666666');
        ctx.fillStyle = torsoGradient;
        ctx.fillRect(-PLAYER_WIDTH * 0.25, headSize, PLAYER_WIDTH * 0.5, bodyHeight);

        // Legs with smoother animation
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH * 0.1, headSize + bodyHeight); // Left leg start
        ctx.lineTo(-PLAYER_WIDTH * 0.1 + Math.sin(legSwing) * 10, headSize + bodyHeight + legHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PLAYER_WIDTH * 0.1, headSize + bodyHeight); // Right leg start
        ctx.lineTo(PLAYER_WIDTH * 0.1 - Math.sin(legSwing) * 10, headSize + bodyHeight + legHeight);
        ctx.stroke();

        // Arms with corrected positioning
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.save();
        ctx.translate(PLAYER_WIDTH * 0.25, headSize + bodyHeight * 0.2); // Right arm
        ctx.rotate(armSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, 0);
        ctx.stroke();
        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(armLength, 0);
        ctx.lineTo(armLength + swordLength, -swordLength * 0.5);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(-PLAYER_WIDTH * 0.25, headSize + bodyHeight * 0.2); // Left arm
        ctx.rotate(-armSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-armLength, 0);
        ctx.stroke();
        ctx.restore();
    } else {
        // Flying/Jumping state
        let torsoGradient = ctx.createLinearGradient(-PLAYER_WIDTH * 0.25, headSize, PLAYER_WIDTH * 0.25, headSize + bodyHeight);
        torsoGradient.addColorStop(0, '#666666');
        torsoGradient.addColorStop(1, '#AAAAAA');
        ctx.fillStyle = torsoGradient;
        ctx.fillRect(-PLAYER_WIDTH * 0.25, headSize, PLAYER_WIDTH * 0.5, bodyHeight);

        ctx.fillStyle = '#2A2A2A';
        ctx.beginPath();
        ctx.arc(0, headSize / 2, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(0, 255, 255, ${0.8 + Math.sin(player.frame * 2) * 0.2})`;
        ctx.fillRect(-headSize / 4 + 2, headSize / 2 - 2, headSize / 6, 4);
        ctx.fillRect(headSize / 4 - 2, headSize / 2 - 2, headSize / 6, 4);

        // Cape in air
        let capeGradient = ctx.createLinearGradient(-PLAYER_WIDTH * 0.25, headSize, -PLAYER_WIDTH * 0.5, headSize + bodyHeight);
        capeGradient.addColorStop(0, '#FF4444');
        capeGradient.addColorStop(1, '#AA0000');
        ctx.fillStyle = capeGradient;
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH * 0.25, headSize);
        ctx.quadraticCurveTo(-PLAYER_WIDTH * 0.5, headSize + bodyHeight / 2, -PLAYER_WIDTH * 0.3, headSize + bodyHeight);
        ctx.lineTo(PLAYER_WIDTH * 0.25, headSize + bodyHeight);
        ctx.lineTo(PLAYER_WIDTH * 0.25, headSize);
        ctx.fill();

        // Legs in air
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-PLAYER_WIDTH * 0.1, headSize + bodyHeight);
        ctx.lineTo(-PLAYER_WIDTH * 0.15, headSize + bodyHeight + legHeight * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PLAYER_WIDTH * 0.1, headSize + bodyHeight);
        ctx.lineTo(PLAYER_WIDTH * 0.15, headSize + bodyHeight + legHeight * 0.8);
        ctx.stroke();

        // Arms in air
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 5;
        ctx.save();
        ctx.translate(PLAYER_WIDTH * 0.25, headSize + bodyHeight * 0.2);
        ctx.rotate(-Math.PI / 6); // Right arm angled up
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, 0);
        ctx.stroke();
        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(armLength, 0);
        ctx.lineTo(armLength + swordLength, -swordLength * 0.5);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(-PLAYER_WIDTH * 0.25, headSize + bodyHeight * 0.2);
        ctx.rotate(Math.PI / 6); // Left arm angled up
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-armLength, 0);
        ctx.stroke();
        ctx.restore();

        // Wing-like effects for flying
        if (player.flying) {
            let wingGradient = ctx.createLinearGradient(0, headSize, 0, headSize + bodyHeight);
            wingGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
            wingGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = wingGradient;
            ctx.beginPath();
            ctx.moveTo(-PLAYER_WIDTH * 0.5, headSize + bodyHeight * 0.5);
            ctx.quadraticCurveTo(-PLAYER_WIDTH * 0.8, headSize + bodyHeight * 0.8 + Math.sin(player.frame) * 10, -PLAYER_WIDTH * 0.3, headSize + bodyHeight * 0.8);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(PLAYER_WIDTH * 0.5, headSize + bodyHeight * 0.5);
            ctx.quadraticCurveTo(PLAYER_WIDTH * 0.8, headSize + bodyHeight * 0.8 + Math.sin(player.frame) * 10, PLAYER_WIDTH * 0.3, headSize + bodyHeight * 0.8);
            ctx.fill();
        }
    }
    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Smoother sky gradient with sunset hues
    let skyGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGradient.addColorStop(0, '#FFB6C1');
    skyGradient.addColorStop(0.3, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Clouds with soft edges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.radius * 0.7, cloud.y + cloud.radius * 0.3, cloud.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Mountains with texture
    mountains.forEach(mountain => {
        ctx.fillStyle = mountain.color;
        ctx.beginPath();
        ctx.moveTo(mountain.x, HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(mountain.x + mountain.width / 2, HEIGHT - GROUND_HEIGHT - mountain.height);
        ctx.lineTo(mountain.x + mountain.width, HEIGHT - GROUND_HEIGHT);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(mountain.x + mountain.width / 4, HEIGHT - GROUND_HEIGHT);
        ctx.lineTo(mountain.x + mountain.width / 2, HEIGHT - GROUND_HEIGHT - mountain.height * 0.8);
        ctx.lineTo(mountain.x + mountain.width * 0.75, HEIGHT - GROUND_HEIGHT);
        ctx.fill();
    });

    hills.forEach(hill => {
        let hillGradient = ctx.createLinearGradient(hill.x, HEIGHT - GROUND_HEIGHT - hill.height, hill.x, HEIGHT);
        hillGradient.addColorStop(0, 'darkgreen');
        hillGradient.addColorStop(1, '#228B22');
        ctx.fillStyle = hillGradient;
        ctx.beginPath();
        ctx.moveTo(hill.x, HEIGHT - GROUND_HEIGHT);
        ctx.quadraticCurveTo(hill.x + hill.width / 2, HEIGHT - GROUND_HEIGHT - hill.height, hill.x + hill.width, HEIGHT - GROUND_HEIGHT);
        ctx.fill();
    });

    // Ground with texture
    ctx.fillStyle = '#78C850';
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    pits.forEach(pit => {
        ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
        ctx.fillStyle = 'rgba(50, 20, 0, 0.5)';
        ctx.fillRect(pit.x, pit.y, pit.width, pit.height * 0.3);
    });

    trees.forEach(tree => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(tree.x + tree.width / 4, HEIGHT - GROUND_HEIGHT - tree.height, tree.width / 2, tree.height);
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2, HEIGHT - GROUND_HEIGHT - tree.height * 1.2, tree.width * 0.8, 0, Math.PI * 2);
        ctx.arc(tree.x + tree.width / 2, HEIGHT - GROUND_HEIGHT - tree.height * 1.5, tree.width * 0.6, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#808080';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Polished coins with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
    coins.forEach(coin => {
        let coinGradient = ctx.createRadialGradient(coin.x + coin.width / 2, coin.y + coin.height / 2, 0, coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2);
        coinGradient.addColorStop(0, '#FFD700');
        coinGradient.addColorStop(1, '#DAA520');
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    drawPlayer();

    // Obstacles with metallic look
    obstacles.forEach(obs => {
        let obsGradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        obsGradient.addColorStop(0, '#555555');
        obsGradient.addColorStop(1, '#222222');
        ctx.fillStyle = obsGradient;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Polished UI
    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'black';
    ctx.fillText(`Score: ${Math.floor(score / 10)}`, 10, 30);
    if (player.flying) {
        ctx.fillText(`Fly: ${Math.ceil(player.flyTimeLeft / 60)}s`, 10, 60);
    }
    ctx.shadowBlur = 0;

    // Game Over with fade effect
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.font = '40px "Press Start 2P"';
        ctx.fillStyle = '#FF4444';
        ctx.textAlign = 'center';
        ctx.fillText(`Game Over`, WIDTH / 2, HEIGHT / 2 - 20);
        ctx.font = '20px "Press Start 2P"';
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${Math.floor(score / 10)}`, WIDTH / 2, HEIGHT / 2 + 20);
        ctx.fillText(`Press to Restart`, WIDTH / 2, HEIGHT / 2 + 60);
        ctx.textAlign = 'left';
    }

    // Draw particles
    particles.forEach(p => p.draw());
}

function update() {
    if (gameOver) return;

    if (player.flying) {
        player.flyTimeLeft--;
        if (player.flyTimeLeft <= 0) {
            player.flying = false;
            player.velocityY = 0;
        }
    } else {
        player.y += player.velocityY;
        player.velocityY += 1;
    }

    let onPlatform = false;
    if (!player.flying) {
        for (let platform of platforms) {
            if (
                player.x + PLAYER_WIDTH > platform.x &&
                player.x < platform.x + platform.width &&
                player.y + PLAYER_HEIGHT <= platform.y + platform.height &&
                player.y + PLAYER_HEIGHT + player.velocityY >= platform.y &&
                player.velocityY > 0
            ) {
                player.y = platform.y - PLAYER_HEIGHT;
                player.velocityY = 0;
                player.jumping = false;
                onPlatform = true;
                break;
            }
        }
    }

    if (!onPlatform && player.y < HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT && !player.flying) {
        player.jumping = true;
    }

    for (let pit of pits) {
        if (
            player.x + PLAYER_WIDTH > pit.x &&
            player.x < pit.x + pit.width &&
            player.y + PLAYER_HEIGHT > pit.y + 5
        ) {
            if (player.y + PLAYER_HEIGHT >= pit.y + pit.height * 0.5 && !player.flying) {
                gameOver = true;
                break;
            }
        }
    }

    let onGround = true;
    if (!player.flying) {
        for (let pit of pits) {
            if (
                player.x + PLAYER_WIDTH > pit.x &&
                player.x < pit.x + pit.width &&
                player.y + PLAYER_HEIGHT >= pit.y
            ) {
                onGround = false;
                break;
            }
        }

        if (onGround && !onPlatform && player.y >= HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT) {
            player.y = HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
            player.velocityY = 0;
            player.jumping = false;
        }
    }

    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > WIDTH + 200) cloud.x -= (WIDTH + 400);
    });

    mountains.forEach(mountain => {
        mountain.x += mountain.speed;
        if (mountain.x > WIDTH + 300) mountain.x -= (WIDTH + 600);
    });

    hills.forEach(hill => {
        hill.x += hill.speed;
        if (hill.x > WIDTH + 200) hill.x -= (WIDTH + 400);
    });

    trees.forEach(tree => {
        tree.x += tree.speed;
        if (tree.x > WIDTH + 150) tree.x -= (WIDTH + 300);
    });

    const difficulty = Math.min(1 + score / 10000, 2); // Progressive difficulty

    obstacles.forEach((obs, index) => {
        obs.x -= 3 * difficulty;
        if (
            player.x < obs.x + obs.width &&
            player.x + PLAYER_WIDTH > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + PLAYER_HEIGHT > obs.y &&
            !player.flying
        ) {
            gameOver = true;
        }
        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    platforms.forEach((platform, index) => {
        platform.x -= platform.speed * difficulty;
        if (platform.x + platform.width < 0) {
            platforms.splice(index, 1);
        }
    });

    pits.forEach((pit, index) => {
        pit.x -= pit.speed * difficulty;
        if (pit.x + pit.width < 0) {
            pits.splice(index, 1);
        }
    });

    coins.forEach((coin, index) => {
        coin.x -= coin.speed * difficulty;
        if (
            player.x < coin.x + coin.width &&
            player.x + PLAYER_WIDTH > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + PLAYER_HEIGHT > coin.y
        ) {
            spawnParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, 15);
            coins.splice(index, 1);
            player.flying = true;
            player.flyTimeLeft = 10 * 60;
            player.jumping = false;
            player.velocityY = 0;
        } else if (coin.x + coin.width < 0) {
            coins.splice(index, 1);
        }
    });

    score += 3;

    if (
        Math.random() < 0.02 * difficulty &&
        (!obstacles.length || obstacles[obstacles.length - 1].x < WIDTH - 200)
    ) {
        spawnObstacle();
    }

    if (
        Math.random() < 0.015 * difficulty &&
        (!platforms.length || platforms[platforms.length - 1].x < WIDTH - 300)
    ) {
        spawnPlatform();
    }

    if (
        Math.random() < 0.01 * difficulty &&
        (!pits.length || pits[pits.length - 1].x < WIDTH - 400)
    ) {
        spawnPit();
    }

    if (
        Math.random() < 0.005 * difficulty &&
        (!coins.length || coins[coins.length - 1].x < WIDTH - 400)
    ) {
        spawnCoin();
    }

    // Update particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.width = WIDTH;
canvas.height = HEIGHT;

spawnObstacle();
initializeBackground();

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameOver) {
        player.y = HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
        player.velocityY = 0;
        player.jumping = false;
        player.flying = false;
        player.flyTimeLeft = 0;
        player.frame = 0;
        obstacles = [];
        platforms = [];
        pits = [];
        coins = [];
        score = 0;
        gameOver = false;
        spawnObstacle();
        initializeBackground();
    } else if (!player.jumping && !player.flying) {
        player.velocityY = -20;
        player.jumping = true;
        spawnParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT, 10);
        jumpSound.currentTime = 0;
        jumpSound.play().catch(error => console.log("Jump sound error:", error));
    } else if (player.flying) {
        player.velocityY = -5;
    }
    if (!backgroundMusic.playing) {
        backgroundMusic.play().catch(error => console.log("Music error:", error));
        backgroundMusic.playing = true;
    }
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !player.jumping && !player.flying && !gameOver) {
        player.velocityY = -20;
        player.jumping = true;
        spawnParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT, 10);
        jumpSound.currentTime = 0;
        jumpSound.play().catch(error => console.log("Jump sound error:", error));
    } else if (e.code === 'Space' && player.flying) {
        player.velocityY = -5;
    }
    if (!backgroundMusic.playing) {
        backgroundMusic.play().catch(error => console.log("Music error:", error));
        backgroundMusic.playing = true;
    }
});

function startGame() {
    console.log("Game started, waiting for interaction to play music");
}

startGame();
gameLoop();