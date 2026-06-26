"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  serverTimestamp,
  setLogLevel
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQ5SEDfrvmAaGBjZTtHQ2L89jprhJ5QHk",
  authDomain: "pocketwang-a2d56.firebaseapp.com",
  projectId: "pocketwang-a2d56",
  storageBucket: "pocketwang-a2d56.appspot.com",
  messagingSenderId: "321549602257",
  appId: "1:321549602257:web:36c42c88de80a58eb4a4f0",
  measurementId: "G-R6J2X0JHJW"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const SCORES_COLLECTION = "animalKingdomScores";

setLogLevel("debug");
console.info("[Animal Kingdom Firebase] Initialized", {
  projectId: firebaseConfig.projectId,
  collection: SCORES_COLLECTION
});

if (firebaseConfig.apiKey.includes("YOUR_") || firebaseConfig.appId.includes("YOUR_")) {
  console.warn("[Animal Kingdom Firebase] Firebase config still contains placeholder values", {
    apiKey: firebaseConfig.apiKey,
    appId: firebaseConfig.appId
  });
}

window.addEventListener("unhandledrejection", (event) => {
  console.error("[Animal Kingdom Firebase] Unhandled promise rejection", event.reason);
});

const WIDTH = 26;
const HEIGHT = 18;
const DAY_MS = 5000;
const MAX_ANIMALS = 420;
const MAX_GRASS = WIDTH * HEIGHT;
const CHART_LIMIT = 160;
const ACTIONS_PER_SPEED_UNIT = 1.45;
const ICONS = {
  antelopeAdult: "assets/icons/antelope-adult-neutral.png",
  antelopeBaby: "assets/icons/antelope-baby-neutral.png",
  tigerAdult: "assets/icons/tiger-adult-dark.png",
  tigerBaby: "assets/icons/tiger-baby-dark.png"
};
const ANTELOPE_TINTS = [
  { hue: 0, saturation: 1.7, brightness: 1.08 },
  { hue: 28, saturation: 1.8, brightness: 1.1 },
  { hue: 58, saturation: 1.55, brightness: 1.12 },
  { hue: 88, saturation: 1.45, brightness: 1.1 },
  { hue: 132, saturation: 1.38, brightness: 1.12 },
  { hue: 172, saturation: 1.42, brightness: 1.1 },
  { hue: 205, saturation: 1.5, brightness: 1.12 },
  { hue: 248, saturation: 1.55, brightness: 1.12 },
  { hue: 292, saturation: 1.55, brightness: 1.1 },
  { hue: 326, saturation: 1.6, brightness: 1.1 }
];
const CHART_SERIES = {
  grass: { color: "#67a857", visible: true },
  antelope: { color: "#c58b43", visible: true },
  tiger: { color: "#d14d35", visible: true }
};

const controls = {
  simSpeed: document.getElementById("simSpeed"),
  startGrass: document.getElementById("startGrass"),
  startAntelope: document.getElementById("startAntelope"),
  startTigers: document.getElementById("startTigers"),
  tigerSpeed: document.getElementById("tigerSpeed"),
  tigerOffspring: document.getElementById("tigerOffspring"),
  tigerBreedingAge: document.getElementById("tigerBreedingAge"),
  tigerTummy: document.getElementById("tigerTummy"),
  tigerOldAge: document.getElementById("tigerOldAge"),
  tigerSleep: document.getElementById("tigerSleep"),
  antelopeSpeed: document.getElementById("antelopeSpeed"),
  antelopeOffspring: document.getElementById("antelopeOffspring"),
  antelopeBreedingAge: document.getElementById("antelopeBreedingAge"),
  antelopeTummy: document.getElementById("antelopeTummy"),
  antelopeOldAge: document.getElementById("antelopeOldAge"),
  antelopeSleep: document.getElementById("antelopeSleep"),
  grassGrowth: document.getElementById("grassGrowth"),
  grassSpawn: document.getElementById("grassSpawn")
};

const gridEl = document.getElementById("ecosystemGrid");
const chart = document.getElementById("populationChart");
const chartCtx = chart.getContext("2d");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const simStatus = document.getElementById("simStatus");
const startOverlay = document.getElementById("startOverlay");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverMessage = document.getElementById("gameOverMessage");
const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const playerNamePanel = document.getElementById("playerNamePanel");
const playerNameInput = document.getElementById("playerNameInput");
const leaderboardPanel = document.getElementById("leaderboardPanel");
const leaderboardBody = document.getElementById("leaderboardBody");

const cells = [];
let animals = [];
let grass = new Map();
let graves = [];
let killFlashes = [];
let deathStats = makeDeathStats();
let history = [];
let nextId = 1;
let day = 0;
let lastWholeDay = 0;
let lastFrame = performance.now();
let renderAccumulator = 0;
let paused = false;
let gameOver = false;
let biodiversityLossAcknowledged = false;
let welcomePending = false;
let playerName = "";
let scoreSubmitted = false;

