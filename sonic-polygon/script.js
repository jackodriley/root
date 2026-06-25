const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

const speedInput = document.getElementById("speed");
const ballCountInput = document.getElementById("ballCount");
const sidesInput = document.getElementById("sides");
const rootSelect = document.getElementById("rootSelect");
const scaleTypeSelect = document.getElementById("scaleTypeSelect");
const releaseModeSelect = document.getElementById("releaseMode");
const delayControl = document.getElementById("delayControl");
const releaseDelayInput = document.getElementById("releaseDelay");
const speedVarianceInput = document.getElementById("speedVariance");
const volumeInput = document.getElementById("volume");
const soundStyleSelect = document.getElementById("soundStyle");
const toneModeSelect = document.getElementById("toneMode");
const collisionModeSelect = document.getElementById("collisionMode");
const magnetModeSelect = document.getElementById("magnetMode");
const magnetStrengthControl = document.getElementById("magnetStrengthControl");
const magnetStrengthInput = document.getElementById("magnetStrength");
const trailLengthInput = document.getElementById("trailLength");
const trailStyleSelect = document.getElementById("trailStyle");
const precisionModeSelect = document.getElementById("precisionMode");
const precisionCoordsControl = document.getElementById("precisionCoordsControl");
const precisionCoordsInput = document.getElementById("precisionCoords");
const precisionAngleControl = document.getElementById("precisionAngleControl");
const precisionAngleInput = document.getElementById("precisionAngle");
const precisionAngleOffsetControl = document.getElementById("precisionOffsetControl");
const precisionAngleOffsetInput = document.getElementById("precisionAngleOffset");
const startButton = document.getElementById("startButton");
const gameModeButton = document.getElementById("gameModeButton");
const pauseButton = document.getElementById("pauseButton");
const exitGameButton = document.getElementById("exitGameButton");
const appTitle = document.getElementById("appTitle");
const controlPanel = document.getElementById("controlPanel");
const controlStack = document.getElementById("controlStack");
const legend = document.getElementById("legend");
const targetHud = document.getElementById("targetHud");
const scoreHud = document.getElementById("scoreHud");
const gameDialog = document.getElementById("gameDialog");
const gameDialogText = document.getElementById("gameDialogText");
const targetNoteLabel = document.getElementById("targetNote");
const scoreValueLabel = document.getElementById("scoreValue");

const speedValue = document.getElementById("speedValue");
const ballCountValue = document.getElementById("ballCountValue");
const sidesValue = document.getElementById("sidesValue");
const releaseDelayValue = document.getElementById("releaseDelayValue");
const speedVarianceValue = document.getElementById("speedVarianceValue");
const volumeValue = document.getElementById("volumeValue");
const magnetStrengthValue = document.getElementById("magnetStrengthValue");
const trailLengthValue = document.getElementById("trailLengthValue");
const precisionAngleValue = document.getElementById("precisionAngleValue");
const precisionAngleOffsetValue = document.getElementById("precisionAngleOffsetValue");

