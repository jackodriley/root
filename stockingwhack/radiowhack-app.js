// le-app.js — Poquettewhack French game logic
// ------------------------------------------

// Firebase v9 modular imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setLogLevel
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.min.js';

// Inject SweetAlert2 default CSS
const swalCss = document.createElement('link');
swalCss.rel  = 'stylesheet';
swalCss.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
document.head.appendChild(swalCss);

// *** FILL IN your own project keys before deploying ***
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'pocketwang-a2d56.firebaseapp.com',
  projectId:         'pocketwang-a2d56',
  storageBucket:     'pocketwang-a2d56.appspot.com',
  messagingSenderId: '321549602257',
  appId:             'YOUR_APP_ID',
  measurementId:     'G-R6J2X0JHJW'
};

// Initialise Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
setLogLevel('error'); // reduce console noise

// -----------------------------------------------------
// SweetAlert2 wrapper
// -----------------------------------------------------
const popup = (txt) => {
  // Prevent the Chrome aria‑hidden warning by removing focus first
  if (document.activeElement) document.activeElement.blur();
  return Swal.fire({
    html: txt,
    background: '#ffffff',
    color: '#000000',
    confirmButtonColor: '#000000'
  });
};

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
const todayISO = (d = new Date()) => d.toISOString().split('T')[0];

const assignState = name => {
const options = ['🚫😮','📻😒','🔺🎵','🐺🚪','👶🅰️','💨👜','👀🤖'];
return options[Math.floor(Math.random() * options.length)];
  // '🚫😮','📻😒','🔺🎵','🐺🚪','👶🅰️','💨👜','👀🤖',
};

// Bonus day: 5 Aug 2025
const specialDates = {
  '2025-08-05': {
    message : 'Bonus day! You gain a pocket! New total: ',
    modifier: 1
  }
};

// Returns an array of winning entries for a given date
async function getWinnerForDate(dateStr){
  const snap = await getDocs(
    query(collection(db, 'entries'), where('date', '==', dateStr))
  );
  const entries = snap.docs.map(d => ({ ...d.data(), pockets: Number(d.data().pockets) }));
  const uniques = entries
    .filter(e => e.pockets > 0)
    .map(e => e.pockets)
    .filter((v, _, arr) => arr.indexOf(v) === arr.lastIndexOf(v));
  const winScore = uniques.length ? Math.min(...uniques) : null;
  return entries.filter(e => e.pockets === winScore && e.pockets > 0);
}

// -----------------------------------------------------
// Submit‑entry handler
// -----------------------------------------------------
document.getElementById('entryForm').addEventListener('submit', submitEntry);

async function submitEntry(e) {
  e.preventDefault();

  const nameInp    = document.getElementById('name');
  const pocketsInp = document.getElementById('pockets');

  const name    = nameInp.value.trim();
  let   pockets = Number(pocketsInp.value);
  const dateStr = todayISO();

  if (!name || isNaN(pockets)) return;

  const state = assignState(name);

  // Build (but don’t yet display) the base message
  let baseMsg;
if (specialDates[dateStr]) {
    pockets += specialDates[dateStr].modifier;
    baseMsg = specialDates[dateStr].message + pockets;
} else {
    const messages = [
        `Some people might be IN RAINBOWS, but ${name} is in clothes - clothes with ${pockets} to be precise. ${state}`,
        `Hey  ${name}, I hope you really do have ${pockets} pockets. Otherwise I'll have to call the KARMA POLICE! ${state}`,
        `${name}, I know there are NO SURPRISES for you here, but you have ${pockets}. ${state}`,
        `${name}, you CREEP. Enjoy your ${pockets}. ${state}`,
        `ANYONE CAN PLAY GUITAR but not anyone can have ${pockets} pockets, ${name}! ${state}`
    ];
    baseMsg = messages[Math.floor(Math.random() * messages.length)];
}

  // Play submit sound (non‑blocking)
  document.getElementById('submit-sound')?.play().catch(()=>{});

  // Write to Firestore
  try {
    await addDoc(collection(db, 'entries'), { name, pockets, date: dateStr, state });
    await refreshTables();
    // Check if the current entry is the lowest unique > 0 so far today
    const winnersToday = await getWinnerForDate(dateStr);
    const youWin = winnersToday.some(w => w.name === name && w.pockets === pockets);

    if (youWin) {
      const winTxt = "You JUST won!";
      showMessage(winTxt);            // updates div and shows SweetAlert
    } else {
      showMessage(baseMsg);
    }
  } catch (err) {
    console.error(err);
    showMessage('Erreur Firestore : ' + err.message);
  }

  // Reset form
  pocketsInp.value = '';
  nameInp.focus();
}