function makeCellKey(x, y) {
  return `${x},${y}`;
}

function fromCellKey(key) {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomPosition() {
  return {
    x: randomInt(WIDTH),
    y: randomInt(HEIGHT)
  };
}

function readSettings() {
  return Object.fromEntries(
    Object.entries(controls).map(([key, input]) => [key, Number(input.value)])
  );
}

function makeDeathStats() {
  return {
    antelope: {
      born: 0,
      eaten: 0,
      oldAge: 0,
      starvation: 0
    },
    tiger: {
      born: 0,
      oldAge: 0,
      starvation: 0
    }
  };
}

function speciesSettings(species) {
  const settings = readSettings();

  if (species === "tiger") {
    return {
      speed: settings.tigerSpeed,
      offspring: settings.tigerOffspring,
      breedingAge: settings.tigerBreedingAge,
      tummy: settings.tigerTummy,
      oldAge: settings.tigerOldAge,
      sleep: settings.tigerSleep,
      eatGain: settings.tigerTummy * 0.86,
      hungerLine: settings.tigerTummy * 0.44,
      symbolAdult: "🐆",
      symbolBaby: "🐅",
      assetAdult: ICONS.tigerAdult,
      assetBaby: ICONS.tigerBaby
    };
  }

  return {
    speed: settings.antelopeSpeed,
    offspring: settings.antelopeOffspring,
    breedingAge: settings.antelopeBreedingAge,
    tummy: settings.antelopeTummy,
    oldAge: settings.antelopeOldAge,
    sleep: settings.antelopeSleep,
    eatGain: settings.antelopeTummy * 0.5,
    hungerLine: settings.antelopeTummy * 0.42,
    symbolAdult: "🦌",
    symbolBaby: "🐈",
    assetAdult: ICONS.antelopeAdult,
    assetBaby: ICONS.antelopeBaby
  };
}

function preloadIcons() {
  Object.values(ICONS).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

function createGrid() {
  gridEl.innerHTML = "";
  cells.length = 0;

  for (let index = 0; index < WIDTH * HEIGHT; index += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    const occupants = document.createElement("div");
    occupants.className = "occupants";
    cell.appendChild(occupants);
    gridEl.appendChild(cell);
    cells.push({ cell, occupants });
  }
}

function cellIndex(x, y) {
  return y * WIDTH + x;
}

function addGrassAt(x, y, maturity = 1) {
  grass.set(makeCellKey(x, y), {
    maturity: clamp(maturity, 1, 3),
    born: day
  });
}

function spawnGrass(count) {
  const requestedCount = count;
  let attempts = 0;

  while (grass.size < MAX_GRASS && count > 0 && attempts < requestedCount * 24) {
    const position = randomPosition();
    const key = makeCellKey(position.x, position.y);

    if (!grass.has(key)) {
      addGrassAt(position.x, position.y, 1);
      count -= 1;
    }

    attempts += 1;
  }
}

function makeAnimal(species, x, y, age = 0) {
  const settings = speciesSettings(species);
  const energy = settings.tummy * (0.56 + Math.random() * 0.36);
  const tint = species === "antelope" ? ANTELOPE_TINTS[randomInt(ANTELOPE_TINTS.length)] : null;

  return {
    id: nextId,
    species,
    x,
    y,
    age,
    energy,
    nextActionDay: day + Math.random() * 0.3,
    sleepUntilDay: 0,
    breedReadyDay: day + 1 + Math.random() * 2,
    napReadyDay: day + 1.5 + Math.random() * 4,
    tint,
    alive: true
  };
}

function addAnimal(species, x, y, age = 0) {
  if (animals.length >= MAX_ANIMALS) {
    return null;
  }

  const animal = makeAnimal(species, x, y, age);
  nextId += 1;
  animals.push(animal);

  if (deathStats[species] && deathStats[species].born !== undefined) {
    deathStats[species].born += 1;
  }

  return animal;
}

function resetSimulation() {
  const settings = readSettings();

  animals = [];
  grass = new Map();
  graves = [];
  killFlashes = [];
  deathStats = makeDeathStats();
  history = [];
  nextId = 1;
  day = 0;
  lastWholeDay = 0;
  lastFrame = performance.now();
  renderAccumulator = 0;
  paused = false;
  gameOver = false;
  biodiversityLossAcknowledged = false;
  scoreSubmitted = false;
  pauseButton.disabled = false;
  pauseButton.textContent = "⏸";
  simStatus.textContent = "Running";
  startOverlay.classList.add("is-hidden");
  continueButton.classList.remove("is-hidden");
  playerNamePanel.classList.add("is-hidden");
  leaderboardPanel.classList.add("is-hidden");

  spawnGrass(settings.startGrass);

  for (let i = 0; i < settings.startAntelope; i += 1) {
    const position = randomPosition();
    const maxStartingAge = Math.min(settings.antelopeOldAge * 0.72, settings.antelopeBreedingAge * 2.4);
    addAnimal("antelope", position.x, position.y, Math.random() * maxStartingAge);
  }

  for (let i = 0; i < settings.startTigers; i += 1) {
    const position = randomPosition();
    const maxStartingAge = Math.min(settings.tigerOldAge * 0.72, settings.tigerBreedingAge * 2.4);
    addAnimal("tiger", position.x, position.y, Math.random() * maxStartingAge);
  }

  recordHistory();
  render();
}

function markDeath(animal) {
  graves.push({
    x: animal.x,
    y: animal.y,
    species: animal.species,
    expiresAt: day + 1
  });
}

function markKillFlash(x, y) {
  killFlashes.push({
    x,
    y,
    expiresAt: day + 0.18
  });
}

function killAnimal(animal, reason) {
  if (!animal.alive) {
    return;
  }

  animal.alive = false;
  markDeath(animal);

  if (deathStats[animal.species] && deathStats[animal.species][reason] !== undefined) {
    deathStats[animal.species][reason] += 1;
  }
}

function updateControlOutputs() {
  Object.values(controls).forEach((input) => {
    const output = document.querySelector(`output[for="${input.id}"]`);
    if (!output) {
      return;
    }

    let suffix = "";
    if (input.id.includes("Age") || input.id.includes("Sleep") || input.id.includes("OldAge")) {
      suffix = "d";
    } else if (input.id === "simSpeed") {
      suffix = "x";
    }
    output.value = `${input.value}${suffix}`;
  });
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findNearestAnimal(seeker, species, predicate = () => true, maxDistance = Infinity) {
  let nearest = null;
  let bestDistance = maxDistance + 1;

  for (const animal of animals) {
    if (!animal.alive || animal.id === seeker.id || animal.species !== species || !predicate(animal)) {
      continue;
    }

    const candidateDistance = distance(seeker, animal);
    if (candidateDistance < bestDistance) {
      nearest = animal;
      bestDistance = candidateDistance;
    }
  }

  return nearest;
}

function findNearestGrass(seeker) {
  let nearest = null;
  let bestDistance = Infinity;

  for (const [key, plant] of grass.entries()) {
    if (plant.maturity < 2) {
      continue;
    }

    const position = fromCellKey(key);
    const candidateDistance = distance(seeker, position);

    if (candidateDistance < bestDistance) {
      nearest = position;
      bestDistance = candidateDistance;
    }
  }

  return nearest;
}

function moveToward(animal, target) {
  if (!target) {
    randomMove(animal);
    return;
  }

  const dx = target.x - animal.x;
  const dy = target.y - animal.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    animal.x += Math.sign(dx);
  } else if (dy !== 0) {
    animal.y += Math.sign(dy);
  } else if (dx !== 0) {
    animal.x += Math.sign(dx);
  }

  animal.x = clamp(animal.x, 0, WIDTH - 1);
  animal.y = clamp(animal.y, 0, HEIGHT - 1);
}

function randomMove(animal) {
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 0, y: 0 }
  ];
  const step = directions[randomInt(directions.length)];

  animal.x = clamp(animal.x + step.x, 0, WIDTH - 1);
  animal.y = clamp(animal.y + step.y, 0, HEIGHT - 1);
}

