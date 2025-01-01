const BOARD_SIZE = 10;
const NUM_MINES = 10;

let board = [];
let mines = new Set();
let flags = new Set();
let mode = 'reveal'; // 'reveal' or 'flag'
let touchTimer;

function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    board = [];
    mines = new Set();
    flags = new Set();

    for (let i = 0; i < BOARD_SIZE; i++) {
        const row = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick);
            cell.addEventListener('touchstart', handleTouchStart);
            cell.addEventListener('touchend', handleTouchEnd);
            boardElement.appendChild(cell);
            row.push(cell);
        }
        board.push(row);
    }

    placeMines();
    updateMinesRemaining();
    document.getElementById('game-status').textContent = '';
}

function placeMines() {
    while (mines.size < NUM_MINES) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        mines.add(`${row}-${col}`);
    }
}

function handleCellClick(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (mode === 'reveal') {
        if (cell.classList.contains('flagged')) {
            return;
        }

        if (mines.has(`${row}-${col}`)) {
            cell.classList.add('mine');
            alert('Game Over!');
            revealAllMines();
        } else {
            revealCell(row, col);
        }
    } else if (mode === 'flag') {
        if (!cell.classList.contains('revealed')) {
            cell.classList.toggle('flagged');
            if (cell.classList.contains('flagged')) {
                flags.add(`${row}-${col}`);
            } else {
                flags.delete(`${row}-${col}`);
            }
            updateMinesRemaining();
        }
    }

    checkWin();
}

function handleCellRightClick(event) {
    event.preventDefault();
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (!cell.classList.contains('revealed')) {
        cell.classList.toggle('flagged');
        if (cell.classList.contains('flagged')) {
            flags.add(`${row}-${col}`);
        } else {
            flags.delete(`${row}-${col}`);
        }
        updateMinesRemaining();
    }

    // Switch to reveal mode on right click
    document.querySelector('input[value="reveal"]').checked = true;
    mode = 'reveal';

    checkWin();
}

function handleTouchStart(event) {
    const cell = event.target;
    touchTimer = setTimeout(() => {
        if (!cell.classList.contains('revealed')) {
            cell.classList.toggle('flagged');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            if (cell.classList.contains('flagged')) {
                flags.add(`${row}-${col}`);
            } else {
                flags.delete(`${row}-${col}`);
            }
            updateMinesRemaining();
        }
    }, 500); // 500ms for long press
}

function handleTouchEnd(event) {
    clearTimeout(touchTimer);
}

function revealCell(row, col) {
    const cell = board[row][col];
    if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) {
        return;
    }

    cell.classList.add('revealed');

    let mineCount = 0;
    for (let i = Math.max(0, row - 1); i <= Math.min(BOARD_SIZE - 1, row + 1); i++) {
        for (let j = Math.max(0, col - 1); j <= Math.min(BOARD_SIZE - 1, col + 1); j++) {
            if (mines.has(`${i}-${j}`)) {
                mineCount++;
            }
        }
    }

    if (mineCount > 0) {
        cell.textContent = mineCount;
    } else {
        for (let i = Math.max(0, row - 1); i <= Math.min(BOARD_SIZE - 1, row + 1); i++) {
            for (let j = Math.max(0, col - 1); j <= Math.min(BOARD_SIZE - 1, col + 1); j++) {
                revealCell(i, j);
            }
        }
    }
}

function revealAllMines() {
    mines.forEach(mine => {
        const [row, col] = mine.split('-');
        board[row][col].classList.add('mine');
    });
}

function updateMinesRemaining() {
    const remaining = NUM_MINES - flags.size;
    document.getElementById('mines-count').textContent = remaining;
}

function checkWin() {
    let allRevealed = true;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = board[i][j];
            if (!cell.classList.contains('revealed') && !cell.classList.contains('flagged')) {
                allRevealed = false;
                break;
            }
        }
    }

    if (allRevealed) {
        let allMinesFlagged = true;
        mines.forEach(mine => {
            if (!flags.has(mine)) {
                allMinesFlagged = false;
            }
        });

        if (allMinesFlagged) {
            document.getElementById('game-status').textContent = '扫雷成功！';
        }
    }
}

document.getElementById('reset').addEventListener('click', createBoard);

document.querySelectorAll('input[name="mode"]').forEach(input => {
    input.addEventListener('change', (event) => {
        mode = event.target.value;
    });
});

createBoard();