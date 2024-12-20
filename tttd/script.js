const objects = ["Random", "Cup", "Book", "Pen", "Laptop", "Phone", "Table", "Chair", "Bottle", "Notebook"];

function randomizeDropdowns() {
  randomizeDropdown('object', objects);
}

function randomizeDropdown(dropdownId, values) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = ''; // Clear existing options

  // Shuffle the values array
  const shuffledValues = values.sort(() => Math.random() - 0.5);

  // Add shuffled values to the dropdown
  shuffledValues.forEach(value => {
    const option = document.createElement('option');
    option.value = value.toLowerCase();
    option.text = value;
    dropdown.add(option);
  });

  // Select the first option by default
  dropdown.selectedIndex = 0;
}

// Handles showing the additional text input when 'Other...' is selected
function showOtherField() {
  const select = document.getElementById('object');
  const otherInput = document.getElementById('otherObject');
  otherInput.style.display = select.value === 'other' ? 'block' : 'none';
}

// Called when the 'Generate Thought' button is clicked
async function generateThought() {
  // Hide form, show loading
  document.querySelector('.form-wrapper').style.display = 'none';
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'block';

  const objectSelect = document.getElementById('object');
  let object = objectSelect.value;

  if (object === 'other') {
    object = document.getElementById('otherObject').value.trim() || 'an object';
  }

  if (object === 'random') {
    object = '';
  }

  const thinker = document.getElementById('thinker').value;
  const tabooMode = document.getElementById('tabooMode').checked;

  let thinkerPhrase = '';
  let teachings = '';
  switch (thinker) {
    case 'Vicar':
      thinkerPhrase = 'an eminent English vicar';
      teachings = 'Christian teachings';
      break;
    case 'Bishop':
      thinkerPhrase = 'an elderly Bishop';
      teachings = 'Old Testament teachings';
      break;
    case 'Rabbi':
      thinkerPhrase = 'an eminent rabbi';
      teachings = 'rabbinical teachings';
      break;
    case 'Humanist':
      thinkerPhrase = 'a trendy Humanist thinker';
      teachings = 'atheistic philosophical teachings';
      break;
    default:
      thinkerPhrase = 'an eminent English vicar';
      teachings = 'Christian teachings';
  }

  const tabooInstruction = tabooMode
    ? '[THE COMPOSITION SHOULD GROW INCREASINGLY UNHINGED AND END WITH ESSENTIALLY NONSENSICAL GARBAGE]'
    : '';

  const prompt =
    `PROMPT: "Write a ‘Thought for the Day’ in the style of BBC Radio 4, ` +
    `in the voice of ${thinkerPhrase}. The piece should be 250-350 words and begin ` +
    `${object ? `with an observation about an (imaginary) personal anecdote involving ${object}, ` : ''}` +
    `ideally proceeding from some humdrum detail about ordinary life. Expand into a ` +
    `moral and spiritual reflection, incorporating a balance of ${teachings} and ` +
    `relatable insights. Begin with Good Morning and Conclude with a glib, hopeful or ` +
    `thought-provoking takeaway for the audience. Maintain a reflective, inclusive, and ` +
    `eloquent tone throughout. ${tabooInstruction}"`;

  console.log("Constructed prompt:", prompt);

  // Set up a reassurance message after 15 seconds if still loading
  const reassuranceMessages = [
    "Patience, my child...",
    "Patience is a virtue...",
    "Heavenly things come to those who wait..."
  ];

  let reassuranceTimeout = setTimeout(() => {
    // Only show if we are still loading (check if loadingElement is visible)
    if (loadingElement.style.display !== 'none') {
      const randomMsg = reassuranceMessages[Math.floor(Math.random() * reassuranceMessages.length)];
      // Create or select an element to show the reassurance message
      let reassuranceElement = document.getElementById('reassuranceMessage');
      if (!reassuranceElement) {
        reassuranceElement = document.createElement('div');
        reassuranceElement.id = 'reassuranceMessage';
        reassuranceElement.style.textAlign = 'center';
        reassuranceElement.style.marginTop = '10px';
        reassuranceElement.style.fontStyle = 'italic';
        reassuranceElement.style.color = '#444';
        loadingElement.appendChild(reassuranceElement);
      }
      reassuranceElement.textContent = randomMsg;
    }
  }, 15000); // 15 seconds

  try {
    // Step 1: Fetch the generated text
    const textPromise = fetch('https://us-central1-tttd-a18ee.cloudfunctions.net/generateThought', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => data.text);

    const generatedText = await textPromise;

    // Step 2: Call ElevenLabs API to get TTS audio
    const elevenLabsApiKey = 'sk_aee9d0c6e4a1c2ed29c54251083bfb2eb53823fdfb1e5d13'; 
    const voiceId = 'ZAzIVQ2dY0CuoLzRn8tm';

    const audioPromise = fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: generatedText,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 1.0
        }
      })
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Audio generation failed: ${response.status}`);
      }
      return response.blob();
    });

    const [audioBlob] = await Promise.all([audioPromise]);

    // Clear the reassurance timeout since we've finished loading
    clearTimeout(reassuranceTimeout);

    // Hide the loading
    loadingElement.style.display = 'none';

    // Remove reassurance message if present
    const reassuranceElement = document.getElementById('reassuranceMessage');
    if (reassuranceElement) {
      reassuranceElement.remove();
    }

    // Prepare text and audio
    const thoughtText = document.getElementById('thoughtText');
    thoughtText.textContent = ''; 
    thoughtText.style.visibility = 'visible';

    const lines = generatedText.split('\n');

    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = document.getElementById('audioPlayer');
    audioElement.src = audioUrl;
    audioElement.hidden = false;

    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = audioUrl;
    downloadLink.download = 'thought-for-the-day.mp3';
    downloadLink.hidden = false;
    downloadLink.textContent = 'Download MP3';

    audioElement.play().catch((err) => console.warn("Auto-play may be blocked by browser:", err));

    lines.forEach((line, index) => {
      setTimeout(() => {
        thoughtText.textContent += line + '\n'; 
        if (index === lines.length - 1) {
          document.getElementById('resetButton').style.display = 'block';
        }
      }, index * 500);
    });

  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while generating the thought: ' + error.message);
    // Show the form again in case of error
    document.querySelector('.form-wrapper').style.display = 'block';
  }
}

function resetApp() {
  // Reset the app to its default state
  document.getElementById('thoughtText').style.visibility = 'hidden';
  document.getElementById('thoughtText').textContent = '';
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('downloadLink').hidden = true;
  const audioElement = document.getElementById('audioPlayer');
  audioElement.pause();
  audioElement.src = '';
  audioElement.hidden = true;
  document.querySelector('.form-wrapper').style.display = '';
}

// Call randomizeDropdowns on page load
window.onload = randomizeDropdowns;

// It's important to test each function to ensure they're working correctly in the browser.
// Check for console errors and ensure that the API integration works once added.