function moveAwayFrom(animal, threat) {
  if (!threat) {
    randomMove(animal);
    return;
  }

  const dx = animal.x - threat.x;
  const dy = animal.y - threat.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    animal.x += Math.sign(dx || (Math.random() < 0.5 ? -1 : 1));
  } else if (dy !== 0) {
    animal.y += Math.sign(dy);
  } else {
    animal.x += Math.sign(dx || (Math.random() < 0.5 ? -1 : 1));
  }

  animal.x = clamp(animal.x, 0, WIDTH - 1);
  animal.y = clamp(animal.y, 0, HEIGHT - 1);
}

function localPreyCount(animal, radius) {
  return animals.filter(
    (candidate) =>
      candidate.alive &&
      candidate.species === "antelope" &&
      distance(animal, candidate) <= radius
  ).length;
}

function adjacentOpenCell(parent) {
  const offsets = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: -1 }
  ];
  const offset = offsets[randomInt(offsets.length)];

  return {
    x: clamp(parent.x + offset.x, 0, WIDTH - 1),
    y: clamp(parent.y + offset.y, 0, HEIGHT - 1)
  };
}

function tryEat(animal, settings) {
  if (animal.species === "antelope") {
    const key = makeCellKey(animal.x, animal.y);
    const plant = grass.get(key);

    if (plant && plant.maturity >= 2) {
      grass.delete(key);
      animal.energy = Math.min(settings.tummy, animal.energy + settings.eatGain);
      return true;
    }

    return false;
  }

  const prey = animals.find(
    (candidate) =>
      candidate.alive &&
      candidate.species === "antelope" &&
      candidate.x === animal.x &&
      candidate.y === animal.y
  );

  if (prey) {
    markKillFlash(prey.x, prey.y);
    killAnimal(prey, "eaten");
    animal.energy = Math.min(settings.tummy, animal.energy + settings.eatGain);
    return true;
  }

  return false;
}

