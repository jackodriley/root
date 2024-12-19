// Handles showing the additional text input when 'Other...' is selected
function showOtherField() {
    const select = document.getElementById('object');
    const otherInput = document.getElementById('otherObject');
    otherInput.style.display = select.value === 'other' ? 'block' : 'none';
}

// Called when the 'Generate Thought' button is clicked
async function generateThought() {
    // Hide the form wrapper (selection UX)
    document.querySelector('.form-wrapper').style.display = 'none';
  
    // Show the loading graphic
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
  
    // Get the user input values
    const objectSelect = document.getElementById('object');
    let object = objectSelect.value;
  
    // Handle custom object input if "Other..." is selected
    if (object === 'other') {
      object = document.getElementById('otherObject').value.trim() || 'an object';
    }
  
    // Default: Remove object from prompt if "Random" is selected
    if (object === 'random') {
      object = '';
    }
  
    const thinker = document.getElementById('thinker').value;
    const tabooMode = document.getElementById('tabooMode').checked;
  
    // Map thinker to the corresponding phrase and teachings
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
  
    // Construct the prompt
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
  
    console.log("Constructed prompt:", prompt); // Debugging log
  
    try {
        // Make the POST request to the backend
        const response = await fetch('https://us-central1-tttd-a18ee.cloudfunctions.net/generateThought', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
      
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
      
        const data = await response.json();
      
        // Gradually display the returned text
        const thoughtText = document.getElementById('thoughtText');
        thoughtText.textContent = ''; // Clear previous content
        thoughtText.style.visibility = 'visible';
      
        const lines = data.text.split('\n'); // Split response into lines
        lines.forEach((line, index) => {
          setTimeout(() => {
            thoughtText.textContent += line + '\n'; // Add each line with a delay
          }, index * 500); // Delay increases for each line
          setTimeout(() => {
            document.getElementById('resetButton').style.display = 'block';
          }, lines.length * 500); // Display button after all lines have loaded
        });

      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the thought: ' + error.message);
      } finally {
        // Hide the loading graphic
        loadingElement.style.display = 'none';
      }

}

function resetApp() {
    // Reset the app to its default state
    document.getElementById('thoughtText').style.visibility = 'hidden';
    document.getElementById('thoughtText').textContent = '';
    document.getElementById('resetButton').style.display = 'none';
    document.querySelector('.form-wrapper').style.display = 'block';
  }

// It's important to test each function to ensure they're working correctly in the browser.
// Check for console errors and ensure that the API integration works once added.