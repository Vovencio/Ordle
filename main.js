// === Colors ===
const colorBG1 = '#1a1a1a';     // Main background
const colorBG2 = '#2a2a2a';     // Game area background
const colorTile = '#3a3a3a';    // Color of tiles
const colorText = '#ffe0f7';    // Text
const colorScore = '#ffb3d1';   // Score color
const colorWrong = '#ff4d6d';   // Incorrect
const colorCorrect = '#66e6a3'; // Correct
const colorMiss = '#1e1e1e';   // This letter is not in the word
const colorSpot = '#e6ac3b';   // Wrong spot
const colorMore = '#a3c572';   // Correct, but there are more of this letter
const colorWin = '#cc6699';   // Score color
const colorInfo = '#7aaacc';   // Info button color


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

let game = Array.from({ length: 6 }, () => Array(5).fill(' '));
let gameState = Array.from({ length: 6 }, () => Array(5).fill(0));

let score = 0;
let highScore = 0;

const squares = Array(60).fill(0);
let textY = 0;

let squareSize = 0;
let squaresDirty = true;

let noInput = 0;
let endAnimations = 0;

const infoButton = Array(4).fill(0);
let isInfo = false;

let letterStatus = Array(26).fill(0);


const letterChars = [
  'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
  'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
  'Z', 'X', 'C', 'V', 'B', 'N', 'M'
];
const buttons = Array(54).fill(0);

let goalWord = 'pound';
let currentLine = 0;
let currentWord = '';
let lastWord = '';

let midX = 0;
let midY = 0;

