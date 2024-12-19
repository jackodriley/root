// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ5SEDfrvmAaGBjZTtHQ2L89jprhJ5QHk",
  authDomain: "pocketwang-a2d56.firebaseapp.com",
  projectId: "pocketwang-a2d56",
  storageBucket: "pocketwang-a2d56.appspot.com",
  messagingSenderId: "321549602257",
  appId: "1:321549602257:web:36c42c88de80a58eb4a4f0",
  measurementId: "G-R6J2X0JHJW"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game variables
let score = 0;
let lives = 3;
let gameInterval;
let pocketTimeouts = [];
let spawnInterval = 1600; // Slowed down by 30%
let spawnDecreaseRate = 25; // Decrease interval by 35ms every level
let minSpawnInterval = 600; // Minimum spawn interval
let pocketDisplayTime = 1600; // Slowed down by 30%
let displayDecreaseRate = 25; // Decrease display time by 35ms every level
let minDisplayTime = 650; // Minimum display time
let level = 1;
let gameStarted = false;

// Initialize game on window load
window.onload = function() {
  setupGrid();
  // Start the game when the start button is clicked
  document.getElementById('start-button').addEventListener('click', startGame);
  // Add event listener for the "Play Again" button
  document.getElementById('play-again-button').addEventListener('click', () => {
    // Reload the page
    window.location.reload();
  });
  // Load high scores on page load
  loadHighScores();
};

// Set up the game grid
function setupGrid() {
  const grid = document.getElementById('game-grid');
  // Create 5x5 grid cells
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    grid.appendChild(cell);
  }
}

// Start the game
function startGame() {
  // Hide the start button
  document.getElementById('start-button').style.display = 'none';

  // Play background music
  const backgroundMusic = document.getElementById('background-music');
  backgroundMusic.play().catch(error => {
    console.error('Background music playback failed:', error);
  });

  // Reset variables
  score = 0;
  lives = 3;
  level = 1;
  spawnInterval = 1600;
  pocketDisplayTime = 1600;
  pocketTimeouts = [];
  updateScoreboard();

  gameStarted = true;

  gameInterval = setInterval(spawnItem, spawnInterval);
}

// Spawn a pocket or potato at a random cell
function spawnItem() {
  if (!gameStarted) return;

  const cells = document.querySelectorAll('.grid-cell');
  const randomIndex = Math.floor(Math.random() * cells.length);
  const cell = cells[randomIndex];

  // If there's already an item in this cell, do nothing
  if (cell.querySelector('.pocket') || cell.querySelector('.potato')) return;

  // Decide whether to spawn a pocket or a potato
  const spawnPotato = Math.random() < 0.2; // 20% chance to spawn a potato

  if (spawnPotato) {
    // Spawn a potato
    const potato = document.createElement('div');
    potato.classList.add('potato');
    cell.appendChild(potato);

    const potatoImage = document.createElement('img');
    potatoImage.src = 'potato.png'; // Replace with your image URL
    potatoImage.style.width = '100%';
    potatoImage.style.height = '100%';
    potatoImage.style.objectFit = 'contain';
    potatoImage.style.cursor = 'pointer';
    potato.appendChild(potatoImage);

    // Add event listener to the potato image
    potatoImage.addEventListener('click', () => {
      // User loses a life
      cell.removeChild(potato);
      loseLife();

      // Play potato sound
      const potatoSound = new Audio('potato_sound.mp3'); // Replace with your sound file
      potatoSound.play().catch(error => {
        console.error('Potato sound playback failed:', error);
      });
    });

    // Remove the potato after display time
    const timeout = setTimeout(() => {
      if (cell.contains(potato)) {
        cell.removeChild(potato);
      }
    }, pocketDisplayTime);
    pocketTimeouts.push(timeout);

  } else {
    // Spawn a pocket
    const pocket = document.createElement('div');
    pocket.classList.add('pocket');
    cell.appendChild(pocket);

    const pocketImage = document.createElement('img');
    pocketImage.src = 'pocket.png'; // Replace with your image URL
    pocketImage.style.width = '100%';
    pocketImage.style.height = '100%';
    pocketImage.style.objectFit = 'contain';
    pocketImage.style.cursor = 'pointer';
    pocket.appendChild(pocketImage);

    // Add event listener to the pocket image
    pocketImage.addEventListener('click', () => {
      score++;
      cell.removeChild(pocket);
      updateScoreboard();

      // Play pocket click sound
      const pocketClickSound = document.getElementById('pocket-click-sound');
      pocketClickSound.currentTime = 0; // Reset to start
      pocketClickSound.play().catch(error => {
        console.error('Pocket click sound playback failed:', error);
      });
    });

    // Remove the pocket after display time
    const timeout = setTimeout(() => {
      if (cell.contains(pocket)) {
        cell.removeChild(pocket);
        missPocket();
      }
    }, pocketDisplayTime);
    pocketTimeouts.push(timeout);
  }

  // Increase difficulty over time
  increaseDifficulty();
}

// Increase game difficulty
function increaseDifficulty() {
  level++;
  // Decrease spawn interval
  if (spawnInterval > minSpawnInterval) {
    clearInterval(gameInterval);
    spawnInterval -= spawnDecreaseRate;
    gameInterval = setInterval(spawnItem, spawnInterval);
  }
  // Decrease pocket display time
  if (pocketDisplayTime > minDisplayTime) {
    pocketDisplayTime -= displayDecreaseRate;
  }
}