const NOTE_INDEX = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const SCALES = {
  major: [0, 4, 7, 9, 2, 5, 11],
  minor: [0, 3, 7, 8, 2, 5, 10],
  pentatonic: [0, 2, 4, 7, 9],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const state = {
  running: false,
  audioReady: false,
  speed: Number(speedInput.value),
  ballCount: Number(ballCountInput.value),
  sides: Number(sidesInput.value),
  releaseMode: releaseModeSelect.value,
  releaseDelay: Number(releaseDelayInput.value),
  speedVariance: Number(speedVarianceInput.value),
  volume: Number(volumeInput.value) / 100,
  soundStyle: soundStyleSelect.value,
  toneEnabled: toneModeSelect.value === "on",
  collisionMode: collisionModeSelect.value === "on",
  magnetMode: magnetModeSelect.value === "on",
  magnetStrength: Number(magnetStrengthInput.value),
  trailLength: Number(trailLengthInput.value),
  trailStyle: trailStyleSelect.value,
  keyRoot: "C",
  keyMode: scaleTypeSelect.value,
  precisionMode: precisionModeSelect.value === "on",
  precisionCoords: { x: 0, y: 0 },
  releaseAngle: Number(precisionAngleInput.value),
  releaseAngleOffset: Number(precisionAngleOffsetInput.value),
  gameMode: false,
  gameLocked: false,
  gameSessionId: 0,
  level: 0,
  score: 0,
  targetWallIndex: null,
  polygon: [],
  wallFlashes: [],
  balls: [],
  pendingBalls: [],
  pointer: {
    active: false,
    x: 0,
    y: 0
  },
  lastFrame: performance.now(),
  noteFrequencies: [],
  noteNames: []
};

let audioContext;
let masterGain;
let droneOscillator;
let droneGain;
let droneFilter;
let droneLfo;
let droneLfoGain;

const LEVELS = [
  { level: 1, ballCount: 1, speed: 1.1, sides: 4, root: "C", mode: "major" },
  { level: 2, ballCount: 1, speed: 1.18, sides: 5, root: "D", mode: "minor" },
  { level: 3, ballCount: 1, speed: 1.26, sides: 6, root: "F", mode: "pentatonic" },
  { level: 4, ballCount: 1, speed: 1.34, sides: 7, root: "A", mode: "minor" },
  { level: 5, ballCount: 1, speed: 1.42, sides: 8, root: "E", mode: "chromatic" },
  { level: 6, ballCount: 1, speed: 1.5, sides: 9, root: "G", mode: "major" },
  { level: 7, ballCount: 1, speed: 1.58, sides: 10, root: "B", mode: "minor" }
];

const SOUND_STYLES = {
  arcade: { type: "square", attack: 0.004, release: 0.18, gain: 0.16, detune: 3, filter: 1800 },
  glass: { type: "triangle", attack: 0.008, release: 0.36, gain: 0.12, detune: 6, filter: 2800 },
  pulse: { type: "sawtooth", attack: 0.003, release: 0.14, gain: 0.09, detune: 10, filter: 1500 },
  bass: { type: "square", attack: 0.01, release: 0.28, gain: 0.18, detune: 0, filter: 900 }
};

function applyVolume() {
  if (masterGain && audioContext) {
    masterGain.gain.setValueAtTime(state.volume, audioContext.currentTime);
  }
}

function tonicFrequency() {
  return 440 * (2 ** (((60 + NOTE_INDEX[state.keyRoot]) - 69) / 12));
}

function getNoteNames(root, mode, count) {
  const baseIndex = NOTE_INDEX[root];
  const scale = SCALES[mode];
  return Array.from({ length: count }, (_, index) => {
    const degree = scale[index % scale.length];
    return NOTE_NAMES[(baseIndex + degree) % 12];
  });
}

function populateRootOptions() {
  NOTE_NAMES.forEach((root) => {
    const option = document.createElement("option");
    option.value = root;
    option.textContent = root;
    if (root === "C") {
      option.selected = true;
    }
    rootSelect.appendChild(option);
  });
}

function resizeCanvas() {
  const frame = canvas.parentElement.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.round(frame.width * ratio);
  canvas.height = Math.round(frame.height * ratio);
  canvas.style.width = `${frame.width}px`;
  canvas.style.height = `${frame.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  rebuildScene(false);
}

function getPolygonVertices(sides) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const radius = Math.min(width, height) * 0.37;
  const center = { x: width / 2, y: height / 2 };
  const startAngle = Math.PI / 2;
  const vertices = [];

  for (let i = 0; i < sides; i += 1) {
    const angle = startAngle + (i * Math.PI * 2) / sides;
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }

  return vertices;
}

function edgeNormal(start, end, center) {
  const edgeX = end.x - start.x;
  const edgeY = end.y - start.y;
  let nx = -edgeY;
  let ny = edgeX;
  const midpoint = { x: (start.x + end.x) * 0.5, y: (start.y + end.y) * 0.5 };
  const toCenterX = center.x - midpoint.x;
  const toCenterY = center.y - midpoint.y;

  if ((nx * toCenterX) + (ny * toCenterY) < 0) {
    nx *= -1;
    ny *= -1;
  }

  const length = Math.hypot(nx, ny) || 1;
  return { x: nx / length, y: ny / length };
}

function buildPolygon(sides) {
  const vertices = getPolygonVertices(sides);
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };

  return vertices.map((vertex, index) => {
    const next = vertices[(index + 1) % vertices.length];
    return {
      start: vertex,
      end: next,
      normal: edgeNormal(vertex, next, center),
      hue: (index / vertices.length) * 360,
      label: ""
    };
  });
}

function getFrequencies(root, mode, count) {
  const baseMidi = 48 + NOTE_INDEX[root];
  const scale = SCALES[mode];

  return Array.from({ length: count }, (_, index) => {
    const degree = scale[index % scale.length];
    const octaveShift = Math.floor(index / scale.length) * 12;
    const midi = baseMidi + degree + octaveShift;
    return 440 * (2 ** ((midi - 69) / 12));
  });
}

function randomInsidePolygon() {
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
  const limit = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.18;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * limit;
  return {
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance + 12
  };
}

function parsePrecisionCoords(raw) {
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) {
    return { x: 0, y: 0 };
  }
  return { x: parts[0], y: parts[1] };
}

function precisionStartPosition() {
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
  return {
    x: center.x + state.precisionCoords.x,
    y: center.y - state.precisionCoords.y
  };
}

function getVarianceMultiplier() {
  return state.speedVariance / 10;
}

function getBallSpeed(index) {
  const baseSpeed = 185;
  const multiplier = getVarianceMultiplier();
  const randomOffset = (Math.random() * 2 - 1) * multiplier * 120;
  const indexedOffset = index * multiplier * 8;
  return Math.max(65, baseSpeed + indexedOffset + randomOffset);
}

function createBall(index, mode) {
  const center = { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };
  let position = mode === "random" ? randomInsidePolygon() : center;
  let angle = mode === "synced"
    ? Math.random() * Math.PI * 2
    : ((Math.PI * 2) / state.ballCount) * index + Math.random() * 0.4;

  if (state.precisionMode) {
    position = precisionStartPosition();
    angle = ((state.releaseAngle + (state.releaseAngleOffset * index)) * Math.PI) / 180;
  }

  const speed = getBallSpeed(index);

  return {
    x: position.x,
    y: position.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 8,
    hue: (index / Math.max(state.ballCount, 1)) * 360,
    trail: [],
    trailSampleTimer: 0,
    rainbowOffset: Math.random() * 360
  };
}

function maxTrailImpressions() {
  return Math.round((state.trailLength / 10) * 25);
}

function recordTrail(ball, delta) {
  const maxPoints = maxTrailImpressions();
  if (maxPoints <= 0) {
    ball.trail = [];
    ball.trailSampleTimer = 0;
    return;
  }

  ball.trailSampleTimer += delta;

  while (ball.trailSampleTimer >= 0.1) {
    ball.trail.unshift({
      x: ball.x,
      y: ball.y,
      hue: ball.hue
    });
    ball.trailSampleTimer -= 0.1;
  }

  if (ball.trail.length > maxPoints) {
    ball.trail.length = maxPoints;
  }
}

function queueBallRelease() {
  state.balls = [];
  state.pendingBalls = [];

  if (state.releaseMode === "delayed") {
    state.pendingBalls = Array.from({ length: state.ballCount }, (_, index) => ({
      ball: createBall(index, "synced"),
      releaseAt: index * state.releaseDelay
    }));
    return;
  }

  state.balls = Array.from({ length: state.ballCount }, (_, index) => {
    return createBall(index, state.releaseMode);
  });
}

function releasePendingBalls(delta) {
  if (state.pendingBalls.length === 0) {
    return;
  }

  state.pendingBalls.forEach((entry) => {
    entry.releaseAt -= delta;
  });

  const ready = state.pendingBalls.filter((entry) => entry.releaseAt <= 0);
  if (ready.length > 0) {
    state.balls.push(...ready.map((entry) => entry.ball));
  }

  state.pendingBalls = state.pendingBalls.filter((entry) => entry.releaseAt > 0);
}

function rebuildScene(resetBalls = true) {
  state.polygon = buildPolygon(state.sides);
  state.wallFlashes = Array.from({ length: state.sides }, () => 0);
  state.noteFrequencies = getFrequencies(state.keyRoot, state.keyMode, state.sides);
  state.noteNames = getNoteNames(state.keyRoot, state.keyMode, state.sides);
  state.polygon.forEach((edge, index) => {
    edge.label = state.noteNames[index];
  });
  if (state.gameMode) {
    pickNextTarget();
  }

  if (resetBalls && state.running) {
    queueBallRelease();
  }
}

function pickNextTarget() {
  if (state.polygon.length === 0) {
    state.targetWallIndex = null;
    syncGameHud();
    return;
  }
  state.targetWallIndex = Math.floor(Math.random() * state.polygon.length);
  syncGameHud();
}

function resetGame() {
  state.gameMode = true;
  state.score = 0;
  state.level = 1;
  pickNextTarget();
}

function syncGameHud() {
  scoreValueLabel.textContent = `${state.score}`;
  targetNoteLabel.textContent = state.gameMode && state.targetWallIndex !== null
    ? state.noteNames[state.targetWallIndex]
    : "--";
  targetHud.classList.toggle("is-hidden", !state.gameMode);
  scoreHud.classList.toggle("is-hidden", !state.gameMode);
  appTitle.textContent = state.gameMode ? "Game Mode" : "Sonic Polygon";
  controlPanel.classList.toggle("game-only", state.gameMode);
  controlStack.classList.toggle("is-hidden", state.gameMode);
  startButton.classList.toggle("is-hidden", state.gameMode);
  gameModeButton.classList.toggle("is-hidden", state.gameMode);
  legend.classList.toggle("is-hidden", state.gameMode);
  exitGameButton.classList.toggle("is-hidden", !state.gameMode);
}

function showGameDialog(message) {
  gameDialogText.textContent = message;
  gameDialog.classList.remove("is-hidden");
}

function hideGameDialog() {
  gameDialog.classList.add("is-hidden");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentLevelConfig() {
  return LEVELS[Math.min(state.level - 1, LEVELS.length - 1)];
}

function applyLevelConfig(config) {
  state.ballCount = config.ballCount;
  state.speed = config.speed;
  state.sides = config.sides;
  state.keyRoot = config.root;
  state.keyMode = config.mode;
  state.toneEnabled = true;
  state.magnetMode = true;
  state.magnetStrength = 0.7;

  ballCountInput.value = String(config.ballCount);
  speedInput.value = String(config.speed);
  sidesInput.value = String(config.sides);
  rootSelect.value = config.root;
  scaleTypeSelect.value = config.mode;
  toneModeSelect.value = "on";
  magnetModeSelect.value = "on";
  magnetStrengthInput.value = "0.7";
  syncControlLabels();
}

async function startLevel(levelNumber) {
  const sessionId = state.gameSessionId;
  state.gameLocked = true;
  state.running = false;
  hideGameDialog();
  showGameDialog(`Starting level ${levelNumber} in 3`);
  for (const count of [2, 1]) {
    await delay(1000);
    if (sessionId !== state.gameSessionId || !state.gameMode) {
      return;
    }
    showGameDialog(`Starting level ${levelNumber} in ${count}`);
  }
  await delay(1000);
  if (sessionId !== state.gameSessionId || !state.gameMode) {
    return;
  }
  hideGameDialog();
  const config = currentLevelConfig();
  applyLevelConfig(config);
  rebuildScene(false);
  queueBallRelease();
  syncDrone();
  state.running = true;
  state.gameLocked = false;
  updatePauseButton();
}

async function advanceLevel() {
  const sessionId = state.gameSessionId;
  state.running = false;
  state.gameLocked = true;
  showGameDialog("Level complete");
  await delay(900);
  if (sessionId !== state.gameSessionId || !state.gameMode) {
    return;
  }
  state.level += 1;
  if (state.level > LEVELS.length) {
    showGameDialog("All levels complete");
    return;
  }
  state.score = 0;
  pickNextTarget();
  await startLevel(state.level);
}

async function endGame() {
  state.running = false;
  state.gameLocked = true;
  showGameDialog("Game over");
}

function exitGameMode() {
  state.gameSessionId += 1;
  state.gameMode = false;
  state.gameLocked = false;
  state.score = 0;
  state.level = 0;
  state.targetWallIndex = null;
  state.running = false;
  hideGameDialog();
  syncGameHud();
  updatePauseButton();
}

function setupAudio() {
  if (audioContext) {
    return;
  }

  audioContext = new window.AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = state.volume;
  masterGain.connect(audioContext.destination);
}

function stopDrone() {
  if (droneOscillator) {
    droneOscillator.stop();
    droneOscillator.disconnect();
    droneOscillator = null;
  }
  if (droneLfo) {
    droneLfo.stop();
    droneLfo.disconnect();
    droneLfo = null;
  }
  if (droneLfoGain) {
    droneLfoGain.disconnect();
    droneLfoGain = null;
  }
  if (droneGain) {
    droneGain.disconnect();
    droneGain = null;
  }
  if (droneFilter) {
    droneFilter.disconnect();
    droneFilter = null;
  }
}

function syncDrone() {
  if (!audioContext) {
    return;
  }

  if (!state.toneEnabled) {
    stopDrone();
    return;
  }

  const now = audioContext.currentTime;
  const frequency = tonicFrequency();

  if (!droneOscillator) {
    droneOscillator = audioContext.createOscillator();
    droneGain = audioContext.createGain();
    droneFilter = audioContext.createBiquadFilter();
    droneLfo = audioContext.createOscillator();
    droneLfoGain = audioContext.createGain();

    droneOscillator.type = "triangle";
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 900;
    droneGain.gain.value = 0.028;
    droneLfo.type = "sine";
    droneLfo.frequency.value = 0.19;
    droneLfoGain.gain.value = 220;

    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneFilter.frequency);
    droneOscillator.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    droneOscillator.start();
    droneLfo.start();
  }

  droneOscillator.frequency.setTargetAtTime(frequency, now, 0.3);
  droneGain.gain.setTargetAtTime(0.03, now, 0.5);
}

function playCollisionNote(wallIndex, intensity) {
  if (!audioContext || audioContext.state !== "running") {
    return;
  }

  const now = audioContext.currentTime;
  const frequency = state.noteFrequencies[wallIndex] || 220;
  const style = SOUND_STYLES[state.soundStyle];
  const oscillator = audioContext.createOscillator();
  const shimmer = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filterNode = audioContext.createBiquadFilter();

  oscillator.type = style.type;
  shimmer.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.setValueAtTime(-style.detune, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.01, now + 0.05);
  shimmer.frequency.setValueAtTime(frequency * 2, now);
  shimmer.detune.setValueAtTime(style.detune, now);

  filterNode.type = "lowpass";
  filterNode.frequency.setValueAtTime(style.filter, now);
  filterNode.Q.value = 2.5;

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.03, intensity * style.gain), now + style.attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + style.release);

  oscillator.connect(filterNode);
  shimmer.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(masterGain);
  oscillator.start(now);
  shimmer.start(now);
  oscillator.stop(now + style.release + 0.02);
  shimmer.stop(now + style.release + 0.02);
}

function closestPointOnSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return {
    x: start.x + dx * t,
    y: start.y + dy * t
  };
}

function applyMagnetForce(ball, delta) {
  if (!state.magnetMode || !state.pointer.active) {
    return;
  }

  const dx = state.pointer.x - ball.x;
  const dy = state.pointer.y - ball.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 1) {
    return;
  }

  const falloff = Math.max(0.18, 1 - Math.min(distance, 420) / 520);
  const acceleration = state.magnetStrength * 255 * falloff;
  const scale = (acceleration * delta) / distance;

  ball.vx += dx * scale;
  ball.vy += dy * scale;
}

function updatePhysics(delta) {
  if (state.gameLocked) {
    return;
  }
  const elapsed = delta * state.speed;

  state.wallFlashes = state.wallFlashes.map((value) => Math.max(0, value - delta * 1.8));
  releasePendingBalls(delta);

  state.balls.forEach((ball) => {
    applyMagnetForce(ball, elapsed);
    ball.x += ball.vx * elapsed;
    ball.y += ball.vy * elapsed;
    recordTrail(ball, delta);

    state.polygon.forEach((edge, edgeIndex) => {
      const closest = closestPointOnSegment(ball, edge.start, edge.end);
      const offsetX = ball.x - closest.x;
      const offsetY = ball.y - closest.y;
      const signedDistance = offsetX * edge.normal.x + offsetY * edge.normal.y;
      const velocityIntoWall = ball.vx * edge.normal.x + ball.vy * edge.normal.y;

      if (signedDistance <= ball.radius && velocityIntoWall < 0) {
        const overlap = ball.radius - signedDistance + 0.8;
        ball.x += edge.normal.x * overlap;
        ball.y += edge.normal.y * overlap;
        ball.vx -= 2 * velocityIntoWall * edge.normal.x;
        ball.vy -= 2 * velocityIntoWall * edge.normal.y;

        state.wallFlashes[edgeIndex] = 1;
        ball.hue = edge.hue;
        if (state.gameMode) {
          if (edgeIndex === state.targetWallIndex) {
            state.score += 1;
            if (state.score >= 10) {
              advanceLevel();
            } else {
              pickNextTarget();
            }
          } else {
            state.score = Math.max(-10, state.score - 1);
            syncGameHud();
            if (state.score <= -10) {
              endGame();
            }
          }
        }
        playCollisionNote(edgeIndex, Math.min(1, Math.abs(velocityIntoWall) / 260));
      }
    });
  });

  if (state.collisionMode) {
    resolveBallCollisions();
  }
}

function resolveBallCollisions() {
  for (let i = 0; i < state.balls.length; i += 1) {
    for (let j = i + 1; j < state.balls.length; j += 1) {
      const a = state.balls[i];
      const b = state.balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy) || 0.0001;
      const minDistance = a.radius + b.radius;

      if (distance >= minDistance) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = (minDistance - distance) * 0.5;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const relativeVelocityX = a.vx - b.vx;
      const relativeVelocityY = a.vy - b.vy;
      const speedAlongNormal = (relativeVelocityX * nx) + (relativeVelocityY * ny);

      if (speedAlongNormal > 0) {
        continue;
      }

      a.vx -= speedAlongNormal * nx;
      a.vy -= speedAlongNormal * ny;
      b.vx += speedAlongNormal * nx;
      b.vy += speedAlongNormal * ny;
    }
  }
}

function drawPolygon() {
  ctx.save();
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  state.polygon.forEach((edge, index) => {
    const flash = state.wallFlashes[index];
    const hue = (edge.hue + flash * 25) % 360;
    const saturation = 70 + flash * 20;
    const lightness = 42 + flash * 24;

    ctx.beginPath();
    ctx.moveTo(edge.start.x, edge.start.y);
    ctx.lineTo(edge.end.x, edge.end.y);
    ctx.strokeStyle = `hsl(${hue} ${saturation}% ${lightness}%)`;
    ctx.shadowColor = `hsla(${hue} 90% 65% / ${0.12 + flash * 0.55})`;
    ctx.shadowBlur = 10 + flash * 28;
    ctx.stroke();
  });

  ctx.restore();
}

function drawEdgeLabels() {
  ctx.save();
  ctx.font = '22px "VT323", monospace';
  ctx.fillStyle = "rgba(142, 249, 201, 0.88)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(16, 255, 148, 0.24)";
  ctx.shadowBlur = 10;

  state.polygon.forEach((edge) => {
    const midpointX = (edge.start.x + edge.end.x) * 0.5;
    const midpointY = (edge.start.y + edge.end.y) * 0.5;
    const labelX = midpointX - edge.normal.x * 28;
    const labelY = midpointY - edge.normal.y * 28;
    ctx.fillText(edge.label, labelX, labelY);
  });

  ctx.restore();
}

function drawBalls() {
  state.balls.forEach((ball) => {
    drawTrail(ball);
    drawArcadeBall(ball);
  });
}

function drawArcadeBall(ball) {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.shadowColor = `hsla(${ball.hue} 95% 60% / 0.4)`;
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.fillStyle = `hsla(${ball.hue} 88% 46% / 1)`;
  ctx.arc(0, 0, ball.radius + 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsla(${ball.hue} 100% 78% / 0.92)`;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillRect(-ball.radius * 0.55, -ball.radius * 0.55, ball.radius * 0.45, ball.radius * 0.45);

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(-ball.radius * 0.9, -1, ball.radius * 1.8, 2);
  ctx.restore();
}

function drawTrail(ball) {
  if (state.trailLength <= 0 || ball.trail.length === 0) {
    return;
  }

  if (state.trailStyle === "solid") {
    drawSolidTrail(ball);
    return;
  }

  if (state.trailStyle === "impressions") {
    drawImpressionTrail(ball);
    return;
  }

  drawRainbowTrail(ball);
}

function drawSolidTrail(ball) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);

  ball.trail.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });

  ctx.strokeStyle = `hsla(${ball.hue} 82% 52% / 0.34)`;
  ctx.lineWidth = Math.max(2, ball.radius * 0.95);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = `hsla(${ball.hue} 90% 62% / 0.18)`;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();
}