function saveGame() {
    const data = {
        game,
        gameState,
        score,
        highScore,
        letterStatus,
        goalWord,
        currentLine,
        lastWord
    };

    try {
        localStorage.setItem('wordGameSave', JSON.stringify(data));
        console.log('[DEBUG] Game saved.');
    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

function loadGame() {
    const dataStr = localStorage.getItem('wordGameSave');

    if (!dataStr) {
        console.warn('No saved game found.');
        return;
    }

    try {
        const data = JSON.parse(dataStr);

        if (
            Array.isArray(data.game) &&
            Array.isArray(data.gameState) &&
            Array.isArray(data.letterStatus) &&
            typeof data.score === 'number' &&
            typeof data.highScore === 'number' &&
            typeof data.goalWord === 'string' &&
            typeof data.currentLine === 'number' &&
            typeof data.lastWord === 'string'
        ) {
            game = data.game;
            gameState = data.gameState;
            letterStatus = data.letterStatus;
            score = data.score;
            highScore = data.highScore;
            goalWord = data.goalWord;
            currentLine = data.currentLine;
            lastWord = data.lastWord;

            console.log('Game loaded.');
        } else {
            console.error('Invalid save data format.');
        }
    } catch (e) {
        console.error('Failed to load game:', e);
    }
}

document.addEventListener('keydown', (event) => {
  const key = event.key;
  if (isInfo) return;

  if (/^[a-zA-Z]$/.test(key)) {
    addLetter(key.toUpperCase());
  } else if (key === 'Backspace' || key === 'Delete') {
    removeLetter();
  }
});

function addLetter(letter){
  if (currentWord.length < 5 && noInput < Date.now()){
    animateLetterPair(squares[currentWord.length*2+currentLine*10], squares[currentWord.length*2+1+currentLine*10], ' ' + letter, 10);
    currentWord += letter;
    updateCurrent();
  }
}

function removeLetter(){
  if (currentWord.length > 0 && noInput < Date.now()){
    animateLetterPair(squares[currentWord.length*2-2+currentLine*10], squares[currentWord.length*2+1-2+currentLine*10], currentWord[currentWord.length-1] + ' ', 10)
    currentWord = currentWord.slice(0, -1);
    updateCurrent();
  }
}

function updateCurrent(){
  let w = currentWord + '      ';
  for (let i = 0; i < 5; i++){
    game[currentLine][i] = w[i];
  }

  if (currentWord.length == 5){
    if (playerWords.includes(currentWord.toLowerCase())){
      submit(currentWord);
    }
  }
}

function submit(word){
  r = response(word);
  for (let i = 0; i<5; i++){
    gameState[currentLine][i] = r[i];
  }

  for (let i = 0; i<5; i++){
    if (r[i] == 3) continue;

    if (letterStatus[getLetterId(word[i])] != 2 && (letterStatus[getLetterId(word[i])] != 4 || r[i] == 2) && letterStatus[getLetterId(word[i])] != r[i]){
      animateLetterStatus(buttons[getLetterId(word[i])*2], buttons[getLetterId(word[i])*2+1], stateToColorR(letterStatus[getLetterId(word[i])]), stateToColorR(r[i]), letterChars[getLetterId(word[i])], 25);
      letterStatus[getLetterId(word[i])] = r[i];
    }
  }

  for (let i = 0; i<5; i++){
    if (r[i] != 3) continue;

    if (letterStatus[getLetterId(word[i])] != 2 && (letterStatus[getLetterId(word[i])] != 4 || r[i] == 2) && letterStatus[getLetterId(word[i])] != r[i]){
      animateLetterStatus(buttons[getLetterId(word[i])*2], buttons[getLetterId(word[i])*2+1], stateToColorR(letterStatus[getLetterId(word[i])]), stateToColorR(r[i]), letterChars[getLetterId(word[i])], 25);
      letterStatus[getLetterId(word[i])] = r[i];
    }
  }

  animateRow(currentLine);
  currentLine++;
  currentWord = '';

  if (word.toLowerCase() == goalWord){
    let points = 0;
    for (let i = 5; i > currentLine-2; i--){
      points += pointsOfRow(i);
    }

    lastWord = goalWord;
    setTimeout(() => {
      drawPoints(6-currentLine);
    }, 700);
    setTimeout(() => {
      wipeBoard();

      reset();
      currentWord = '';
      newWord();
      saveGame();

      animateScore(points, 75);
    }, 3500);
    noInput = Date.now() + 3000;
  }
  else if (currentLine === 6) {
    lastWord = goalWord;
    setTimeout(() => {
      drawLoss();
    }, 700);
    setTimeout(() => {
      wipeBoard();

      reset();
      currentWord = '';
      newWord();
      saveGame();
      animateScore(-score, 75);
    }, 3500);
    noInput = Date.now() + 3000;
  }
  else {
    filterWords();
    saveGame();
  }
}

function findWord(word) {
  if (!sysWords || !Array.isArray(sysWords)) {
    console.error('sysWords is not defined or not an array');
    return -1;
  }

  for (let i = 0; i < sysWords.length; i++) {
    if (word.toLowerCase() === sysWords[i].word.toLowerCase()) {
      return i;
    }
  }

  console.warn('Couldn’t find the word: ' + word);
  return -1;
}


function reset(){
  for (let i = 0; i < 6; i++){
    gameState[i].fill(0);
    game[i].fill(' ');
  }

for (let i = 0; i < 26; i++){
  animateLetterStatus(buttons[i*2], buttons[i*2+1], stateToColorR(letterStatus[i]), stateToColorR(0), letterChars[i], 25);
  letterStatus[i] = 0;
}

  currentLine = 0;
}

function filterWords(){
  let info = '';

  for (let i = 0; i < 5; i++){
    if (letterStatus[getLetterId(goalWord[i])] != 2 && letterStatus[getLetterId(goalWord[i])] != 4){
      info += ' ';
    }
    else {
      info += goalWord[i];
    }
  }

  let validLetters = [];

  for (let i = 0; i < playerWords.length; i++){
    let valid = true;
    for (let j = 0; j < 5; j++){
      if (info[j] == ' ') continue;
      if (playerWords[i][j] != info[j]){
        valid = false;
        break;
      }
    }
    if (valid){
      for (let j = 0; j < 5; j++){
        if (!validLetters.includes(playerWords[i][j].toUpperCase())){
          validLetters.push(playerWords[i][j].toUpperCase());
        }
      }
    }
  }

  for (let i = 0; i< 26; i++){
    if (!validLetters.includes(letterChars[i].toUpperCase())){
      if (letterStatus[i] == 0){
        animateLetterStatus(buttons[i*2], buttons[i*2+1], stateToColorR(letterStatus[i]), stateToColorR(1), letterChars[i], 25);
        letterStatus[i] = 1;
      }
    }
  }
}

function newWord(){
  const randomWord = sysWords[Math.floor(Math.random() * sysWords.length)].word;
  goalWord = randomWord;
}

function wipeBoard(){
  for (var row = 5; row > 4-5 ; row--) {
    let str = '     ';

    const rowDelay = 0;

    let delay = 0;
    let s = 0;
    for (let i = row*5*2; i < (row+1)*5*2; i+=2){
      animateWinThingy(squares[i], squares[i+1], (game[Math.floor((i)/5/2)][(i/2)%5] + str[s]).slice(-2), colorOfI(i), colorTile, 40+delay, true);
      game[Math.floor((i)/5/2)][(i/2)%5] = str[s];
      s++;
    }
  }
}

function pointsOfRow(row){
  return (row == 5) ? 5 : 5 - row;
}

function drawPoints(rows){
  for (var row = 5; row > 4-rows ; row--) {
    let str = ' +' + pointsOfRow(row) + '+ ';

    const rowDelay = 15;

    let delay = rowDelay*5-row*rowDelay;
    let s = 0;
    for (let i = row*5*2; i < (row+1)*5*2; i+=2){
      animateWinThingy(squares[i], squares[i+1], (game[Math.floor((i)/5/2)][(i/2)%5] + str[s]).slice(-2), colorOfI(i), colorWin, 25+delay);
      game[Math.floor((i)/5/2)][(i/2)%5] = str[s];
      gameState[Math.floor((i)/5/2)][(i/2)%5] = 10;
      delay += 3;
      s++;
    }
  }
}

function drawLoss(){
  for (var row = 0; row < 6 ; row++) {
    let str = goalWord.toUpperCase();

    const rowDelay = 15;

    let delay = rowDelay*5-row*rowDelay;
    let s = 0;
    for (let i = row*5*2; i < (row+1)*5*2; i+=2){
      animateWinThingy(squares[i], squares[i+1], (game[Math.floor((i)/5/2)][(i/2)%5] + str[s]).slice(-2), colorOfI(i), colorWrong, 25+delay);
      game[Math.floor((i)/5/2)][(i/2)%5] = str[s];
      gameState[Math.floor((i)/5/2)][(i/2)%5] = 9;
      delay += 3;
      s++;
    }
  }
}

document.addEventListener('fullscreenchange', () => {
    resizeCanvas();
});

let dpiScale = 1;

function resizeCanvas() {
    dpiScale = Math.max(window.devicePixelRatio || 1, dpiScale);

    if (/Mobi|Android/i.test(navigator.userAgent)) {
      dpiScale = Math.min(dpiScale, 1.5);
    }
    squaresDirty = true;

    const windowRatio = window.innerWidth / window.innerHeight;
    const targetRatio = 9 / 16;

    let renderWidth, renderHeight;

    if (windowRatio > targetRatio) {
        renderHeight = window.innerHeight;
        renderWidth = renderHeight * targetRatio;
    } else {
        renderWidth = window.innerWidth;
        renderHeight = renderWidth / targetRatio;
    }

    canvas.style.width = `${renderWidth}px`;
    canvas.style.height = `${renderHeight}px`;

    canvas.width = renderWidth * dpiScale;
    canvas.height = renderHeight * dpiScale;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(1, 1);

    midX = canvas.width / 2;
    midY = canvas.height / 2;
    squareSize = 0.176 * canvas.width;

    redraw();

    endAnimations = Date.now() + 25;
}


window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function stateToColorR(i){
  switch (i) {
    case 0:
      return colorTile;
    case 1:
      return colorMiss;
    case 2:
      return colorCorrect;
    case 3:
      return colorSpot;
    case 4:
      return colorMore;
    case 9:
      return colorWrong;
    case 10:
      return colorWin;
    default:
      console.log("Unknown Gamestate! " + gameState[i][j]);
      return colorWrong;
  }
}

function stateToColor(i, j){
  switch (gameState[i][j]) {
    case 0:
      return colorTile;
    case 1:
      return colorMiss;
    case 2:
      return colorCorrect;
    case 3:
      return colorSpot;
    case 4:
      return colorMore;
    case 9:
      return colorWrong;
    case 10:
      return colorWin;
    default:
      console.log("Unknown Gamestate! " + gameState[i][j]);
      return colorWrong;
  }
}

function animateScore(toAdd, currentDelay){
  if (currentDelay > 1 && toAdd != 0){
    let diff = (toAdd > 0) ? 1 : -1;

    score += diff;
    toAdd -= diff;
    currentDelay -= 1;
  }
  else if (toAdd != 0) {
    score += toAdd;
    toAdd = 0;
  }

  if (score > highScore) highScore = score;

  if (toAdd != 0) {
    setTimeout(() => {
      animateScore(toAdd, currentDelay);
    }, currentDelay);
  }
  else {
    saveGame();
  }

  if (!isInfo){
    drawScore();
  }
}

function changeScore(amount){
  score += amount;

  if (score > highScore){
    highScore = score;
  }
}

function redraw() {
  if (isInfo){
    drawInfo();
  }
  else {
    drawField();
  }
}

function drawInfo(){
  drawBox(colorBG1, 0, 0, canvas.width, canvas.height);

  let defs = (lastWord.length == 5) ? sysWords[findWord(lastWord)].definitions : ['Meanings for the last word will show up here after the game.', '- Vladi.'];
  let wrd = (lastWord.length == 5) ? lastWord : 'learn';

  let x = 0;
  let y = 0;


  // drawLetter(midX, canvas.width * 0.08, canvas.width * 0.14, lastWord.toUpperCase(), colorText);

  let w = canvas.width * 0.176;
  let m = canvas.width * 0.02;
  x = m;
  y = m;

  for (let i = 0; i < 5; i++){
    animateInfoThingy(x, y, ' ' + wrd[i].toUpperCase(), colorBG1, colorTile, 40+i*8);
    x+= 0.196*canvas.width;
  }
  y += 0.225*canvas.width;

  x = 0.02 * canvas.width;

  drawDefinitions(defs, x, y, canvas.width*(1-0.04), canvas.height * 0.98 - y , 7);
}

function drawDefinitions(definitions, x, y, w, h, max = 3) {
    const lineHeight = canvas.height * 0.041;
    const fontSize = Math.floor(canvas.height * 0.04);
    const verticalGap = canvas.height * 0.02; // gap between definitions

    ctx.font = fontSize + 'px mainFont';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let yy = y;
    let count = 0;

    for (let i = 0; i < definitions.length && count < max; i++) {
        const words = definitions[i].split(' ');
        const lines = [];
        let line = '';
        let prefix = `(${i + 1}): `;
        let isFirstLine = true;

        for (let j = 0; j < words.length; j++) {
            const word = words[j];
            const testLine = line + (isFirstLine ? prefix : '') + word + ' ';
            const testWidth = ctx.measureText(testLine).width;

            if (testWidth > w && line !== '') {
                lines.push((isFirstLine ? prefix : '') + line.trim());
                line = word + ' ';
                isFirstLine = false;
            } else {
                line += word + ' ';
            }
        }

        if (line !== '') {
            lines.push((isFirstLine ? prefix : '') + line.trim());
        }

        const blockHeight = lines.length * lineHeight;

        if (yy + blockHeight > y + h) return;

        ctx.fillStyle = colorBG2;
        ctx.fillRect(x, yy, w, blockHeight);

        ctx.fillStyle = colorText;
        for (let k = 0; k < lines.length; k++) {
            ctx.fillText(lines[k], x, yy + k * lineHeight);
        }

        yy += blockHeight + verticalGap;
        count++;
    }
}

function drawField(){
  drawBox(colorBG1, 0, 0, canvas.width, canvas.height);
  drawRoundedBox(colorBG2, 0, 0, canvas.width, canvas.width * 1.196, 0.176 * canvas.width / 5);

  let y = 0.02 * canvas.width;

  for (let j = 0; j < 6; j++) {
      let x = midX - 0.48 * canvas.width;
      for (let i = 0; i < 5; i++) {
          if (squaresDirty) {
            squares[(j*5+i)*2] = x;
            squares[(j*5+i)*2+1] = y;
          }

          if (gameState[j][i] == 10) {gameState[j][i] = 0;}
          drawRoundedBox(stateToColor(j, i), x, y, squareSize, squareSize, 0.176 * canvas.width / 5);
          drawLetter(x + squareSize / 2, y +squareSize / 2, squareSize * 0.9, game[j][i], colorText);
          x += 0.196 * canvas.width;
      }
      y += 0.196 * canvas.width;
  }

  if (squaresDirty) {
    textY = y;
    infoButton[0] = canvas.width*(1 - 0.176 - 0.02);
    infoButton[1] = y + 0.01 * canvas.width;
    infoButton[2] = canvas.width*(0.176);
    infoButton[3] = 0.04 * canvas.width;
  }
  drawScore();

  y += 0.06 * canvas.width;

  let x = midX - 0.48 * canvas.width;
  for (let i = 0; i < 10; i++) {
      if (squaresDirty){
        buttons[i*2] = x;
        buttons[i*2+1] = y;
      }
      drawRoundedBox(stateToColorR(letterStatus[i]), x, y, 0.078 * canvas.width, 0.078 * canvas.width * 2, 0.176 * canvas.width / 10);
      drawLetter(x + 0.078 * canvas.width / 2, y + 0.078 * canvas.width, 0.078 * canvas.width / 1.5, letterChars[i], colorText);
      x += 0.098 * canvas.width;
  }

  y += 0.176 * canvas.width;
  x = midX - 0.48 * canvas.width + (0.098 * canvas.width) / 2;
  for (let i = 0; i < 9; i++) {
    if (squaresDirty){
      buttons[(i+10)*2] = x;
      buttons[(i+10)*2+1] = y;
    }
      drawRoundedBox(stateToColorR(letterStatus[i+10]), x, y, 0.078 * canvas.width, 0.078 * canvas.width * 2, 0.176 * canvas.width / 10);
      drawLetter(x + 0.078 * canvas.width / 2, y + 0.078 * canvas.width, 0.078 * canvas.width / 1.5, letterChars[i + 10], colorText);
      x += 0.098 * canvas.width;
  }

  y += 0.176 * canvas.width;
  x = midX - 0.48 * canvas.width + (0.098 * canvas.width);
  for (let i = 0; i < 7; i++) {
    if (squaresDirty){
      buttons[(i+19)*2] = x;
      buttons[(i+19)*2+1] = y;
    }
      drawRoundedBox(stateToColorR(letterStatus[i+19]), x, y, 0.078 * canvas.width, 0.078 * canvas.width * 2, 0.176 * canvas.width / 10);
      drawLetter(x + 0.078 * canvas.width / 2, y + 0.078 * canvas.width, 0.078 * canvas.width / 1.5, letterChars[i + 19], colorText);
      x += 0.098 * canvas.width;
  }
  if (squaresDirty){
    buttons[52] = x;
    buttons[53] = y;
  }
  drawRoundedBox(colorTile, x, y, 0.176 * canvas.width, 0.078 * canvas.width * 2, 0.176 * canvas.width / 10);
  drawLetter(x + 0.176 * canvas.width / 2, y + 0.078 * canvas.width, 0.078 * canvas.width / 1.5, 'DEL', colorText);
  squaresDirty = false;
}

function getLetterId(c){
  for (let i = 0; i < 26; i++){
    if (letterChars[i].toUpperCase() == c.toUpperCase()){
      return i;
    }
  }
  console.log('Unknown letter: ' + c);
  return 0;
}

function drawScore(){
  drawBox(colorBG1, 0, textY, canvas.width, 0.06 * canvas.width);
  drawLetter(midX, textY + 0.03 * canvas.width, 0.05 * canvas.width, 'S: ' + score + ', HS: ' + highScore, colorScore);

  drawBox(colorWin, canvas.width*(1 - 0.176 - 0.02), textY + 0.01 * canvas.width, canvas.width*(0.176), 0.04 * canvas.width);
  drawLetter(canvas.width*(1 - 0.176 - 0.02) / 2 +canvas.width*(1 - 0.02) / 2 , textY + 0.03 * canvas.width , canvas.width*(0.04), 'Learn', colorScore);
}

function clickInfo(){
  if (noInput < Date.now()){
    isInfo = true;
    const fromSnap = getCanvasSnapshot();
    redraw();
    const toSnap = getCanvasSnapshot();
    noInput = Date.now() + 1100;
    endAnimations = Date.now() + 1100;

    const frames = 60;

    spinTransition(ctx, fromSnap, toSnap, frames);
  }
}

window.addEventListener('load', () => {
    document.fonts.ready.then(() => {
        loadGame();
        resizeCanvas();
    });
});

function isInBox(x, y, bx, by, bw, bh) {
    let sx = x * dpiScale; let sy = y * dpiScale;
    return sx >= bx-2 && sx <= bx + bw && sy >= by-2 && sy <= by + bh;
}

canvas.addEventListener('click', onClick);
function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    //redraw();
    //animateRow(1);

    if (isInfo && ! (noInput > Date.now())){
      isInfo = false;
      const fromSnap = getCanvasSnapshot();
      redraw();
      const toSnap = getCanvasSnapshot();
      noInput = Date.now() + 1100;
      endAnimations = Date.now() + 1100;

      const frames = 60;

      spinTransition(ctx, fromSnap, toSnap, frames);
    }
    else {
      for (let i = 0; i < 27; i++){
        if (i != 26 && isInBox(x, y, buttons[i*2], buttons[i*2+1], 0.078 * canvas.width, 0.078 * canvas.width * 2)) {
            addLetter(letterChars[i]);
        }
        else if (i === 26 && isInBox(x, y, buttons[i*2], buttons[i*2+1], 0.176 * canvas.width, 0.078 * canvas.width * 2)){
          removeLetter();
        }
      }

      if (isInBox(x, y, infoButton[0], infoButton[1], infoButton[2], infoButton[3])){
        clickInfo();
      }
    }
}

function countLetters(str) {
    const counts = Array(26).fill(0);
    const lower = str.toLowerCase();

    for (let char of lower) {
        const code = char.charCodeAt(0) - 97;
        if (code >= 0 && code < 26) {
            counts[code]++;
        }
    }

    return counts;
}

function response(word) {
    const r = Array(5).fill(1); // 1 = miss
    const goal = goalWord.toLowerCase();
    word = word.toLowerCase();

    const amountsGoal = countLetters(goal);

    for (let i = 0; i < 5; i++) {
        if (word[i] === goal[i]) {
            r[i] = 2; // 2 = hit
            amountsGoal[word.charCodeAt(i) - 97]--;
        }
    }

    for (let i = 0; i < 5; i++) {
        const code = word.charCodeAt(i) - 97;
        if (r[i] === 1 && amountsGoal[code] > 0) {
            r[i] = 3; // 3 = wrong spot
            amountsGoal[code]--;
        }
    }

    // In my version, I want to show that there are more of the same letters.
    for (let i = 0; i < 5; i++) {
      const code = word.charCodeAt(i) - 97;
        if (r[i] === 2 && amountsGoal[code] > 0) {
            r[i] = 4;
        }
    }

    return r;
}

function animateRow(row){
  let delay = 0;
  for (let i = row*5*2; i < (row+1)*5*2; i+=2){
    animateSquare(squares[i], squares[i+1], colorOfI(i), game[Math.floor((i)/5/2)][(i/2)%5], 25+delay);
    delay += 3;
  }
}

function colorOfI(i){
  return stateToColor(Math.floor((i)/5/2),(i/2)%5);
}

function drawText(text, x, y, w, h) {
    const lineHeight = canvas.height * 0.041;
    const words = text.split(' ');
    let line = '';
    let yy = y;

    ctx.font = Math.floor(canvas.height * 0.04) + 'px mainFont';
    ctx.fillStyle = colorText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > w && i > 0) {
            ctx.fillText(line, x, yy);
            line = words[i] + ' ';
            yy += lineHeight;
            if (yy - y > h - lineHeight) break;
        } else {
            line = testLine;
        }
    }

    if (yy - y <= h - lineHeight) {
        ctx.fillText(line, x, yy);
    }
}

