const grid = 30; // 基本方块大小保持为30像素
const tetrominoes = [
    { shape: [[1, 1, 1, 1]], color: 'cyan' },
    { shape: [[1, 1], [1, 1]], color: 'yellow' },
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }
];

let leftSpeed = 1.0;
let rightSpeed = 1.0;
let leftClearedLines = 0;
let rightClearedLines = 0;
let startTime;
let gameOver = false;

function updateSpeedDisplay() {
    document.getElementById('leftSpeed').textContent = `速度: ${leftSpeed.toFixed(1)}`;
    document.getElementById('rightSpeed').textContent = `速度: ${rightSpeed.toFixed(1)}`;
}

function showResult(winner) {
    const resultDiv = document.getElementById('result');
    const duration = Math.floor((Date.now() - startTime) / 1000);
    resultDiv.innerHTML = `
        对战结束！<br>
        持续时间: ${duration} 秒<br>
        左方消除行数: ${leftClearedLines}<br>
        右方消除行数: ${rightClearedLines}<br>
        <span class="winner">获胜方: ${winner}</span>
    `;
    resultDiv.style.display = 'block';
}

function createTetrisGame(canvasId, controls, speedId, nextBlockId, clearedId, nextBlockShapeId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    const nextBlockElement = document.getElementById(nextBlockId);
    const clearedElement = document.getElementById(clearedId);
    const nextBlockShapeCanvas = document.getElementById(nextBlockShapeId);
    const nextBlockShapeContext = nextBlockShapeCanvas.getContext('2d');

    let board = Array.from({ length: 22 }, () => Array(12).fill(0)); // 调整为22行和12列
    let tetromino = getRandomTetromino();
    let nextTetromino = getRandomTetromino(); // 初始化下一个方块
    let posX = 3, posY = 0;
    let gameOverLocal = false;

    function getRandomTetromino() {
        const { shape, color } = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
        return { shape, color };
    }

    function drawBoard() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    context.fillStyle = value;
                    context.fillRect(x * grid, y * grid, grid - 1, grid - 1);
                }
            });
        });
        drawTetromino();
    }

    function drawTetromino() {
        tetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    context.fillStyle = tetromino.color;
                    context.fillRect((posX + x) * grid, (posY + y) * grid, grid - 1, grid - 1);
                }
            });
        });
    }

    function drawNextBlockShape() {
        nextBlockShapeContext.clearRect(0, 0, nextBlockShapeCanvas.width, nextBlockShapeCanvas.height);
        nextTetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    nextBlockShapeContext.fillStyle = nextTetromino.color;
                    nextBlockShapeContext.fillRect(x * 20, y * 20, 19, 19);
                }
            });
        });
    }

    function moveTetromino(dir) {
        posX += dir;
        if (collision()) {
            posX -= dir;
        }
    }

    function dropTetromino() {
        posY++;
        if (collision()) {
            posY--;
            merge();
            resetTetromino();
            if (collision()) {
                gameOverLocal = true;
            }
        }
    }

    function rotateTetromino() {
        const rotatedShape = tetromino.shape[0].map((_, index) =>
            tetromino.shape.map(row => row[index]).reverse()
        );
        const originalShape = tetromino.shape;
        tetromino.shape = rotatedShape;
        if (collision()) {
            tetromino.shape = originalShape;
        }
    }

    function collision() {
        return tetromino.shape.some((row, y) => {
            return row.some((value, x) => {
                let newX = posX + x;
                let newY = posY + y;
                return value && (newY >= 22 || newX < 0 || newX >= 12 || board[newY][newX]); // 调整为22行和12列
            });
        });
    }

    function merge() {
        tetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[posY + y][posX + x] = tetromino.color;
                }
            });
        });
        clearRows();
    }

    function clearRows() {
        let linesCleared = 0;
        board = board.reduce((acc, row) => {
            if (row.every(cell => cell)) {
                acc.unshift(Array(12).fill(0)); // 调整为12列
                linesCleared++;
            } else {
                acc.push(row);
            }
            return acc;
        }, []);
        if (linesCleared > 0) {
            if (canvasId === 'leftGameCanvas') {
                leftClearedLines += linesCleared;
                rightSpeed *= 1.1; // 增加右方速度
            } else {
                rightClearedLines += linesCleared;
                leftSpeed *= 1.1; // 增加左方速度
            }
            clearedElement.textContent = `消除行数: ${canvasId === 'leftGameCanvas' ? leftClearedLines : rightClearedLines}`;
            updateSpeedDisplay();
        }
    }

    function resetTetromino() {
        tetromino = nextTetromino;
        nextTetromino = getRandomTetromino();
        posX = 3;
        posY = 0;
        drawNextBlockShape();
    }

    document.addEventListener('keydown', (event) => {
        if (gameOver || gameOverLocal) return;
        if (event.key === controls.left) {
            moveTetromino(-1);
        } else if (event.key === controls.right) {
            moveTetromino(1);
        } else if (event.key === controls.down) {
            dropTetromino();
        } else if (event.key === controls.rotate) {
            rotateTetromino();
        }
        drawBoard();
    });

    function gameLoop() {
        if (gameOver || gameOverLocal) {
            if (gameOverLocal) {
                gameOver = true;
                const winner = canvasId === 'leftGameCanvas' ? '右方' : '左方';
                showResult(winner);
            }
            context.fillStyle = 'black';
            context.font = '48px Arial';
            context.fillText('游戏结束', 25, canvas.height / 2);
            return;
        }
        dropTetromino();
        drawBoard();
        setTimeout(gameLoop, 1000 / (canvasId === 'leftGameCanvas' ? leftSpeed : rightSpeed));
    }

    // 初始绘制下一个方块
    drawNextBlockShape();
    gameLoop();
}

document.getElementById('startButton').addEventListener('click', () => {
    leftSpeed = 1.0;
    rightSpeed = 1.0;
    leftClearedLines = 0;
    rightClearedLines = 0;
    gameOver = false;
    document.getElementById('result').style.display = 'none';
    document.getElementById('leftCleared').textContent = '消除行数: 0';
    document.getElementById('rightCleared').textContent = '消除行数: 0';
    startTime = Date.now();
    createTetrisGame('leftGameCanvas', { left: 'z', down: 'x', right: 'c', rotate: 's' }, 'leftSpeed', 'leftNextBlock', 'leftCleared', 'leftNextBlockShape');
    createTetrisGame('rightGameCanvas', { left: 'ArrowLeft', down: 'ArrowDown', right: 'ArrowRight', rotate: 'ArrowUp' }, 'rightSpeed', 'rightNextBlock', 'rightCleared', 'rightNextBlockShape');
    updateSpeedDisplay();
});
