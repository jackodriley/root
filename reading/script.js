const words = ["Mum", "Dad", "Cat", "Dog", "Ball", "Cup", "Car", "Bed", "Bad", "Book", "Sun", "Moon", "Bird", "Fish", "Tree", "Milk", "Egg", "Hat", "Shoe", "Nose", "Ear", "Bag", "Fork", "Hand", "Foot", "Star", "Chair", "Duck", "Toy", "Bath", "Key", "Door", "Cake", "Pen", "Plane", "Bus", "Rain", "Grass", "House", "Sheep"];
let currentWordIndex = 0;

const wordDisplay = document.getElementById('word-display');
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const wellDoneBtn = document.getElementById('well-done-btn');
const wellDoneMessage = document.getElementById('well-done');
const cheerSound = document.getElementById('cheer-sound');

startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', showNextWord);
wellDoneBtn.addEventListener('click', showWellDoneMessage);

function startGame() {
    currentWordIndex = 0;
    startBtn.classList.add('hidden');
    nextBtn.classList.remove('hidden');
    wellDoneBtn.classList.remove('hidden');
    showWord();
}

function showWord() {
    wordDisplay.textContent = words[currentWordIndex];
}

function showNextWord() {
    if (currentWordIndex < words.length - 1) {
        currentWordIndex++;
        showWord();
        wellDoneMessage.classList.add('hidden');
    } else {
        wordDisplay.textContent = "You've finished the list!";
        nextBtn.classList.add('hidden');
        wellDoneBtn.classList.add('hidden');
    }
}

function showWellDoneMessage() {
    wellDoneMessage.classList.remove('hidden');
    cheerSound.play();
}

// Register the service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
    }).catch(function(error) {
        console.log('Service Worker registration failed:', error);
    });
}