function drawBox(color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawLetter(middleX, middleY, height, letter, color = '#000') {
    ctx.font = `${Math.round(height)}px mainFont`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, middleX, middleY);
}

function drawSquishedThingy(middleX, middleY, boxSize, height, letter, color = '#000', scaleY = 1) {
  if (endAnimations > Date.now()) return;

  drawBox(colorBG2, -boxSize/2+middleX-0.01*canvas.width, -boxSize/2+middleY-0.01*canvas.width, boxSize+0.02*canvas.width, boxSize+0.02*canvas.width);

    ctx.save();

    ctx.translate(middleX, middleY);
    ctx.scale(1, scaleY);

    drawRoundedBox(color, -boxSize/2, -boxSize/2, boxSize, boxSize, boxSize / 5);

    ctx.font = `${Math.round(height)}px mainFont`;
    ctx.fillStyle = colorText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 0);

    ctx.restore();
}

function drawLetterAnim(middleX, middleY, boxSize, height, letter, color = '#000', scaleY = 1) {
    if (endAnimations > Date.now()) return;

    drawBox(colorBG2, -boxSize/2+middleX-0.01*canvas.width, -boxSize/2+middleY-0.01*canvas.width, boxSize+0.02*canvas.width, boxSize+0.02*canvas.width);

    ctx.save();

    ctx.translate(middleX, middleY);

    ctx.scale(1, scaleY);

    drawRoundedBox(color, -boxSize/2, -boxSize/2, boxSize, boxSize, boxSize / 5);


    ctx.font = `${Math.round(height)}px mainFont`;
    ctx.fillStyle = colorText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 0);

    ctx.restore();
}