function isPhysicallyReadyToBreed(animal, settings) {
  return (
    animal.age >= settings.breedingAge &&
    animal.energy >= settings.tummy * 0.62 &&
    day >= animal.breedReadyDay &&
    day >= animal.sleepUntilDay
  );
}

function canBreed(animal, settings) {
  if (!isPhysicallyReadyToBreed(animal, settings)) {
    return false;
  }

  // Tiger reproduction is blocked when local prey is scarce, giving antelope herds room to recover.
  if (animal.species === "tiger" && localPreyCount(animal, 10) < 2) {
    return false;
  }

  return true;
}

function tryBreed(animal, settings) {
  if (!canBreed(animal, settings) || animals.length >= MAX_ANIMALS) {
    return false;
  }

  const mate = findNearestAnimal(
    animal,
    animal.species,
    (candidate) => isPhysicallyReadyToBreed(candidate, settings),
    1
  );

  if (!mate) {
    return false;
  }

  const births = Math.min(settings.offspring, MAX_ANIMALS - animals.length);

  for (let i = 0; i < births; i += 1) {
    const position = adjacentOpenCell(animal);
    addAnimal(animal.species, position.x, position.y, 0);
  }

  animal.energy *= 0.72;
  mate.energy *= 0.72;
  animal.breedReadyDay = day + 3 + Math.random() * 2;
  mate.breedReadyDay = day + 3 + Math.random() * 2;
  return true;
}

function maybeSleep(animal, settings) {
  if (day < animal.napReadyDay || animal.energy < settings.tummy * 0.45) {
    return false;
  }

  const sleepChance = animal.energy > settings.tummy * 0.72 ? 0.34 : 0.16;

  if (Math.random() < sleepChance) {
    animal.sleepUntilDay = day + settings.sleep;
    // Sleeping animals resume on wake-up day instead of catching up every action they missed.
    animal.nextActionDay = animal.sleepUntilDay;
    animal.napReadyDay = animal.sleepUntilDay + 1.5 + Math.random() * 4;
    return true;
  }

  animal.napReadyDay = day + 0.5 + Math.random() * 2.5;
  return false;
}

function stepAnimal(animal) {
  const settings = speciesSettings(animal.species);

  if (day < animal.sleepUntilDay) {
    return;
  }

  while (day >= animal.nextActionDay && animal.alive) {
    animal.energy -= animal.species === "tiger" ? 1.1 : 0.82;
    animal.nextActionDay += 1 / (settings.speed * ACTIONS_PER_SPEED_UNIT);

    const nearbyTiger =
      animal.species === "antelope" ? findNearestAnimal(animal, "tiger", () => true, 3) : null;
    if (nearbyTiger) {
      // Antelope flee nearby tigers before foraging or seeking mates, trading food and breeding for survival.
      moveAwayFrom(animal, nearbyTiger);
      continue;
    }

    if (tryEat(animal, settings)) {
      continue;
    }

    const hungry = animal.energy < settings.hungerLine;
    const physicallyReadyToBreed = isPhysicallyReadyToBreed(animal, settings);
    const readyToBreed = canBreed(animal, settings);

    if (hungry) {
      if (animal.species === "tiger") {
        // Hungry tigers only detect prey nearby, preventing long-range predator lock-on.
        const prey = findNearestAnimal(animal, "antelope", () => true, 5);
        moveToward(animal, prey);
      } else {
        moveToward(animal, findNearestGrass(animal));
      }
      tryEat(animal, settings);
      continue;
    }

    if (physicallyReadyToBreed) {
      const mateSearchRange = animal.species === "tiger" ? 16 : 9;
      const mate = findNearestAnimal(
        animal,
        animal.species,
        (candidate) => isPhysicallyReadyToBreed(candidate, settings),
        mateSearchRange
      );

      if (mate && distance(animal, mate) <= 1 && readyToBreed && tryBreed(animal, settings)) {
        continue;
      }

      if (mate) {
        // Physically ready animals seek mates; tiger births still require the local prey check.
        moveToward(animal, mate);
        continue;
      }
    }

    if (maybeSleep(animal, settings)) {
      break;
    }

    if (animal.species === "tiger") {
      // Fed tigers wander instead of actively hunting, then eat only if they stumble onto prey.
      randomMove(animal);
      tryEat(animal, settings);
    } else {
      const grassTarget = findNearestGrass(animal);
      moveToward(animal, grassTarget);
      tryEat(animal, settings);
    }
  }
}

