// le-app.js — Poquettewhack French theme
// -------------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setLogLevel,
  orderBy,
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  // Your Firebase configuration details
  apiKey: "YOUR_API_KEY",
  authDomain: "pocketwang-a2d56.firebaseapp.com",
  projectId: "pocketwang-a2d56",
  storageBucket: "pocketwang-a2d56.appspot.com",
  messagingSenderId: "321549602257",
  appId: "YOUR_APP_ID",
  measurementId: "G-R6J2X0JHJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Firestore debug logging (for troubleshooting)
setLogLevel('debug');

document.getElementById('entryForm').addEventListener('submit', submitEntry);

async function submitEntry(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  let pockets = parseInt(document.getElementById('pockets').value);
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  if (name && !isNaN(pockets)) {
    const state = name.toLowerCase() === 'danny'
      ? 'naughty'
      : (name.toLowerCase() === 'dan' ? 'nice' : (Math.random() < 0.5 ? 'naughty' : 'nice'));

    // Christmas bonus day
    const specialDates = {
      "2024-12-25": {
        message: "C'est le jour de Noël et le Père Noël et ses bons amis de POTATOCORP vous ont offert une poche ! Votre nouveau nombre de poquettes est ",
        modifier: 1
      },
      "2024-12-26": {
        message: "C'est le lendemain de Noël ! Vous avez trouvé UNE poquette supplémentaire dans votre boîte cadeau POTATOCORP ! Votre nouveau nombre de poquettes est ",
        modifier: 1
      }
    };

    if (specialDates[dateStr]) {
      pockets += specialDates[dateStr].modifier;
      alert(specialDates[dateStr].message + pockets);
      document.getElementById('message').innerText = specialDates[dateStr].message + pockets;
    } else {
      const message = `Ho Ho Ho ${state} lutin, ${name} ! Votre nombre festif de poquettes est ${pockets}.`;
      document.getElementById('message').innerText = message;
      alert(message);
    }

    // Play the submit sound
    document.getElementById('submit-sound').play();

    try {
      await addDoc(collection(db, 'entries'), {
        name,
        pockets,
        date: dateStr,
        state
      });

      const { winners } = await getWinnerForDate(dateStr);
      const userIsWinner = winners.some(w => w.name === name && w.pockets === pockets);

      if (userIsWinner) {
        alert("C'EST STOCKINGWHACK ! Félicitations de la part de vos amis de POTATOCORP !");
      }

      await loadLeaderboardForDate('todayLeaderboard', new Date());

    } catch (error) {
      console.error('Erreur lors de l\'écriture du document : ', error);
      document.getElementById('message').innerText = 'Erreur lors de l\'écriture du document : ' + error.message;
    }
  }
}

async function getWinnerForDate(dateStr) {
  const q = query(collection(db, 'entries'), where('date', '==', dateStr));
  const querySnapshot = await getDocs(q);
  const entries = querySnapshot.docs.map(doc => {
    const data = doc.data();
    data.pockets = Number(data.pockets);
    return data;
  });

  const pocketCounts = entries.filter(e => e.pockets > 0).map(e => e.pockets);
  const uniquePockets = pocketCounts.filter((p, _, arr) => arr.indexOf(p) === arr.lastIndexOf(p));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  const winners = entries.filter(e => e.pockets === minUniquePockets && e.pockets > 0);
  return { winners, minUniquePockets };
}

window.onload = loadLeaderboard;

async function loadLeaderboard() {
  await loadLeaderboardForDate('todayLeaderboard', new Date());
  await loadLeaderboardForDate('yesterdayLeaderboard', new Date(Date.now() - 86400000));
  await loadDailyWinners();
}

async function loadLeaderboardForDate(tableId, dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0];

  const q = query(collection(db, 'entries'), where('date', '==', dateStr));

  try {
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.pockets = Number(data.pockets);
      entries.push(data);
    });
    displayLeaderboard(entries, tableId);
  } catch (error) {
    console.error('Erreur lors de la récupération des documents : ', error);
  }
}

function displayLeaderboard(entries, tableId) {
  const tableElement = document.getElementById(tableId);
  const tbody = tableElement.getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">Aucune entrée.</td></tr>';
    return;
  }

  entries.sort((a, b) => a.pockets - b.pockets);

  const pocketCounts = entries.filter(e => e.pockets > 0).map(e => e.pockets);
  const uniquePockets = pocketCounts.filter((p, _, arr) => arr.indexOf(p) === arr.lastIndexOf(p));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  entries.forEach((entry) => {
    const row = tbody.insertRow();
    const nameCell = row.insertCell(0);
    const pocketsCell = row.insertCell(1);
    const stateCell = row.insertCell(2);

    nameCell.innerText = entry.name;
    pocketsCell.innerText = (entry.pockets === 0) ? '0 (DNP)' : entry.pockets;
    stateCell.innerText = entry.state || 'Inconnu';

    if (entry.pockets === minUniquePockets && entry.pockets > 0) {
      row.classList.add('highlight');
      nameCell.classList.add('winner');
    }
  });
}

async function loadDailyWinners() {
  const winnersTable = document.getElementById('winnersTable').getElementsByTagName('tbody')[0];
  winnersTable.innerHTML = '';

  try {
    const q = query(collection(db, 'entries'));
    const querySnapshot = await getDocs(q);

    const entriesByDate = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;
      data.pockets = Number(data.pockets);
      if (!entriesByDate[date]) {
        entriesByDate[date] = [];
      }
      entriesByDate[date].push(data);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const startDateStr = '2024-12-20';

    const dates = Object.keys(entriesByDate)
      .filter(date => date !== todayStr && date >= startDateStr)
      .sort((a, b) => new Date(b) - new Date(a));

    dates.forEach((date) => {
      const entries = entriesByDate[date];
      const pocketCounts = entries.filter(e => e.pockets > 0).map(e => e.pockets);
      const uniquePockets = pocketCounts.filter((p, _, arr) => arr.indexOf(p) === arr.lastIndexOf(p));
      const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;
      const winners = entries.filter(e => e.pockets === minUniquePockets && e.pockets > 0);

      const row = winnersTable.insertRow();
      const dateCell = row.insertCell(0);
      const winnerCell = row.insertCell(1);

      dateCell.innerText = date;

      if (winners.length > 0) {
        const winnerNames = winners.map(w => '⭐ ' + w.name).join(', ');
        winnerCell.innerText = winnerNames;
      } else {
        winnerCell.innerText = 'Pas de gagnant';
      }
    });

  } catch (error) {
    console.error('Erreur lors du chargement des gagnants quotidiens : ', error);
  }
}