function drawAnimationSquare(x, y, color, symbol, t){
  let currentT = Math.min(1, t);

  let scale = Math.abs(Math.cos(Math.PI*currentT));
  let currentColor = (currentT>0.5) ? colorTile : color;

  drawSquishedThingy(x + squareSize / 2, y + squareSize / 2, squareSize, squareSize * 0.9, symbol, currentColor, scale);
}

function animateSquare(x, y, color, symbol, amountLeft) {
  if (amountLeft === -1 || isInfo) return;

  drawAnimationSquare(x, y, color, symbol, amountLeft / 25);
  requestAnimationFrame(() => animateSquare(x, y, color, symbol, amountLeft - 1));
}

function animateLetterStatus(x, y, colora, colorb, symbol, amountLeft) {
  if (amountLeft === -1 || isInfo) return;

  drawAnimationLetterStatus(x, y, colora, colorb, symbol, amountLeft / 25);
  requestAnimationFrame(() => animateLetterStatus(x, y, colora, colorb, symbol, amountLeft - 1));
}

function drawAnimationLetterStatus(x, y, colora, colorb, symbol, t){
  let currentT = Math.min(1, t);

  let scale = Math.abs(Math.cos(Math.PI*currentT));
  let currentColor = (currentT>0.5) ? colora : colorb;

  drawLetterStatus(x + 0.078 * canvas.width / 2, y + 0.078 * canvas.width, 0.078 * canvas.width, 0.078 * canvas.width / 1.5, symbol, currentColor, scale);
}