function growGrass(deltaDays) {
  const growthRate = readSettings().grassGrowth;

  for (const plant of grass.values()) {
    plant.born -= deltaDays * growthRate * 0.05;
    if (day - plant.born > 3) {
      plant.maturity = 3;
    } else if (day - plant.born > 1.3) {
      plant.maturity = 2;
    }
  }
}

function advanceSimulation(deltaMs) {
  const previousDay = day;
  day += deltaMs / DAY_MS;
  const deltaDays = day - previousDay;

  growGrass(deltaDays);
  graves = graves.filter((grave) => day < grave.expiresAt);
  killFlashes = killFlashes.filter((flash) => day < flash.expiresAt);

  for (const animal of animals) {
    if (!animal.alive) {
      continue;
    }

    const settings = speciesSettings(animal.species);
    animal.age += deltaDays;
    animal.energy -= deltaDays * (animal.species === "tiger" ? 0.46 : 0.38);

    if (animal.energy <= 0 || animal.age >= settings.oldAge) {
      killAnimal(animal, animal.age >= settings.oldAge ? "oldAge" : "starvation");
      continue;
    }

    stepAnimal(animal);
  }

  animals = animals.filter((animal) => animal.alive);

  const wholeDay = Math.floor(day);
  if (wholeDay > lastWholeDay) {
    const settings = readSettings();

    for (let nextDay = lastWholeDay + 1; nextDay <= wholeDay; nextDay += 1) {
      spawnGrass(settings.grassSpawn);
      recordHistory(nextDay);
    }

    lastWholeDay = wholeDay;
  }

  checkGameOver();
}

function checkGameOver() {
  if (gameOver) {
    return;
  }

  const counts = populationCounts();
  const livingSpecies = Number(counts.antelope > 0) + Number(counts.tiger > 0);
  if (livingSpecies > 1) {
    return;
  }

  if (livingSpecies === 1 && !biodiversityLossAcknowledged) {
    pauseForBiodiversityLoss();
    return;
  }

  if (livingSpecies === 1) {
    return;
  }

  showTerminalGameOver();
}

function renderFinalFrameBeforeGameOver() {
  render();
  renderAccumulator = 0;
}

function currentScore() {
  return {
    daysLasted: Math.floor(day),
    animalsEverLived: deathStats.antelope.born + deathStats.tiger.born
  };
}

async function submitScoreOnce() {
  if (scoreSubmitted) {
    console.info("[Animal Kingdom Firebase] Score submit skipped: already submitted");
    return;
  }

  scoreSubmitted = true;
  const score = currentScore();
  const today = new Date();
  const scoreDoc = {
    name: playerName || "Anonymous",
    daysLasted: score.daysLasted,
    animalsEverLived: score.animalsEverLived,
    date: today.toISOString().split("T")[0],
    endedAt: serverTimestamp(),
    settings: readSettings()
  };

  console.info("[Animal Kingdom Firebase] Submitting score", {
    collection: SCORES_COLLECTION,
    score: {
      ...scoreDoc,
      endedAt: "serverTimestamp()"
    }
  });

  try {
    const docRef = await addDoc(collection(db, SCORES_COLLECTION), scoreDoc);
    console.info("[Animal Kingdom Firebase] Score submitted", {
      collection: SCORES_COLLECTION,
      documentId: docRef.id
    });
  } catch (error) {
    console.error("[Animal Kingdom Firebase] Unable to submit score", {
      code: error.code,
      message: error.message,
      error
    });
  }
}

async function loadLeaderboard() {
  console.info("[Animal Kingdom Firebase] Loading leaderboard", {
    collection: SCORES_COLLECTION
  });

  try {
    const q = query(collection(db, SCORES_COLLECTION));
    const querySnapshot = await getDocs(q);
    const entries = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      entries.push({
        name: data.name || "Anonymous",
        daysLasted: Number(data.daysLasted) || 0,
        animalsEverLived: Number(data.animalsEverLived) || 0
      });
    });

    entries.sort(
      (a, b) =>
        b.daysLasted - a.daysLasted ||
        b.animalsEverLived - a.animalsEverLived
    );
    console.info("[Animal Kingdom Firebase] Leaderboard loaded", {
      totalDocs: entries.length,
      displayedDocs: Math.min(entries.length, 10)
    });
    displayLeaderboard(entries.slice(0, 10));
  } catch (error) {
    console.error("[Animal Kingdom Firebase] Unable to load leaderboard", {
      code: error.code,
      message: error.message,
      error
    });
    leaderboardBody.innerHTML = `<tr><td colspan="4">Leaderboard unavailable</td></tr>`;
  }
}