// Handle missing a pocket
function missPocket() {
  lives--;
  updateScoreboard();
  if (lives <= 0) {
    endGame();
  }
}

// Handle losing a life (e.g., clicking a potato)
function loseLife() {
  lives--;
  updateScoreboard();
  if (lives <= 0) {
    endGame();
  }
}

// Update scoreboard UI
function updateScoreboard() {
  document.getElementById('score').innerText = `Score: ${score}`;
  document.getElementById('lives').innerText = `Lives: ${lives}`;
}

// End the game
function endGame() {
  gameStarted = false;

  // Stop the game intervals and timeouts
  clearInterval(gameInterval);
  pocketTimeouts.forEach(timeout => clearTimeout(timeout));

  // Stop background music
  const backgroundMusic = document.getElementById('background-music');
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;

  // Show game over modal
  document.getElementById('final-score').innerText = score;
  document.getElementById('game-over-modal').style.display = 'block';

  // Check if the score is a high score
  checkHighScore(score);
}

// Check if the player's score is a high score
async function checkHighScore(playerScore) {
  // Fetch existing high scores
  const scoresRef = collection(db, 'highscores');
  const q = query(scoresRef, orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);

  const highScoresMap = {};
  let maxRealScore = 0;

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name !== 'Jack 🎂') {
      // Keep the highest score for each name
      if (!highScoresMap[data.name] || data.score > highScoresMap[data.name].score) {
        highScoresMap[data.name] = data;
      }
      if (data.score > maxRealScore) {
        maxRealScore = data.score;
      }
    }
  });

  // Convert highScoresMap to an array
  let highScores = Object.values(highScoresMap);

  // Add "Jack" at the top with score one higher than max real score
  const jackScore = maxRealScore + 1;
  const jackEntry = { name: 'Jack 🎂', score: jackScore };
  highScores.push(jackEntry);

  // Sort highScores by score descending
  highScores.sort((a, b) => b.score - a.score);

  // Limit to top 20 scores
  highScores = highScores.slice(0, 20);

  // Display high scores on the main screen (optional if you want to display here)
  // displayHighScores(highScores, 'highscore-table');

  // Determine if player's score is a high score
  const lowestScore = highScores[highScores.length - 1].score;
  if (playerScore > lowestScore || highScores.length < 20) {
    document.getElementById('highscore-section').style.display = 'block';
    document.getElementById('highscore-form').addEventListener('submit', submitHighScore);
  } else {
    document.getElementById('highscore-section').style.display = 'none';
  }
}

// Submit high score to Firebase
async function submitHighScore(e) {
  e.preventDefault();
  const playerName = document.getElementById('player-name').value.trim();
  if (playerName) {
    try {
      // Check if a high score already exists for this player
      const scoresRef = collection(db, 'highscores');
      const q = query(scoresRef, where('name', '==', playerName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // There is an existing score for this player
        const docRef = querySnapshot.docs[0].ref;
        const existingData = querySnapshot.docs[0].data();

        if (score > existingData.score) {
          // Update the score
          await updateDoc(docRef, { score: score });
          alert('High score updated!');
        } else {
          alert('You did not beat your previous high score.');
        }
      } else {
        // No existing score, add new
        await addDoc(scoresRef, {
          name: playerName,
          score: score
        });
        alert('High score submitted!');
      }
      document.getElementById('highscore-form').reset();
      document.getElementById('highscore-section').style.display = 'none';
      // Refresh high scores
      loadHighScores();
    } catch (error) {
      console.error('Error adding/updating high score: ', error);
    }
  }
}

// Load and display high scores
async function loadHighScores() {
  const scoresRef = collection(db, 'highscores');
  const q = query(scoresRef, orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);

  const highScoresMap = {};
  let maxRealScore = 0;

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name !== 'Jack') {
      // Keep the highest score for each name
      if (!highScoresMap[data.name] || data.score > highScoresMap[data.name].score) {
        highScoresMap[data.name] = data;
      }
      if (data.score > maxRealScore) {
        maxRealScore = data.score;
      }
    }
  });

  // Convert highScoresMap to an array
  let highScores = Object.values(highScoresMap);

  // Add "Jack" at the top with score one higher than max real score
  const jackScore = maxRealScore + 1;
  const jackEntry = { name: 'Jack', score: jackScore };
  highScores.push(jackEntry);

  // Sort highScores by score descending
  highScores.sort((a, b) => b.score - a.score);

  // Limit to top 20 scores
  highScores = highScores.slice(0, 20);

  // Display high scores on the main screen
  displayHighScores(highScores, 'highscore-table');
}

// Display high scores in the table
function displayHighScores(highScores, tableId) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = '';
  highScores.forEach((scoreData, index) => {
    const row = tbody.insertRow();
    const rankCell = row.insertCell(0);
    const nameCell = row.insertCell(1);
    const scoreCell = row.insertCell(2);

    rankCell.innerText = index + 1;
    nameCell.innerText = scoreData.name;
    scoreCell.innerText = scoreData.score;
  });
}