function drawLetterStatus(middleX, middleY, boxSize, height, letter, color = '#000', scaleY = 1) {
  if (endAnimations > Date.now()) return;

  drawBox(colorBG1, -boxSize/2+middleX-0.01*canvas.width, -boxSize+middleY-0.01*canvas.width, boxSize+0.02*canvas.width, boxSize*2+0.02*canvas.width);

    ctx.save();

    ctx.translate(middleX, middleY);
    ctx.scale(1, scaleY);

    drawRoundedBox(color, -boxSize/2, -boxSize, boxSize, boxSize*2,  0.176 * canvas.width / 10);

    ctx.font = `${Math.round(height)}px mainFont`;
    ctx.fillStyle = colorText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 0, 0);

    ctx.restore();
}


function drawRoundedBox(color, x, y, w, h, r = 10) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function drawAnimationLetterPair(x, y, text, t) {
  let currentT = Math.min(1, t);
  let scale = Math.abs(Math.cos(Math.PI * (currentT)));
  let symbol = (t > 0.5) ? text[0] : text[1];

  drawLetterAnim(x + squareSize / 2, y + squareSize / 2, squareSize, squareSize * 0.9, symbol, colorTile, scale);
}

function animateLetterPair(x, y, text, amountLeft) {
  if (amountLeft === -1 || isInfo) return;

  drawAnimationLetterPair(x, y, text, amountLeft / 10);
  requestAnimationFrame(() => animateLetterPair(x, y, text, amountLeft - 1));
}