// -----------------------------------------------------
// Leaderboards
// -----------------------------------------------------
async function refreshTables() {
  await loadLeaderboard('todayLeaderboard', new Date());
  await loadLeaderboard('yesterdayLeaderboard', new Date(Date.now() - 86400000));
  await loadDailyWinners();
}

async function loadLeaderboard(tableId, dateObj) {
  const dateStr = todayISO(dateObj);
  const snap = await getDocs(query(collection(db, 'entries'), where('date', '==', dateStr)));

  const rows = snap.docs.map(d => ({ ...d.data(), pockets: Number(d.data().pockets) }));
  populateTable(tableId, rows);
}

function populateTable(tableId, entries) {
  const tbody = document.getElementById(tableId).querySelector('tbody');
  tbody.innerHTML = '';

  if (!entries.length) {
    tbody.innerHTML = '<tr><td colspan="3">No entries.</td></tr>';
    return;
  }

  // Determine lowest unique >0
  entries.sort((a, b) => a.pockets - b.pockets);
  const uniques = entries
    .filter(e => e.pockets > 0)
    .map(e => e.pockets)
    .filter((v, _, arr) => arr.indexOf(v) === arr.lastIndexOf(v));
  const winningScore = uniques.length ? Math.min(...uniques) : null;

  entries.forEach(entry => {
    const tr = tbody.insertRow();
    const nameCell    = tr.insertCell(0);
    const pocketsCell = tr.insertCell(1);
    const stateCell   = tr.insertCell(2);

    nameCell.textContent    = entry.name;
    pocketsCell.textContent = entry.pockets === 0 ? '0 (Nude)' : entry.pockets;
    stateCell.textContent   = entry.state || '---';

    if (entry.pockets === winningScore && entry.pockets > 0) {
      tr.classList.add('highlight');
      nameCell.classList.add('winner');
    }
  });
}

// -----------------------------------------------------
// Daily winners (historical)
// -----------------------------------------------------
async function loadDailyWinners() {
  const tbody = document.getElementById('winnersTable').querySelector('tbody');
  tbody.innerHTML = '';

  const snap = await getDocs(collection(db, 'entries'));
  const byDate = {};
  snap.forEach(doc => {
    const d = doc.data();
    const dateKey = d.date;
    if (!byDate[dateKey]) {
      byDate[dateKey] = [];
    }
    byDate[dateKey].push({ ...d, pockets: Number(d.pockets) });
  });

  const today = todayISO();
  const dates = Object.keys(byDate)
    .filter(d => d !== today && d >= '2025-07-29')
    .sort((a,b)=> new Date(b) - new Date(a));

  dates.forEach(date=>{
    const list = byDate[date];
    const uniques = list.filter(e=>e.pockets>0).map(e=>e.pockets)
      .filter((v,_,arr)=> arr.indexOf(v)===arr.lastIndexOf(v));
    const winning = uniques.length ? Math.min(...uniques) : null;
    const winners = list.filter(e=>e.pockets===winning && e.pockets>0);

    const tr = tbody.insertRow();
    tr.insertCell(0).textContent = date;
    if (winners.length){
      tr.insertCell(1).innerHTML = winners.map(w=>`<span class="winner">${w.name}</span>`).join(', ');
    } else {
      tr.insertCell(1).textContent = 'Losers only';
    }
  });
}

// -----------------------------------------------------
// Show a SweetAlert2 pop‑up only; keep the page clean
function showMessage(txt){
  popup(txt);
}

// Kick things off
refreshTables().catch(console.error);