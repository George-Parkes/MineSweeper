class Cell {
  constructor(character) {
    this.character = character;
    this.revealed = false;
    this.flagged = false;
  }
}

// Create the EMPTY visible grid
function createEmptyGrid() {
  let size = 10 + 2; // two more than the grid
  let table = document.getElementById("game-board");
  for (let i = 1; i < size-1; i++) {
    let row = document.createElement('div');
    table.appendChild(row);
    for (let j = 1; j < (size)-1; j++) {
      let cell = document.createElement("BUTTON");
      cell.setAttribute("onclick", "startGame.call(this)");
      cell.setAttribute("class", "cell");
      cell.setAttribute("data-col", i);
      cell.setAttribute("data-row", j);
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

// loads empty grid on DOM load
document.addEventListener('DOMContentLoaded', (event) => {
  createEmptyGrid();
})

// FUNCTIONS TO CREATE BOARD DATA
const createBoardData = (x, y, size) => {
  let arr = new Array(size+2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array((size)+2);
  }
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      if (i == 0 || j == 0 || i == arr.length-1 || j == arr[i].length-1) {
        arr[i][j] = 'E'; // E for edge of board
      } else if (i == x && j == y) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (arr[i+dx][j+dy] != 'E') {
              arr[i+dx][j+dy] = new Cell('N');
            }
          }
        }
        arr[x][y].character = 0;
      }
    }
  }
  return arr
}

const populateBombs = (arr) => {
  for (let i = 1; i < arr.length-1; i++) {
    for (let j = 1; j < arr[i].length-1; j++) {
      if (Math.floor(Math.random() * 100) < 25 && !arr[i][j] && arr[i][j] != 'N') { //Set difficulty here
        arr[i][j] = new Cell('B');
      } else {
        arr[i][j] = new Cell(0)
      }
    }
  }
  return arr;
}

const setNumbers = (arr) => {
  for (let i = 1; i < arr.length-1; i++) {
    for (let j = 1; j < arr[i].length-1; j++) {
      let bombCount = 0;
      if (arr[i][j].character == 0) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (arr[i+dx][j+dy].character === 'B') {
              bombCount++;
            }
          }
        }
        arr[i][j].character = bombCount;
      }
    }
  }
  return arr;
}

// startGame() on first click
//   - this associates first click location with 0 values
//   - populates bombs everywhere else at random
//   - counts number squares

let board;

function startGame() {
  let x = parseInt(this.getAttribute('data-col'));
  let y = parseInt(this.getAttribute('data-row'));

  var gameBoard = document.getElementById('game-board');
  while (gameBoard.firstChild) gameBoard.removeChild(gameBoard.firstChild);

  board = createBoardData(x, y, 10);
  populateBombs(board);
  setNumbers(board);
  createTable(board);
  revealThisCells(x, y)
  // reveal original clicked square
  checkForZeroes(x, y);
}

function createTable(boardData) {
  let table = document.getElementById("game-board");
  for (let i = 1; i < boardData.length-1; i++) {
    let row = document.createElement('div');
    table.appendChild(row);
    for (let j = 1; j < boardData[i].length-1; j++) {
      let cell = document.createElement("BUTTON");
      cell.setAttribute("onclick", "clickedCell.call(this)");
      cell.setAttribute("class", "cell");
      cell.setAttribute("onauxclick", "flag.call(this)");
      cell.setAttribute("data-col", i);
      cell.setAttribute("data-row", j);
      row.appendChild(cell);
    }
  }
}

function clickedCell() {
  let x = parseInt(this.getAttribute('data-col'));
  let y = parseInt(this.getAttribute('data-row'));

  this.setAttribute('class', 'shadow');
  this.setAttribute('disabled', 'disabled');

  let cell = document.querySelector(`[data-col='${x}'][data-row='${y}']`)
  cell.innerHTML = board[x][y].character;
  board[x][y].revealed = true;
  checkForZeroes(x, y);
  checkLeftClickGameOver(x, y);
}

function flag() {
  let x = parseInt(this.getAttribute('data-col'));
  let y = parseInt(this.getAttribute('data-row'));
  if (!board[x][y].flagged) {
    board[x][y].flagged = true;
    this.innerHTML = 'F';
    this.removeAttribute('onclick');
  } else {
    board[x][y].flagged = false;
    this.innerHTML = '';
    this.setAttribute("onclick", "clickedCell.call(this)");
  }
  //check for win / lose conditions
  checkRightClickWin();
}

function checkForZeroes(x, y) {
  board[x][y].revealed = true;
  if (board[x][y].character == 0) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let cell = document.querySelector(`[data-col='${x+dx}'][data-row='${y+dy}']`)
        if (board[x+dx][y+dy]['character'] == 0 && cell.innerHTML == '') {
          revealThisCells(x+dx, y+dy);
          checkForZeroes(x+dx, y+dy)
        } else if (board[x+dx][y+dy]['character'] > 0 && cell.innerHTML == '') {
          revealThisCells(x+dx, y+dy);
        }
      }
    }
  }
}

function revealThisCells(x, y) {
  let cell = document.querySelector(`[data-col='${x}'][data-row='${y}']`)
  cell.innerHTML = board[x][y].character;
  cell.setAttribute('class', 'shadow');
  cell.setAttribute('disabled', 'disabled');
  board[x][y].revealed = true;
}

const checkLeftClickGameOver = (x, y) => {
  let bombRevealed = board
    .reduce((accumulator, currentValue) => {
        return accumulator.concat(currentValue)
    }, [])
    .filter(e => e.character == 'B')
    .some(e => e.revealed);

  let allNumsRevealed = board
    .reduce((accumulator, currentValue) => {
        return accumulator.concat(currentValue)
    }, [])
    .filter(e => typeof e.character == 'number')
    .every(e => e.revealed);

  if (bombRevealed) {
    // clicked bomb
    let clickedBomb = document.querySelector(`[data-col='${x}'][data-row='${y}']`)
    clickedBomb.setAttribute('class', 'bomb');
    // remaining bombs revealed
    for (let i = 1; i < board.length-1; i++) {
      for (let j = 1; j < board[i].length-1; j++) {

        let remainingCells = document.querySelector(`[data-col='${i}'][data-row='${j}']`)
        remainingCells.setAttribute('disabled', 'disabled');

        if (board[i][j].character == 'B' && !board.revealed) {    
          remainingCells.innerHTML = '<strong>B</strong>';
        }
      }
    }
    alert('You lose!')
  } else if (allNumsRevealed) {
    //victory!
    alert('You win! Well done!')
  }
}

const checkRightClickWin = () => {
  let allBombsFlagged = board
    .reduce((accumulator, currentValue) => {
        return accumulator.concat(currentValue)
    }, [])
    .filter(e => e.character == 'B')
    .every(e => e.flagged);

  let anyNumsFlagged = board
    .reduce((accumulator, currentValue) => {
        return accumulator.concat(currentValue)
    }, [])
    .filter(e => typeof e.character == 'number')
    .some(e => e.flagged);

  if (allBombsFlagged && !anyNumsFlagged) {
    alert('You win! Well done!');
  }
}