function drawWinThingy(x, y, text, t, colora, colorb) {
  let currentT = Math.min(1, t);
  let scale = Math.abs(Math.cos(Math.PI * (currentT)));
  let symbol = (t > 0.5) ? text[0] : text[1];
  let currentColor = (t > 0.5) ? colora : colorb;

  drawLetterAnim(x + squareSize / 2, y + squareSize / 2, squareSize, squareSize * 0.9, symbol, currentColor, scale);
}

function animateWinThingy(x, y, text, colora, colorb, amountLeft, slow = false) {
  if (amountLeft < 0 || isInfo) return;

  let t = (slow) ? amountLeft / 40 : amountLeft / 10;

  drawWinThingy(x, y, text, t, colora, colorb);
  requestAnimationFrame(() => animateWinThingy(x, y, text, colora, colorb, amountLeft - 1, slow));
}

function drawInfoThingy(x, y, text, t, colora, colorb) {
  let currentT = Math.min(1, t);
  let scale = Math.abs(Math.cos(Math.PI * (currentT)));
  let symbol = (t > 0.5) ? text[0] : text[1];
  let currentColor = (t > 0.5) ? colora : colorb;

  drawLetterAnim(x + squareSize / 2, y + squareSize / 2, squareSize, squareSize * 0.9, symbol, currentColor, scale);
}

