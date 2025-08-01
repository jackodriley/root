import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.min.js';

// -- Firebase config (fill in your keys) --
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'pocketwang-a2d56.firebaseapp.com',
  projectId: 'pocketwang-a2d56',
  storageBucket: 'pocketwang-a2d56.appspot.com',
  messagingSenderId: '321549602257',
  appId: 'YOUR_APP_ID',
  measurementId: 'G-R6J2X0JHJW'
};

// initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game state
let playerName = '';
let distance = 0;
const finishDist = 100;
let startTime = 0;
let lettuceDir = 1;
let lettucePos = 0; // 0 = bottom, 1 = top
let animFrame;

let lowerBound = 0, upperBound = 1;

// Elements
const snailEl = document.getElementById('snail');
const meterEl = document.getElementById('meter');
const lettuceEl = document.getElementById('lettuce');
const btn = document.getElementById('tapButton');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restartButton');
const containerEl = document.getElementById('gameContainer');
let lettuceSpeed = 0.01;
let timerInterval;
let gameStarted = false;
const tapCooldown = 700; // milliseconds

// ask name
await Swal.fire({
  title: 'Votre Nom?',
  input: 'text',
  inputPlaceholder: 'Entrez votre nom',
  allowOutsideClick: false,
  preConfirm: name => name && name.trim()
}).then(res => { playerName = res.value || 'Anonyme'; });

// animate lettuce
function animateLettuce() {
  lettucePos += lettuceDir * lettuceSpeed;
  if (lettucePos >= upperBound) {
    lettucePos = upperBound;
    lettuceDir = -1;
    lowerBound = Math.random() * 0.6; // between 0 and 60%
    lettuceSpeed = 0.005 + Math.random() * 0.015;
  } else if (lettucePos <= lowerBound) {
    lettucePos = lowerBound;
    lettuceDir = 1;
    upperBound = 0.4 + Math.pow(Math.random(), 0.5) * 0.6; // bias towards higher
    lettuceSpeed = 0.005 + Math.random() * 0.015;
  }
  lettuceEl.style.top = `${(1 - lettucePos) * 100}%`;
  animFrame = requestAnimationFrame(animateLettuce);
}
animateLettuce();

// tap handler
btn.addEventListener('click', async () => {
  if (!gameStarted) {
    gameStarted = true;
    btn.textContent = 'TAP!';
    startTime = Date.now();
    // start visual timer
    timerInterval = setInterval(() => {
      const now = Date.now();
      timerEl.textContent = ((now - startTime) / 1000).toFixed(2) + 's';
    }, 100);
  }
  if (lettucePos >= 0.5) {
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; }, tapCooldown);
    return;
  }
  // compute move: min 2 , max 8
  const move = 2 + (1 - lettucePos) * 6;
  distance += move;
  // update snail
  const pct = Math.min(distance / finishDist, 1) * 80; // move up to 80vw
  snailEl.style.left = `${pct}vw`;

  // scroll background proportional to distance
  containerEl.style.backgroundPositionX = `${-distance * 4}px`;

  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, tapCooldown);

  if (distance >= finishDist) {
    cancelAnimationFrame(animFrame);
    clearInterval(timerInterval);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    // finish alert
    await Swal.fire({
      title: 'Terminé!',
      text: `Temps: ${elapsed}s`,
      confirmButtonText: 'Envoyer Score',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(async () => {
      // submit to Firebase
      await addDoc(collection(db, 'scores'), { name: playerName, time: Number(elapsed) });
      // get top 15
      const q = query(collection(db, 'scores'), orderBy('time', 'asc'), limit(15));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => d.data());
      const html = rows.map((r, i) => {
        let medal = '';
        if (i === 0) medal = ' 🥇';
        else if (i === 1) medal = ' 🥈';
        else if (i === 2) medal = ' 🥉';
        return `<p>${i+1}. ${r.name}: ${r.time}s${medal}</p>`;
      }).join('');
      Swal.fire({ title: 'Leaderboard', html });
      restartBtn.hidden = false;
      btn.hidden = true;
    });
  }
});

restartBtn.addEventListener('click', () => {
  // reset state
  distance = 0;
  startTime = 0;
  gameStarted = false;
  timerEl.textContent = '0.00s';
  snailEl.style.left = '0%';
  containerEl.style.backgroundPositionX = `0px`;
  btn.textContent = 'Start';
  btn.hidden = false;
  restartBtn.hidden = true;
  // re-enable button
  btn.disabled = false;
  // restart lettuce animation if needed
  animateLettuce();
});
