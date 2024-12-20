// Handles showing the additional text input when 'Other...' is selected
function showOtherField() {
    const select = document.getElementById('object');
    const otherInput = document.getElementById('otherObject');
    otherInput.style.display = select.value === 'other' ? 'block' : 'none';
}

// Called when the 'Generate Thought' button is clicked
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

  try {
    // Step 1: Fetch the generated text from your backend
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
    const elevenLabsApiKey = 'YOUR_ELEVENLABS_API_KEY'; 
    const voiceId = 'YOUR_VOICE_ID'; // e.g. "21m00Tcm4TlvDq8ikWAM"

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

    // Wait for both text and audio to be ready
    const [audioBlob] = await Promise.all([audioPromise]);

    // Now we have both text and audio
    // Hide the loading graphic
    loadingElement.style.display = 'none';

    // Prepare text and audio for display and playback
    const thoughtText = document.getElementById('thoughtText');
    thoughtText.textContent = ''; 
    thoughtText.style.visibility = 'visible';

    const lines = generatedText.split('\n');

    // Create audio URL from blob
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = document.getElementById('audioPlayer');
    audioElement.src = audioUrl;
    audioElement.hidden = false;

    // Prepare download link for the audio
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = audioUrl;
    downloadLink.download = 'thought-for-the-day.mp3';
    downloadLink.hidden = false;
    downloadLink.textContent = 'Download MP3';

    // Start playing audio and showing text lines in parallel
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
  document.querySelector('.form-wrapper').style.display = 'block';
}

function showOtherField() {
  const objectSelect = document.getElementById('object');
  const otherObject = document.getElementById('otherObject');
  if (objectSelect.value === 'other') {
    otherObject.style.display = 'inline-block';
  } else {
    otherObject.style.display = 'none';
  }
}

// It's important to test each function to ensure they're working correctly in the browser.
// Check for console errors and ensure that the API integration works once added.