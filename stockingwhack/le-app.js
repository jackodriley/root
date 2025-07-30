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
    html: '🥖 ' + txt,
    background: '#ffffff',
    color: '#002366',
    confirmButtonColor: '#d60000', // French red
    customClass: { popup: 'baguette-popup' }
  });
};

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
const todayISO = (d = new Date()) => d.toISOString().split('T')[0];

const assignState = name => {
  const n = name.toLowerCase();
  if (n === 'danny') return 'mauvais';
  if (n === 'dan')   return 'bon';
  return Math.random() < 0.5 ? 'mauvais' : 'bon';
};

// Bonus day: 5 Aug 2025
const specialDates = {
  '2025-08-05': {
    message : "C'est la fête des quarante ! Vive la France ! Vous gagnez une poquette ! Nouveau total : ",
    modifier: 1
  }
};

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

  if (specialDates[dateStr]) {
    pockets += specialDates[dateStr].modifier;
    showMessage(specialDates[dateStr].message + pockets);
  } else {
    showMessage(`Bonjour ${state} ami, ${name} ! Votre nombre de poquettes est ${pockets}.`);
  }

  // Play submit sound (non‑blocking)
  document.getElementById('submit-sound')?.play().catch(()=>{});

  // Write to Firestore
  try {
    await addDoc(collection(db, 'entries'), { name, pockets, date: dateStr, state });
    await refreshTables();
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
    pocketsCell.textContent = entry.pockets === 0 ? '0 (DNP)' : entry.pockets;
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
    .filter(d => d !== today && d >= '2024-12-20')
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
      tr.insertCell(1).textContent = 'No winner';
    }
  });
}

// -----------------------------------------------------
function showMessage(txt){
  document.getElementById('message').innerText = txt;
  popup(txt);
}

// Kick things off
refreshTables().catch(console.error);