function displayLeaderboard(entries) {
  leaderboardBody.innerHTML = "";

  if (!entries.length) {
    leaderboardBody.innerHTML = `<tr><td colspan="4">No scores yet</td></tr>`;
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement("tr");
    const rank = document.createElement("td");
    const name = document.createElement("td");
    const days = document.createElement("td");
    const animalsEverLived = document.createElement("td");

    rank.textContent = String(index + 1);
    name.textContent = entry.name;
    days.textContent = String(entry.daysLasted);
    animalsEverLived.textContent = String(entry.animalsEverLived);
    row.append(rank, name, days, animalsEverLived);
    leaderboardBody.appendChild(row);
  });
}

function showLeaderboardPanel() {
  console.info("[Animal Kingdom Firebase] Showing leaderboard panel");
  playerNamePanel.classList.add("is-hidden");
  leaderboardPanel.classList.remove("is-hidden");
  leaderboardBody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
  loadLeaderboard();
}

function pauseForBiodiversityLoss() {
  renderFinalFrameBeforeGameOver();
  console.info("[Animal Kingdom Firebase] Biodiversity-loss game end reached", currentScore());
  gameOver = true;
  paused = true;
  pauseButton.disabled = true;
  pauseButton.textContent = "■";
  simStatus.textContent = "Biodiversity Lost";
  gameOverTitle.textContent = "Kingdom fallen - biodiversity lost";
  gameOverMessage.textContent = `Your kingdom lasted ${Math.floor(day)} days.`;
  continueButton.classList.remove("is-hidden");
  startOverlay.classList.remove("is-hidden");
  submitScoreOnce().finally(showLeaderboardPanel);
}

function showTerminalGameOver() {
  renderFinalFrameBeforeGameOver();
  console.info("[Animal Kingdom Firebase] Terminal game end reached", currentScore());
  gameOver = true;
  paused = true;
  pauseButton.disabled = true;
  pauseButton.textContent = "■";
  simStatus.textContent = "Ended";
  gameOverTitle.textContent = "Kingdom fallen - biodiversity lost";
  gameOverMessage.textContent = `Your kingdom lasted ${Math.floor(day)} days.`;
  continueButton.classList.add("is-hidden");
  startOverlay.classList.remove("is-hidden");
  submitScoreOnce().finally(showLeaderboardPanel);
}

function recordHistory(snapshotDay = Math.floor(day)) {
  const counts = populationCounts();

  history.push({
    day: snapshotDay,
    grass: counts.grass,
    antelope: counts.antelope,
    tiger: counts.tiger
  });

  if (history.length > CHART_LIMIT) {
    history.shift();
  }
}

function populationCounts() {
  let antelope = 0;
  let tiger = 0;
  let antelopeBabies = 0;
  let antelopeAdults = 0;
  let tigerBabies = 0;
  let tigerAdults = 0;
  const antelopeSettings = speciesSettings("antelope");
  const tigerSettings = speciesSettings("tiger");

  for (const animal of animals) {
    if (animal.species === "antelope") {
      antelope += 1;
      if (animal.age < antelopeSettings.breedingAge) {
        antelopeBabies += 1;
      } else {
        antelopeAdults += 1;
      }
    } else if (animal.species === "tiger") {
      tiger += 1;
      if (animal.age < tigerSettings.breedingAge) {
        tigerBabies += 1;
      } else {
        tigerAdults += 1;
      }
    }
  }

  return {
    grass: grass.size,
    antelope,
    tiger,
    antelopeBabies,
    antelopeAdults,
    tigerBabies,
    tigerAdults
  };
}

function setAgeMix(elementId, babyIcon, adultIcon, babyCount, adultCount, babyLabel, adultLabel) {
  const container = document.getElementById(elementId);
  container.replaceChildren();
  container.className = "age-mix";

  const open = document.createTextNode("(");
  const baby = document.createElement("img");
  baby.className = "age-mix-icon";
  baby.src = babyIcon;
  baby.alt = babyLabel;
  const babyText = document.createTextNode(` ${babyCount} / `);
  const adult = document.createElement("img");
  adult.className = "age-mix-icon";
  adult.src = adultIcon;
  adult.alt = adultLabel;
  const adultText = document.createTextNode(` ${adultCount})`);

  container.append(open, baby, babyText, adult, adultText);
}

