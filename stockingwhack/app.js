// Import Firebase functions
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
  console.log('submitEntry called');

  const name = document.getElementById('name').value.trim();
  let pockets = parseInt(document.getElementById('pockets').value);
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  console.log(`Name: ${name}, Pockets: ${pockets}, Date: ${dateStr}`);

  if (name && !isNaN(pockets)) {
    // Randomly assign 'naughty' or 'nice'
    const state = Math.random() < 0.5 ? 'naughty' : 'nice';

    // Check if today's date is a special date
    const specialDates = {
      "2024-12-25": {
        message: "It's Christmas Day and Santa and his good friends at POTATOCORP have gifted you a pocket! Your new pockets count is ",
        modifier: 1
      },
      "2024-12-26": {
        message: "It's Boxing Day! You found an extra pocket in your POTATOCORP gift box! Your new pockets count is ",
        modifier: 2
      }
    };

    if (specialDates[dateStr]) {
      // Apply the modifier and show the message
      pockets += specialDates[dateStr].modifier;
      alert(specialDates[dateStr].message + pockets);
      document.getElementById('message').innerText = specialDates[dateStr].message + pockets;
    } else {
      const message = `Ho Ho Ho ${state} elf, ${name}! Your festive pockets count is ${pockets}.`;
      document.getElementById('message').innerText = message;
      alert(message);
    }

    // Play the submit sound
    document.getElementById('submit-sound').play();

    try {
      await addDoc(collection(db, 'entries'), {
        name: name,
        pockets: pockets,
        date: dateStr,
        state: state
      });
      console.log('Document successfully written!');
    } catch (error) {
      console.error('Error writing document: ', error);
      document.getElementById('message').innerText = 'Error writing document: ' + error.message;
    }
  }
}

window.onload = loadLeaderboard;

async function loadLeaderboard() {
  console.log('loadLeaderboard called');
  await loadLeaderboardForDate('todayLeaderboard', new Date());
  await loadLeaderboardForDate('yesterdayLeaderboard', new Date(Date.now() - 86400000)); // 1 day in milliseconds
  await loadDailyWinners(); // Load the daily winners table
}

async function loadLeaderboardForDate(tableId, dateObj) {
  const dateStr = dateObj.toISOString().split('T')[0];
  console.log(`Loading leaderboard for date: ${dateStr}`);

  const q = query(collection(db, 'entries'), where('date', '==', dateStr));

  try {
    const querySnapshot = await getDocs(q);
    console.log(`Retrieved ${querySnapshot.size} entries for ${dateStr}`);

    const entries = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      data.pockets = Number(data.pockets); // Ensure pockets is a number
      entries.push(data);
    });
    displayLeaderboard(entries, tableId);
  } catch (error) {
    console.error('Error getting documents: ', error);
  }
}

function displayLeaderboard(entries, tableId) {
  console.log(`Displaying leaderboard for ${tableId} with ${entries.length} entries`);

  const tableElement = document.getElementById(tableId);
  if (!tableElement) {
    console.error(`No table found with ID: ${tableId}`);
    return;
  }

  const tbody = tableElement.getElementsByTagName('tbody')[0];
  tbody.innerHTML = ''; // Clear existing entries

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No entries.</td></tr>';
    return;
  }

  // Sort entries in ascending order of number of pockets
  entries.sort((a, b) => a.pockets - b.pockets);

  // Calculate the smallest unique number of pockets over 0
  const pocketCounts = entries
    .filter(entry => entry.pockets > 0)
    .map(entry => entry.pockets);
  const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
  const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

  entries.forEach((entry) => {
    const row = tbody.insertRow();
    const nameCell = row.insertCell(0);
    const pocketsCell = row.insertCell(1);

    nameCell.innerText = entry.name;

    // Annotate zero pockets with "(DNP)"
    if (entry.pockets === 0) {
      pocketsCell.innerText = '0 (DNP)';
    } else {
      pocketsCell.innerText = entry.pockets;
    }

    // Highlight the winner (only if pockets > 0)
    if (entry.pockets === minUniquePockets && entry.pockets > 0) {
      row.classList.add('highlight');
      nameCell.classList.add('winner'); // Add class to display star
    }
  });
}

// Updated function to load daily winners excluding the current day
async function loadDailyWinners() {
  console.log('Loading daily winners');

  const winnersTable = document.getElementById('winnersTable').getElementsByTagName('tbody')[0];
  winnersTable.innerHTML = ''; // Clear existing data

  try {
    // Fetch all entries
    const q = query(collection(db, 'entries'));
    const querySnapshot = await getDocs(q);

    const entriesByDate = {};

    // Organize entries by date
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;
      data.pockets = Number(data.pockets); // Ensure pockets is a number
      if (!entriesByDate[date]) {
        entriesByDate[date] = [];
      }
      entriesByDate[date].push(data);
    });

    // Get today's date string
    const todayStr = new Date().toISOString().split('T')[0];

    // Get all dates and sort them in descending order, excluding today
    const dates = Object.keys(entriesByDate)
      .filter(date => date !== todayStr) // Exclude today's date
      .sort((a, b) => new Date(b) - new Date(a));

    // Determine winner for each date
    dates.forEach((date) => {
      const entries = entriesByDate[date];

      // Calculate the smallest unique number of pockets over 0
      const pocketCounts = entries
        .filter(entry => entry.pockets > 0)
        .map(entry => entry.pockets);
      const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
      const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

      // Find the winner(s)
      const winners = entries.filter(entry => entry.pockets === minUniquePockets && entry.pockets > 0);

      const row = winnersTable.insertRow();
      const dateCell = row.insertCell(0);
      const winnerCell = row.insertCell(1);

      dateCell.innerText = date;

      if (winners.length > 0) {
        // If multiple winners (tie), list all names
        const winnerNames = winners.map(winner => '⭐ ' + winner.name).join(', ');
        winnerCell.innerText = winnerNames;
      } else {
        winnerCell.innerText = 'No winner';
      }
    });

  } catch (error) {
    console.error('Error loading daily winners: ', error);
  }
}

async function generateLeaderboard() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const q = query(collection(db, 'entries'), where('date', '==', dateStr), orderBy('pockets', 'desc'));

  const querySnapshot = await getDocs(q);
  let leaderboardHtml = '';

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    leaderboardHtml += `<tr>
                          <td>${data.name}</td>
                          <td>${data.pockets}</td>
                          <td>${data.state}</td>
                        </tr>`;
  });

  document.querySelector('#todayLeaderboard tbody').innerHTML = leaderboardHtml;
}

// Call generateLeaderboard to update the leaderboard
generateLeaderboard();