function drawImpressionTrail(ball) {
  ctx.save();
  ball.trail.forEach((point, index) => {
    const alpha = 1 - index / Math.max(ball.trail.length, 1);
    ctx.beginPath();
    ctx.fillStyle = `hsla(${point.hue} 80% 54% / ${alpha * 0.28})`;
    ctx.arc(point.x, point.y, Math.max(2.5, ball.radius * (0.92 - index * 0.02)), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawRainbowTrail(ball) {
  const points = [{ x: ball.x, y: ball.y }, ...ball.trail];
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.lineWidth = Math.max(2, ball.radius * 0.78);
  ctx.lineCap = "round";

  for (let index = 0; index < points.length - 1; index += 1) {
    const alpha = 1 - index / Math.max(points.length - 1, 1);
    const hue = (ball.rainbowOffset + index * 18) % 360;
    ctx.beginPath();
    ctx.moveTo(points[index].x, points[index].y);
    ctx.lineTo(points[index + 1].x, points[index + 1].y);
    ctx.strokeStyle = `hsla(${hue} 90% 58% / ${alpha * 0.48})`;
    ctx.stroke();
  }

  ctx.restore();
}

function drawBackdrop() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 1800);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `rgba(0, 12, 8, ${0.96 - pulse * 0.06})`);
  gradient.addColorStop(1, `rgba(0, 4, 10, ${0.98 - pulse * 0.04})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.36;
  ctx.strokeStyle = "rgba(49, 255, 167, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 32; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 32; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  drawBackdrop();
  drawPolygon();
  drawEdgeLabels();
  drawBalls();
}

function animate(timestamp) {
  const delta = Math.min(0.032, (timestamp - state.lastFrame) / 1000);
  state.lastFrame = timestamp;

  if (state.running) {
    updatePhysics(delta);
  }

  render();
  requestAnimationFrame(animate);
}

function syncControlLabels() {
  speedValue.textContent = `${state.speed.toFixed(2)}x`;
  ballCountValue.textContent = `${state.ballCount}`;
  sidesValue.textContent = `${state.sides}`;
  releaseDelayValue.textContent = `${state.releaseDelay.toFixed(2)}s`;
  speedVarianceValue.textContent = `${state.speedVariance}`;
  volumeValue.textContent = `${Math.round(state.volume * 100)}%`;
  magnetStrengthValue.textContent = `${state.magnetStrength.toFixed(1)}`;
  trailLengthValue.textContent = `${state.trailLength}`;
  precisionAngleValue.textContent = `${state.releaseAngle}deg`;
  precisionAngleOffsetValue.textContent = `${state.releaseAngleOffset}deg`;
}

function syncReleaseControls() {
  delayControl.classList.toggle("is-hidden", state.releaseMode !== "delayed");
}

function syncMagnetControls() {
  magnetStrengthControl.classList.toggle("is-hidden", !state.magnetMode);
}

function syncPrecisionControls() {
  const hidden = !state.precisionMode;
  precisionCoordsControl.classList.toggle("is-hidden", hidden);
  precisionAngleControl.classList.toggle("is-hidden", hidden);
  precisionAngleOffsetControl.classList.toggle("is-hidden", hidden);
}

function updatePauseButton() {
  pauseButton.disabled = state.gameLocked || (!state.running && state.balls.length === 0);
  pauseButton.textContent = state.running ? "Pause" : "Resume";
}

function updateKeyFromSelect() {
  state.keyRoot = rootSelect.value;
  state.keyMode = scaleTypeSelect.value;
  rebuildScene(false);
  syncDrone();
  syncGameHud();
}

function bindControls() {
  speedInput.addEventListener("input", () => {
    state.speed = Number(speedInput.value);
    syncControlLabels();
  });

  ballCountInput.addEventListener("input", () => {
    state.ballCount = Number(ballCountInput.value);
    syncControlLabels();
    if (state.running) {
      queueBallRelease();
    }
  });

  sidesInput.addEventListener("input", () => {
    state.sides = Number(sidesInput.value);
    syncControlLabels();
    rebuildScene(state.running);
  });

  rootSelect.addEventListener("change", updateKeyFromSelect);
  scaleTypeSelect.addEventListener("change", updateKeyFromSelect);

  releaseModeSelect.addEventListener("change", () => {
    state.releaseMode = releaseModeSelect.value;
    syncReleaseControls();
    if (state.running) {
      queueBallRelease();
      updatePauseButton();
    }
  });

  releaseDelayInput.addEventListener("input", () => {
    state.releaseDelay = Number(releaseDelayInput.value);
    syncControlLabels();
    if (state.running && state.releaseMode === "delayed") {
      queueBallRelease();
      updatePauseButton();
    }
  });

  speedVarianceInput.addEventListener("input", () => {
    state.speedVariance = Number(speedVarianceInput.value);
    syncControlLabels();
    if (state.running) {
      queueBallRelease();
      updatePauseButton();
    }
  });

  volumeInput.addEventListener("input", () => {
    state.volume = Number(volumeInput.value) / 100;
    syncControlLabels();
    applyVolume();
  });

  soundStyleSelect.addEventListener("change", () => {
    state.soundStyle = soundStyleSelect.value;
  });

  toneModeSelect.addEventListener("change", () => {
    state.toneEnabled = toneModeSelect.value === "on";
    syncDrone();
  });

  collisionModeSelect.addEventListener("change", () => {
    state.collisionMode = collisionModeSelect.value === "on";
  });

  magnetModeSelect.addEventListener("change", () => {
    state.magnetMode = magnetModeSelect.value === "on";
    syncMagnetControls();
  });

  magnetStrengthInput.addEventListener("input", () => {
    state.magnetStrength = Number(magnetStrengthInput.value);
    syncControlLabels();
  });

  trailLengthInput.addEventListener("input", () => {
    state.trailLength = Number(trailLengthInput.value);
    syncControlLabels();
  });

  trailStyleSelect.addEventListener("change", () => {
    state.trailStyle = trailStyleSelect.value;
  });

  precisionModeSelect.addEventListener("change", () => {
    state.precisionMode = precisionModeSelect.value === "on";
    syncPrecisionControls();
  });

  precisionCoordsInput.addEventListener("input", () => {
    state.precisionCoords = parsePrecisionCoords(precisionCoordsInput.value);
  });

  precisionAngleInput.addEventListener("input", () => {
    state.releaseAngle = Number(precisionAngleInput.value);
    syncControlLabels();
  });

  precisionAngleOffsetInput.addEventListener("input", () => {
    state.releaseAngleOffset = Number(precisionAngleOffsetInput.value);
    syncControlLabels();
  });

  startButton.addEventListener("click", async () => {
    setupAudio();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    state.gameMode = false;
    state.score = 0;
    state.running = true;
    state.audioReady = true;
    startButton.textContent = "Restart";
    queueBallRelease();
    updatePauseButton();
    rebuildScene(false);
    syncDrone();
    syncGameHud();
  });

  gameModeButton.addEventListener("click", async () => {
    setupAudio();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    state.gameSessionId += 1;
    resetGame();
    state.audioReady = true;
    startButton.textContent = "Restart";
    syncGameHud();
    updatePauseButton();
    await startLevel(1);
  });

  exitGameButton.addEventListener("click", () => {
    exitGameMode();
  });

  pauseButton.addEventListener("click", async () => {
    if (!state.running && state.balls.length === 0 && state.pendingBalls.length === 0) {
      return;
    }

    if (state.running) {
      state.running = false;
      if (audioContext && audioContext.state === "running") {
        await audioContext.suspend();
      }
    } else {
      setupAudio();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      state.running = true;
      syncDrone();
    }

    updatePauseButton();
  });

  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    state.pointer.active = true;
    state.pointer.x = event.clientX - rect.left;
    state.pointer.y = event.clientY - rect.top;
  });

  canvas.addEventListener("pointerleave", () => {
    state.pointer.active = false;
  });
}

populateRootOptions();
state.precisionCoords = parsePrecisionCoords(precisionCoordsInput.value);
updateKeyFromSelect();
syncControlLabels();
syncGameHud();
syncReleaseControls();
syncMagnetControls();
syncPrecisionControls();
bindControls();
resizeCanvas();
updatePauseButton();
render();
requestAnimationFrame(animate);