function render() {
  for (let i = 0; i < cells.length; i += 1) {
    cells[i].cell.className = "cell";
    cells[i].occupants.innerHTML = "";
  }

  for (const [key, plant] of grass.entries()) {
    const position = fromCellKey(key);
    cells[cellIndex(position.x, position.y)].cell.classList.add(`grass-${plant.maturity}`);
  }

  for (const flash of killFlashes) {
    cells[cellIndex(flash.x, flash.y)].cell.classList.add("kill-flash");
  }

  for (const grave of graves) {
    const marker = document.createElement("span");
    marker.className = `grave ${grave.species}-grave`;
    marker.textContent = grave.species === "tiger" ? "🪦" : "✝️";
    cells[cellIndex(grave.x, grave.y)].occupants.appendChild(marker);
  }

  const byCell = new Map();
  for (const animal of animals) {
    const key = makeCellKey(animal.x, animal.y);
    if (!byCell.has(key)) {
      byCell.set(key, []);
    }
    byCell.get(key).push(animal);
  }

  for (const [key, residents] of byCell.entries()) {
    const position = fromCellKey(key);
    const occupants = cells[cellIndex(position.x, position.y)].occupants;
    const visibleResidents = residents.slice(0, 3);

    for (const animal of visibleResidents) {
      const settings = speciesSettings(animal.species);
      const isBaby = animal.age < settings.breedingAge;
      const critter = document.createElement("span");
      critter.className = `critter ${animal.species} ${isBaby ? "baby" : "adult"}`;
      const icon = document.createElement("img");
      icon.className = "critter-icon";
      icon.src = isBaby ? settings.assetBaby : settings.assetAdult;
      icon.alt = isBaby ? settings.symbolBaby : settings.symbolAdult;
      critter.appendChild(icon);

      if (animal.species === "antelope") {
        critter.style.setProperty(
          "--critter-filter",
          `sepia(0.85) saturate(${animal.tint.saturation}) hue-rotate(${animal.tint.hue}deg) brightness(${animal.tint.brightness})`
        );
      }

      if (day < animal.sleepUntilDay) {
        const sleep = document.createElement("span");
        sleep.className = "sleep-mark";
        sleep.textContent = "💤";
        critter.appendChild(sleep);
      }

      occupants.appendChild(critter);
    }

    if (residents.length > visibleResidents.length) {
      const more = document.createElement("span");
      more.className = "crowd-more";
      more.textContent = "+";
      occupants.appendChild(more);
    }
  }

  const counts = populationCounts();
  document.getElementById("dayDisplay").textContent = String(Math.floor(day));
  document.getElementById("everLivedCount").textContent = String(deathStats.antelope.born + deathStats.tiger.born);
  document.getElementById("grassCount").textContent = String(counts.grass);
  document.getElementById("antelopeCount").textContent = String(counts.antelope);
  document.getElementById("tigerCount").textContent = String(counts.tiger);
  setAgeMix(
    "antelopeAgeMix",
    ICONS.antelopeBaby,
    ICONS.antelopeAdult,
    counts.antelopeBabies,
    counts.antelopeAdults,
    "baby antelope",
    "adult antelope"
  );
  setAgeMix(
    "tigerAgeMix",
    ICONS.tigerBaby,
    ICONS.tigerAdult,
    counts.tigerBabies,
    counts.tigerAdults,
    "baby tiger",
    "adult tiger"
  );
  document.getElementById("antelopeDeaths").textContent =
    `born ${deathStats.antelope.born} | eaten ${deathStats.antelope.eaten} | old ${deathStats.antelope.oldAge} | starved ${deathStats.antelope.starvation}`;
  document.getElementById("tigerDeaths").textContent =
    `born ${deathStats.tiger.born} | old ${deathStats.tiger.oldAge} | starved ${deathStats.tiger.starvation}`;
  drawChart();
}

function drawChart() {
  const width = chart.width;
  const height = chart.height;
  const padding = 32;
  const bottomAxis = 22;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2 - bottomAxis;
  const visibleKeys = Object.keys(CHART_SERIES).filter((key) => CHART_SERIES[key].visible);
  const values = visibleKeys.length
    ? history.flatMap((point) => visibleKeys.map((key) => point[key]))
    : [10];
  const maxValue = Math.max(10, ...values);

  chartCtx.clearRect(0, 0, width, height);
  chartCtx.fillStyle = "#f8f2d6";
  chartCtx.fillRect(0, 0, width, height);

  chartCtx.strokeStyle = "rgba(77, 70, 55, 0.22)";
  chartCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (plotHeight / 4) * i;
    chartCtx.beginPath();
    chartCtx.moveTo(padding, y);
    chartCtx.lineTo(width - padding, y);
    chartCtx.stroke();
  }

  drawDayAxis(padding, plotWidth, plotHeight, height);

  if (CHART_SERIES.grass.visible) {
    drawSeries("grass", CHART_SERIES.grass.color, maxValue, padding, plotWidth, plotHeight);
  }
  if (CHART_SERIES.antelope.visible) {
    drawSeries("antelope", CHART_SERIES.antelope.color, maxValue, padding, plotWidth, plotHeight);
  }
  if (CHART_SERIES.tiger.visible) {
    drawSeries("tiger", CHART_SERIES.tiger.color, maxValue, padding, plotWidth, plotHeight);
  }

  chartCtx.strokeStyle = "#4d4637";
  chartCtx.lineWidth = 2;
  chartCtx.strokeRect(padding, padding, plotWidth, plotHeight);
}