function animateInfoThingy(x, y, text, colora, colorb, amountLeft, slow = true) {
  if (amountLeft < 0 || !isInfo) return;

  let t = (slow) ? amountLeft / 40 : amountLeft / 10;

  drawInfoThingy(x, y, text, t, colora, colorb);
  requestAnimationFrame(() => {
    animateInfoThingy(x, y, text, colora, colorb, amountLeft - 1, slow);
  });
}

function getCanvasSnapshot() {
    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    const ctx = snapshot.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    return snapshot;
}

function spinTransition(ctx, fromImg, toImg, totalFrames = 40) {
    let frame = 0;

    function draw() {
        let t = frame / totalFrames;
        let scaleY = Math.abs(Math.cos(Math.PI * t));

        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;
        const img = (t < 0.5) ? fromImg : toImg;

        // ctx.imageSmoothingEnabled = false;

        if (scaleY > 0.01) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1, scaleY);
            ctx.translate(-cx, -cy);
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        frame++;
        if (frame <= totalFrames) {
            requestAnimationFrame(draw);
        } else {
            redraw(); // do not remove this!
        }
    }

    draw();
}



















let compressed = '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=';

var LZString=function(){var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module?module.exports=LZString:"undefined"!=typeof angular&&null!=angular&&angular.module("LZString",[]).factory("LZString",function(){return LZString});

let mapped = LZString.decompressFromBase64(compressed);

const reverseMap = {
  'A': ' ',
  'B': 'e',
  'C': 'o',
  'D': 'a',
  'E': 't',
  'F': 'r',
  'G': 's',
  'H': 'i',
  'I': 'n',
  'J': 'l',
  'K': 'h',
  'L': 'f',
  'M': 'u',
  'N': 'm',
  'O': '_',
  'P': 'd',
  'Q': 'p',
  'R': 'c',
  'S': 'g',
  'T': '.',
  'U': '+',
  'V': 'y',
  'W': 'b',
  'X': 'k',
  'Y': 'w',
  'Z': 'v',
  'a': 'T',
  'b': ',',
  'c': 'A',
  'd': ')',
  'e': '(',
  'f': ';',
  'g': 'I',
  'h': '-',
  'i': 'x',
  'j': 'j',
  'k': 'z',
  'l': 'q',
  'm': 'S',
  'n': '\'',
  'o': 'W',
  'p': 'C',
  'q': '1',
  'r': 'P',
  's': 'B',
  't': 'M',
  'u': 'F',
  'v': 'H',
  'w': 'E',
  'x': 'G',
  'y': 'R',
  'z': 'U',
  '0': 'O',
  '1': 'D',
  '2': '"',
  '3': 'L',
  '4': 'N',
  '5': '9',
  '6': '8',
  '7': '0',
  '8': 'Y',
  '9': '4',
  '+': '6',
  '/A': '3',
  '/B': '7',
  '/C': '5',
  '/D': '2',
  '/E': ':',
  '/F': 'V',
  '/G': 'J',
  '/H': '/',
  '/I': 'K',
  '/J': '`',
  '/K': '\n',
  '/L': 'X',
  '/M': 'Z',
  '/N': 'Q',
  '/O': '=',
  '/P': 'º',
  '/Q': '—',
  '/R': '✓',
  '/S': '♣',
  '/T': 'Δ',
  '/U': 'δ',
  '/V': '$',
  '/W': '°',
  '/X': 'Γ',
  '/Y': 'γ',
  '/Z': 'è',
  '/a': 'Κ',
  '/b': 'κ',
  '/c': '⁻',
  '/d': '⁶',
  '/e': '－',
  '/f': '[',
  '/g': ']',
  '/h': '!',
  '/i': 'Θ',
  '/j': 'θ',
  '/k': 'Þ',
  '/l': '‘',
  '/m': '’',
  '/n': '­',
};

function decodeMappedText(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '/') {
      const code = text.slice(i, i + 2);
      result += reverseMap[code] || code;
      i += 1;
    } else {
      result += reverseMap[text[i]] || text[i];
    }
  }
  return result;
}


const raw = decodeMappedText(mapped);

const entries = raw.split('_').filter(Boolean);

const sysWords = [];
const playerWords = [];

for (const entry of entries) {
    const parts = entry.split('+').map(s => s.trim()).filter(Boolean);

    if (parts.length === 0) continue;

    const word = parts[0];
    const definitions = parts.slice(1);

    playerWords.push(word);

    if (definitions.length > 0) {
        sysWords.push({
            word,
            definitions
        });
    }
}
