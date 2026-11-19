const gameArea = document.getElementById("gameArea");
const basket = document.getElementById("basket");

const scoreDisplay = document.getElementById("score");
const missedDisplay = document.getElementById("missed");
const bestDisplay = document.getElementById("best");
const timerDisplay = document.getElementById("timer");

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const gameMessage = document.getElementById("gameMessage");
const gameDescription = document.getElementById("gameDescription");

let score = 0;
let missed = 0;
let best = Number(localStorage.getItem("poopBest")) || 0;

let basketX = 0;
let targetX = null;

let poops = [];
let flies = [];
let goldenPoops = [];

let gameRunning = false;

let gameLoop;
let poopSpawner;
let flySpawner;
let goldenSpawner;
let timerInterval;

let moveLeft = false;
let moveRight = false;

let timeLeft = 60;

let difficultyLevel = 0;

bestDisplay.textContent = best;


// START GAME
function startGame() {
    score = 0;
    missed = 0;
    timeLeft = 60;
    difficultyLevel = 0;

    poops = [];
    flies = [];
    goldenPoops = [];

    gameRunning = true;

    scoreDisplay.textContent = score;
    missedDisplay.textContent = missed;
    timerDisplay.textContent = timeLeft;

    document.querySelectorAll(".fruit, .fly, .splash, .golden-poop").forEach(item => {
        item.remove();
    });

    overlay.style.display = "none";

    basketX = (gameArea.clientWidth - basket.offsetWidth) / 2;
    basket.style.left = basketX + "px";

    moveLeft = false;
    moveRight = false;
    targetX = null;

    clearInterval(gameLoop);
    clearInterval(poopSpawner);
    clearInterval(flySpawner);
    clearInterval(goldenSpawner);
    clearInterval(timerInterval);

    gameLoop = setInterval(updateGame, 20);
    goldenSpawner = setInterval(createGoldenPoop, 8000);
    poopSpawner = setInterval(createPoop, 900);
    flySpawner = setInterval(createFly, 2500);

    timerInterval = setInterval(function() {
    if (!gameRunning) return;

    timeLeft--;
    timerDisplay.textContent = timeLeft;

    // INCREASE DIFFICULTY EVERY 15 SECONDS
    const newLevel = Math.floor((60 - timeLeft) / 15);

    if (newLevel > difficultyLevel) {
        difficultyLevel = newLevel;

            // CHANGE SPAWNING SPEED
            const poopIntervals = [900, 750, 600, 450];
            const flyIntervals = [2500, 2000, 1500, 1000];

            clearInterval(poopSpawner);
            clearInterval(flySpawner);

            poopSpawner = setInterval(
                createPoop,
                poopIntervals[difficultyLevel]
            );  

            flySpawner = setInterval(
                createFly,
                flyIntervals[difficultyLevel]
            );
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}


// CREATE FALLING POOP
function createPoop() {
    if (!gameRunning) return;

    const poop = document.createElement("div");

    poop.classList.add("fruit");
    poop.textContent = "💩";

    const x = Math.random() * (gameArea.clientWidth - 30);

    poop.style.left = x + "px";
    poop.style.top = "0px";

    gameArea.appendChild(poop);

    poops.push({
        element: poop,
        x: x,
        y: 0,
        speed: 2 + Math.random() * 2 + (difficultyLevel * 1.5)
    });
}


// CREATE FALLING GOLDEN POOP (rare, worth 50 points)
function createGoldenPoop() {
    if (!gameRunning) return;

    const golden = document.createElement("img");

    golden.src = "golden-poop.svg";
    golden.alt = "Golden poop";
    golden.classList.add("golden-poop");

    const x = Math.random() * (gameArea.clientWidth - 45);

    golden.style.left = x + "px";
    golden.style.top = "0px";

    gameArea.appendChild(golden);

    goldenPoops.push({
        element: golden,
        x: x,
        y: 0,
        speed: 3 + Math.random() * 2 + (difficultyLevel * 1.2)
    });
}


// CREATE FALLING FLY
function createFly() {
    if (!gameRunning) return;

    const fly = document.createElement("div");

    fly.classList.add("fly");
    fly.textContent = "🪰";

    const x = Math.random() * (gameArea.clientWidth - 30);

    fly.style.left = x + "px";
    fly.style.top = "0px";

    gameArea.appendChild(fly);

    flies.push({
        element: fly,
        x: x,
        y: 0,
        speed: 2 + Math.random() * 2 + (difficultyLevel * 1.2)
    });
}


// SHOW SPLASH ANIMATION
function showSplash(x, y) {
    const splash = document.createElement("div");

    splash.classList.add("splash");
    splash.textContent = "💦";

    splash.style.left = x + "px";
    splash.style.top = y + "px";

    gameArea.appendChild(splash);

    setTimeout(function() {
        splash.remove();
    }, 600);
}

// SHOW TOILET DAMAGE EFFECT
function showDamageEffect() {
    basket.classList.remove("damage");

    // Restart animation
    void basket.offsetWidth;

    basket.classList.add("damage");
}

// UPDATE GAME
function updateGame() {
    if (!gameRunning) return;

    // MOVE BASKET
    if (moveLeft) {
        basketX -= 6;
        targetX = null;
    }

    if (moveRight) {
        basketX += 6;
        targetX = null;
    }

    // SMOOTHLY FOLLOW FINGER / MOUSE
    if (targetX !== null) {
        basketX += (targetX - basketX) * 0.35;
    }

    basketX = Math.max(
        0,
        Math.min(
            gameArea.clientWidth - basket.offsetWidth,
            basketX
        )
    );

    basket.style.left = basketX + "px";


    // BASKET POSITION
    const basketLeft = basketX;
    const basketRight = basketX + basket.offsetWidth;
    const basketTop = basket.offsetTop;


    // UPDATE FALLING POOP
    for (let i = poops.length - 1; i >= 0; i--) {
        const poop = poops[i];

        poop.y += poop.speed;

        poop.element.style.top = poop.y + "px";

        const poopLeft = poop.x;
        const poopRight = poop.x + poop.element.offsetWidth;
        const poopBottom = poop.y + poop.element.offsetHeight;


        // CHECK IF POOP IS CAUGHT
        if (
            poopBottom >= basketTop &&
            poopRight > basketLeft &&
            poopLeft < basketRight
        ) {
            score += 10;
            scoreDisplay.textContent = score;

            showSplash(poop.x, basketTop - 15);

            poop.element.remove();
            poops.splice(i, 1);
        }

        // CHECK IF POOP IS MISSED
        else if (poop.y > gameArea.clientHeight) {
            missed++;
            missedDisplay.textContent = missed;

            poop.element.remove();
            poops.splice(i, 1);

            if (missed >= 5) {
                endGame();
                return;
            }
        }
    }


    // UPDATE FALLING GOLDEN POOP
    for (let i = goldenPoops.length - 1; i >= 0; i--) {
        const golden = goldenPoops[i];

        golden.y += golden.speed;

        golden.element.style.top = golden.y + "px";

        const goldenRight = golden.x + golden.element.offsetWidth;
        const goldenBottom = golden.y + golden.element.offsetHeight;

        // CHECK IF GOLDEN POOP IS CAUGHT
        if (
            goldenBottom >= basketTop &&
            goldenRight > basketLeft &&
            golden.x < basketRight
        ) {
            score += 50;
            scoreDisplay.textContent = score;

            showSplash(golden.x, basketTop - 15);

            golden.element.remove();
            goldenPoops.splice(i, 1);
        }

        // NO PENALTY IF A GOLDEN POOP IS MISSED
        else if (golden.y > gameArea.clientHeight) {
            golden.element.remove();
            goldenPoops.splice(i, 1);
        }
    }


    // UPDATE FLY MOVEMENT
    for (let i = flies.length - 1; i >= 0; i--) {
        const fly = flies[i];

        // MOVE FLY STRAIGHT DOWN
        fly.y += fly.speed;

        fly.element.style.top = fly.y + "px";

        // CHECK IF FLY LANDS ON THE TOILET
        if (
            fly.y + fly.element.offsetHeight >= basketTop &&
            fly.y <= basketTop + basket.offsetHeight &&
            fly.x + fly.element.offsetWidth >= basketLeft &&
            fly.x <= basketRight
        ) {
            score = Math.max(0, score - 10);
            scoreDisplay.textContent = score;

            showDamageEffect();

            fly.element.remove();
            flies.splice(i, 1);
        }

        // REMOVE FLY ONLY WHEN IT REACHES THE BOTTOM
        else if (fly.y > gameArea.clientHeight) {
            fly.element.remove();
            flies.splice(i, 1);
        }
    }
}


// END GAME
function endGame() {
    if (!gameRunning) return;

    gameRunning = false;

    clearInterval(gameLoop);
    clearInterval(poopSpawner);
    clearInterval(flySpawner);
    clearInterval(goldenSpawner);
    clearInterval(timerInterval);

    if (score > best) {
        best = score;

        localStorage.setItem("poopBest", best);
        bestDisplay.textContent = best;
    }

    if (timeLeft <= 0) {
        gameMessage.textContent = "TIME'S UP!";
    } else {
        gameMessage.textContent = "GAME OVER!";
    }

    gameDescription.textContent = "Your final score: " + score;

    startButton.textContent = "PLAY AGAIN";

    overlay.style.display = "flex";
}


// KEYBOARD CONTROLS
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") {
        moveLeft = true;
        event.preventDefault();
    }

    if (event.key === "ArrowRight") {
        moveRight = true;
        event.preventDefault();
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft") {
        moveLeft = false;
    }

    if (event.key === "ArrowRight") {
        moveRight = false;
    }
});


// MOUSE AND TOUCH CONTROLS
function setTargetFromPointer(event) {
    const rect = gameArea.getBoundingClientRect();

    targetX = event.clientX - rect.left - basket.offsetWidth / 2;

    targetX = Math.max(
        0,
        Math.min(
            gameArea.clientWidth - basket.offsetWidth,
            targetX
        )
    );
}

gameArea.addEventListener("pointerdown", function(event) {
    if (!gameRunning) return;

    // Keep receiving moves even if the finger drifts outside the game area
    gameArea.setPointerCapture(event.pointerId);

    setTargetFromPointer(event);
});

gameArea.addEventListener("pointermove", function(event) {
    if (!gameRunning) return;

    setTargetFromPointer(event);
});


// START BUTTON
startButton.addEventListener("click", startGame);