function drawDayAxis(padding, plotWidth, plotHeight, height) {
  if (!history.length) {
    return;
  }

  const firstDay = history[0].day;
  const lastDay = history[history.length - 1].day;
  const daySpan = Math.max(1, lastDay - firstDay);
  const y = padding + plotHeight + 11;

  chartCtx.strokeStyle = "rgba(77, 70, 55, 0.55)";
  chartCtx.fillStyle = "#4d4637";
  chartCtx.lineWidth = 1;
  chartCtx.font = "11px Courier New";

  for (let markerDay = Math.ceil(firstDay); markerDay <= lastDay; markerDay += 1) {
    const x = padding + ((markerDay - firstDay) / daySpan) * plotWidth;
    const major = markerDay % 10 === 0;
    chartCtx.beginPath();
    chartCtx.moveTo(x, y);
    chartCtx.lineTo(x, y + (major ? 8 : 4));
    chartCtx.stroke();

    if (major) {
      chartCtx.fillText(String(markerDay), x - 7, Math.min(height - 3, y + 20));
    }
  }
}

function drawSeries(key, color, maxValue, padding, plotWidth, plotHeight) {
  if (history.length < 2) {
    return;
  }

  chartCtx.strokeStyle = color;
  chartCtx.lineWidth = 3;
  chartCtx.beginPath();

  history.forEach((point, index) => {
    const x = padding + (index / Math.max(1, history.length - 1)) * plotWidth;
    const y = padding + plotHeight - (point[key] / maxValue) * plotHeight;

    if (index === 0) {
      chartCtx.moveTo(x, y);
    } else {
      chartCtx.lineTo(x, y);
    }
  });

  chartCtx.stroke();
}

function tick(now) {
  const deltaMs = Math.min(120, now - lastFrame);
  lastFrame = now;

  if (!paused) {
    advanceSimulation(deltaMs * readSettings().simSpeed);
    renderAccumulator += deltaMs;

    if (renderAccumulator > 110) {
      render();
      renderAccumulator = 0;
    }
  }

  requestAnimationFrame(tick);
}

function bindEvents() {
  Object.values(controls).forEach((input) => {
    input.addEventListener("input", updateControlOutputs);
  });

  resetButton.addEventListener("click", () => {
    welcomePending = false;
    resetSimulation();
  });

  startButton.addEventListener("click", () => {
    welcomePending = false;
    playerName = playerNameInput.value.trim() || "Anonymous";
    localStorage.setItem("animalKingdomPlayerName", playerName);
    resetSimulation();
  });

  continueButton.addEventListener("click", () => {
    biodiversityLossAcknowledged = true;
    gameOver = false;
    paused = false;
    pauseButton.disabled = false;
    pauseButton.textContent = "⏸";
    simStatus.textContent = "Running";
    startOverlay.classList.add("is-hidden");
    lastFrame = performance.now();
  });

  document.querySelectorAll(".chart-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const series = button.dataset.series;
      CHART_SERIES[series].visible = !CHART_SERIES[series].visible;
      button.classList.toggle("active", CHART_SERIES[series].visible);
      drawChart();
    });
  });

  pauseButton.addEventListener("click", () => {
    if (gameOver) {
      return;
    }

    paused = !paused;
    pauseButton.textContent = paused ? "▶" : "⏸";
    simStatus.textContent = paused ? "Paused" : "Running";
    lastFrame = performance.now();
  });
}

function showWelcomeOverlay() {
  welcomePending = true;
  paused = true;
  pauseButton.disabled = true;
  pauseButton.textContent = "▶";
  simStatus.textContent = "Ready";
  gameOverTitle.textContent = "Begin your animal kingdom";
  gameOverMessage.textContent = "Start the ecosystem when you are ready.";
  continueButton.classList.add("is-hidden");
  startButton.textContent = "Start";
  playerNameInput.value = localStorage.getItem("animalKingdomPlayerName") || "";
  playerNamePanel.classList.remove("is-hidden");
  leaderboardPanel.classList.add("is-hidden");
  startOverlay.classList.remove("is-hidden");
}

createGrid();
preloadIcons();
bindEvents();
updateControlOutputs();
resetSimulation();
showWelcomeOverlay();
requestAnimationFrame(tick);
