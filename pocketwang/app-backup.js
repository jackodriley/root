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
    // Check if today's date is September 28th or 29th, 2024
    const specialDates = ["2024-09-28", "2024-09-29"];

    if (specialDates.includes(dateStr)) {
      // Add 5 to the pockets
      pockets += 5;
      alert("Weekend +5 bonus applied! Your new pockets count is " + pockets);
    }

    try {
      await addDoc(collection(db, 'entries'), {
        name: name,
        pockets: pockets,
        date: dateStr
      });
      console.log('Entry added to Firestore');
      alert('Pockets entered! Thank you for playing POCKETWHACK! © POTATOCORP 2024');
      document.getElementById('entryForm').reset();
      await loadLeaderboard(); // Reload leaderboards after submission

      // Now, check if the user's entry is the winning entry
      // Fetch today's entries
      const q = query(collection(db, 'entries'), where('date', '==', dateStr));
      const querySnapshot = await getDocs(q);
      const entries = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.pockets = Number(data.pockets); // Ensure pockets is a number
        entries.push(data);
      });

      // Calculate the smallest unique number of pockets over 0
      const pocketCounts = entries
        .filter(entry => entry.pockets > 0)
        .map(entry => entry.pockets);
      const uniquePockets = pocketCounts.filter((pockets, _, arr) => arr.indexOf(pockets) === arr.lastIndexOf(pockets));
      const minUniquePockets = uniquePockets.length > 0 ? Math.min(...uniquePockets) : null;

      // Access the message div
      const messageDiv = document.getElementById('message');

      // Check if user's entry is the winning entry
      if (pockets === minUniquePockets && pockets > 0) {
        // Display the message
        messageDiv.innerText = "CONGRATULATIONS, YOU'VE POCKETWHACKED!!!";
      } else {
        // Clear the message if not the winning entry
        messageDiv.innerText = "";
      }

    } catch (error) {
      console.error('Error adding document: ', error);
    }
  } else {
    alert('Please enter a valid name and number of pockets.');
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