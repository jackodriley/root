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

// Elements
const snailEl = document.getElementById('snail');
const meterEl = document.getElementById('meter');
const lettuceEl = document.getElementById('lettuce');
const btn = document.getElementById('tapButton');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restartButton');
let timerInterval;
let gameStarted = false;
const tapCooldown = 300; // milliseconds

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
  lettucePos += lettuceDir * 0.01;
  if (lettucePos >= 1 || lettucePos <= 0) lettuceDir *= -1;
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
  // compute move: min 2 , max 8
  const move = 2 + (1 - lettucePos) * 6;
  distance += move;
  // update snail
  const pct = Math.min(distance / finishDist, 1) * 80; // move up to 80vw
  snailEl.style.left = `${pct}vw`;

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
      confirmButtonText: 'Envoyer Score'
    }).then(async () => {
      // submit to Firebase
      await addDoc(collection(db, 'scores'), { name: playerName, time: Number(elapsed) });
      // get top 5
      const q = query(collection(db, 'scores'), orderBy('time', 'asc'), limit(5));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => d.data());
      const html = rows.map(r => `<p>${r.name}: ${r.time}s</p>`).join('');
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
  btn.textContent = 'Start';
  btn.hidden = false;
  restartBtn.hidden = true;
  // re-enable button
  btn.disabled = false;
  // restart lettuce animation if needed
  animateLettuce();
});
