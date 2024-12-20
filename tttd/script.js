const objects = [
  "Achieving Enlightenment Through the Art of Finding a Pen That Works",
  "Meditations on the Slow Wi-Fi That Tests Our Patience and Faith",
  "The Moral Dilemmas of Eating the Last Pickled Onion in the Jar",
  "Nurturing the Soul While Attempting to Assemble Flat-Pack Furniture",
  "Divine Insights Gained from Trying to Fold a Fitted Sheet Alone",
  "Philosophical Lessons in Waiting for Ketchup to Exit the Bottle",
  "A Discourse on Ethics, Prompted by a Malfunctioning Toaster",
  "Navigating Inner Turmoil When the Lift Music is Unexpectedly Catchy",
  "The Sacred Art of Pretending to Understand Modern Art",
  "Silent Contemplation on Why the Printer Only Jams When You’re Late",
  "Overcoming Existential Angst Brought on by an Endless Queue at the Post Office",
  "Profound Truths Found in the Crease of a Misshapen Couch Cushion",
  "Moral Courage in the Face of Perpetually Tangled Headphone Wires",
  "Seeking Wisdom Amongst the Discounted Vegetables in the Supermarket",
  "Finding Inner Peace While Your Neighbor Learns the Bagpipes",
  "The Ethics of Eating Crisps in a Library: Crunching Through Conscience",
  "High Philosophy from the Company of a Judgmental Garden Gnome",
  "Cultivating Serenity During a Zoom Call with Your Microphone Muted",
  "Considering the Cosmos While Trying to Catch a Pickle That Slipped Off Your Burger",
  "The Prophetic Significance of a Tea Bag That Won’t Sink",
  "A Monk’s Reflection on the Eternal Mystery of Mismatched Tupperware Lids",
  "Contemplating the Moral Fabric of the Universe via Lost Hairpins",
  "Ethical Quandaries in the Realm of Borrowed Biros That Never Return",
  "Negotiating Your Soul’s Purpose While Choosing a Netflix Show",
  "The Human Condition as Illustrated by a Beeping Smoke Alarm at 3 AM",
  "Finding the Divine in a Misleading ‘Push’ Door That’s Really a ‘Pull’",
  "A Soul’s Pilgrimage Through the World of Expired Loyalty Cards",
  "Philosophical Inquiry into the Temptation of Eating Your Cake Before Dinner",
  "A Theological Interpretation of Why the Remote Is Never Where You Left It",
  "Navigating the Ethics of Using a Trolley with a Wobbly Wheel",
  "Quiet Contemplation in the Presence of Mystery: Who Ate My Lunch?",
  "The Moral Lessons Hidden in a Stubborn Stain on Your Best Shirt",
  "Revelations Found in the Eternal Wait for the Pop-Up Toaster",
  "Inner Growth Through Perfecting the Technique of Silent Yawning",
  "A Spiritual Dialogue with the Last Surviving Houseplant",
  "Eternal Wisdom from the Squeaky Floorboard in the Hall",
  "A Sublime Epiphany While Untangling Last Year’s Christmas Lights",
  "Moral Lessons Learned from Repeatedly Losing at Board Games",
  "Seeking Grace While Enduring a Long-Winded Voicemail Greeting",
  "Zen and the Art of Not Overreacting to a Car Alarm at Dawn",
  "Questioning Reality When the Superglue Tube Sticks to Your Fingers",
  "The Pilgrim’s Progress Through the Maze of an Overstuffed Wardrobe",
  "Moral Equilibrium in the Debate Over Spelling ‘Donut’ or ‘Doughnut’",
  "Wrestling with Conscience at the All-You-Can-Eat Buffet",
  "Profound Gratitude for Every Green Light on the Commute",
  "The Transcendent Significance of a Dropped Biscuit",
  "On Forgiving the Weather App That Always Predicts Wrongly",
  "Harmony Within Chaos: Finding Your Keys in the Junk Drawer",
  "Reflections on Being a Good Samaritan When a Stranger Asks for Directions You Don’t Know",
  "Metaphysical Perspectives from a Cup of Tea That’s Always Just Too Hot",
  "A Parable on Ambition: Why the Superglue and the Teabag Should Never Meet",
  "Theology of the Unread Magazine Pile Beside the Sofa",
  "The Quiet Rebellion of Wearing Mismatched Socks as a Moral Statement",
  "Enlightenment in the Clink of Your Spoon Against a Yogurt Pot",
  "Pondering Cosmic Justice in the Case of the Alarm That Didn’t Ring",
  "A Lesson in Humility from a Cookie That Crumbles Prematurely",
  "Experiencing Oneness While Attempting Yoga in a Too-Tight Space",
  "The Delicate Ethics of Deciding Who Keeps the Good Umbrella",
  "A Thoughtful Pause Over Why the Empty Fridge Still Attracts You",
  "Seeking the Sublime in a Drawer Full of Unlabeled Keys",
  "Philosophical Musings on Why We Keep ‘Just In Case’ Plastic Bags",
  "Revelations in the Steam Rising Off a Really Strong Coffee",
  "The Sacred Search for a Parking Spot That’s Near the Entrance",
  "Morality Reassessed After Witnessing a Squirrel Outsmart You",
  "The Silent Sermon of an Unread Instruction Manual",
  "A Soul’s Education in the Time It Takes for Your Phone to Update",
  "The Ethics of Offering Gum to a Friend Without Enough for Everyone",
  "Rationalizing the Need to Press the Lift Button Repeatedly",
  "The Mystery of Existence as Seen Through Crumbs in the Butter",
  "The Wistful Philosophy of a Lonely Sock on the Radiator",
  "When Existential Dread Meets a Fully Booked Dentist’s Schedule",
  "Moral Rectitude Measured in How You Spread Jam on Toast",
  "Reflections on Fate and Traffic Lights That Always Turn Red",
  "Emotional Alchemy: Turning a Cracked Phone Screen into Wisdom",
  "The Theology of a Constantly Dripping Tap That Only You Hear",
  "How the Universe Speaks Through a Sticky Post-it Note on Your Desk",
  "Coming to Terms With the Spiritual Weight of a Droopy Houseplant",
  "A Treatise on Self-Control When the Biscuits Are ‘For Guests Only’",
  "Seeking the Divine in the Unexpected Turn of a Wobbly Chair Leg",
  "The Sound of One Hand Clapping While Holding a Cup of Soup",
  "Moral Ambiguity in the Temptation to Snooze Your Alarm",
  "Heavenly Guidance in the Hunt for a Cell Phone Charger",
  "Philosophical Poise in the Face of a Shrunken Favorite Jumper",
  "On the Spiritual Nature of Receiving a Wrong Number Call",
  "Tranquility in the Wait for the Microwave to Finish Beeping",
  "Life Lessons Extracted from a Bent Fork in the Cutlery Drawer",
  "The Eternal Mystery of the Paper Jam at the Office Printer",
  "Salvation or Surrender: The Existential Choice of Using Decaf",
  "Austerity and Abundance in the Final Squeeze of Toothpaste",
  "Reflections on Mortality Courtesy of the Dead Battery in Your Torch",
  "A Soul’s Sanctuary in Unexpected Puddles and Wet Socks",
  "Kindness in the Face of a Phone That Autocorrects Your Name",
  "Divine Proportions in the Geometry of a Squished Sandwich",
  "On Finding Purpose: The Mystery of an Unlabeled Spice Jar",
  "The Ethics of Holding the Door Too Long for a Distant Stranger",
  "Reverence in the Quiet Rattle of a Nearly Empty Cereal Box",
  "A Moral Inventory at the Lost and Found of Unclaimed Gloves",
  "Contemplating Infinity When Your Tape Measure Springs Back",
  "The Pilgrimage to the Top Shelf Without a Step Ladder",
  "Humility in the Face of a Password You Can’t Remember",
  "Spiritual Renewal in That First Sip of a Perfectly Brewed Tea",
  "Unanswered Prayers and the Cat Who Ignores You Completely",
  "A Metaphysical Discussion on the Last Dust Bunny Under the Bed",
  "Finding Grace as You Attempt to Iron a Perpetually Creased Shirt",
  "Holy Longing in the Gaze Toward a Chocolate You Promised Not to Eat",
  "The Theology of Untouched Exercise Equipment in the Spare Room",
  "Coming to Terms with the Lint Roller That Never Truly Delints",
  "Existential Equations Written in the Rings Your Mugs Leave Behind",
  "The Grace to Accept Your Hairdryer’s Mysterious Burning Smell",
  "Prophetic Insights in the Lost Button You Found Too Late",
  "A Homily on the Patience Required by a Spinning Loading Icon",
  "The Silent Scriptures of Your Fridge’s Random Buzzing Noise",
  "Moral Dilemmas in Watching the Teabag Steep Just Long Enough",
  "Philosophy of the Raincoat You Always Forget on Rainy Days",
  "When the Divine Speaks Through Untuned Radio Static",
  "Contemplations on the Sock That Became Your Dog’s New Toy",
  "The Esoteric Meaning of a Grocery List You Can’t Decipher",
  "Lesson in Humility from the Card Game You Always Lose",
  "The Ethics of Salted vs. Unsalted Butter in a Peaceful Home",
  "Bowing to the Ineffable Wisdom of the Self-Checkouts’ Voice",
  "The Infinite Regression of Remotes for Devices You No Longer Own",
  "Spiritual Growth Observed in the Dust Accumulating on Your Shelf",
  "A Transcendental Glimpse Offered by a Jammed Window Latch",
  "Finding Closure in the Broken Zipper on Your Winter Coat",
  "Divine Comedy in the Half-Peeling Price Sticker on Your Mug",
  "Noble Aspirations in the Quest for the Perfectly Buttered Crumpet",
  "Redemption Found in an Overripe Banana You Forgot You Had",
  "Examining the Soul’s Depth by Searching for the TV Remote",
  "On Silence: When the Smoke Alarm Battery Finally Dies",
  "Refining Virtue While Untangling Your Necklace Chain",
  "Decoding Life’s Mysteries from the Wrinkles on Your Pillowcase",
  "The Moral Universe Encapsulated in a Half-Eaten Packet of Crisps",
  "A Theological Inquiry into Why a Simple Pen Always Goes Missing",
  "Longing for Transcendence in the Flat Soda You Left Out Overnight",
  "The Wisdom Gleaned from Almost Remembering a Dream",
  "Penance and the Difficulties of Pulling Weeds from Your Garden",
  "Contemplating Fate in the Pattern of Your Burnt Toast",
  "The Spiritual Significance of a Window That Won’t Stay Open",
  "Karmic Considerations at the Office Refrigerator’s Expired Milk",
  "The Ecclesiastical Echo of Your Footsteps in an Empty Hall",
  "Finding God in the Lost Keys Right After You Stop Searching",
  "Reflections on Human Folly Inspired by an Overflowing Bin",
  "The Ineffable Mystery of a Sticky Floor You Just Mopped",
  "Philosophical Impasse Reached by Two People Holding the Same Door",
  "Mindfulness Learned from Trimming Your Overgrown Hedge",
  "A Humble Sermon in the Pile of Unread Emails at Daybreak",
  "Metaphysical Musings on the Gap Between the Sofa Cushions",
  "An Ethical Dialogue with the Pigeon Eyeing Your Sandwich",
  "Subtle Theology in the Echo of a Car Horn You Can’t Explain",
  "The Deep Significance of Choosing Sparkling vs. Still Water",
  "On Seeking Clarity in a Cloudy Drinking Glass",
  "Virtue in Deciding Whether to Take the Tiniest Slice of Cake",
  "Omens and Portents in a Half-Closed Umbrella Indoors",
  "A Reflection on Compassion When a Stranger Sneezes Near You",
  "Ruminations on the Conundrum of an Always-Missing Shoelace",
  "The Sacred Choreography of Avoiding a Puddle in New Shoes",
  "Philosophy Distilled in the Drip of a Half-Shut Tap",
  "A Brief Meditation on Why Your Chair Won’t Stop Squeaking",
  "The Soul’s Journey Charted in the Supermarket Aisle Signs",
  "A Homily from the Purr of a Cat Who Ignores Your Existence",
  "Making Peace with the Alarm’s Snooze Button and Its False Promises",
  "Hearing the Divine in the Rattle of a Nearly Empty Pepper Grinder",
  "Parables Written in Your Handwriting’s Steady Decline",
  "Spiritual Accounting When the Receipt Printer Runs Out of Paper",
  "A Philosophical Ordeal in the Search for a Phone Signal",
  "Listening for the Voice of God in a Whoopee Cushion’s Echo",
  "Redefining Grace When a Fly Refuses to Leave the Room",
  "Learning from the Persistence of Weeds Between Pavement Cracks",
  "Drawing Moral Boundaries at the Office’s Communal Biscuits",
  "A Theodicy for the Missing Piece in Your Jigsaw Puzzle",
  "Moral Clarity Achieved by Finally Deleting Old Text Messages",
  "The Doctrine of Silence When Someone’s Telling a Long, Dull Story",
  "A Soul’s Recognition in the Mirror of a Pet Goldfish’s Gaze",
  "Seeking Salvation in the Promised Land of the Bottom of Your Bag",
  "The Morality of Staring Blankly at a ‘No Junk Mail’ Sign",
  "Absolution Attained Through the Catharsis of Correcting a Typo",
  "Divine Equity Considered While Splitting the Last Slice of Pizza",
  "A Quiet Sermon on the Incomprehensible World of Tax Forms",
  "The Existential Resonance of a Doorbell That Rings for No One",
  "On Grace: Quiet Acceptance of Your Phone’s Increasing Lag",
  "Virtue Discovered While Rehanging a Crooked Picture Frame",
  "Philosophical Weight of a Tilted Hat Rack in the Hallway",
  "A Contemplation on the Word That’s Always on the Tip of Your Tongue",
  "The Soul’s Longing Echoed in a Stray Shopping Trolley",
  "Revelations Granted by the Bent Pages of a Much-Used Cookbook",
  "Examining the Moral Fiber of a Chair with One Short Leg",
  "Illumination in the Gasp of Realizing You’ve Run Out of Milk",
  "A Refuge Found in the Steady Rhythm of a Dripping Gutter",
  "A Cosmic Joke Written in the Tangled Wires Behind Your TV",
  "Ethical Dimensions of Sneaking a Chocolate from Someone Else’s Stash",
  "The Path to Understanding Through an Unfinished Crossword Puzzle",
  "Righteous Indignation over a Coffee Cup Stain on the Table",
  "Confronting Mortality in the Expiration Dates of Spices",
  "When Theology Meets Thermostat Wars in Shared Offices",
  "Parables Learned from a Locked Door and a Missing Key",
  "A Gentle Reminder of Mortality in the Bruise on a Banana",
  "Unraveling the Soul’s Secrets in a Ball of Yarn",
  "Hearing the Sublime in a Single Bubble of Washing-Up Liquid",
  "Karmic Cycles Told by the Empty Ink Cartridge in Your Pen",
  "Transcendence in the Fresh Smell of a New Packet of Biscuits",
  "Pilgrimage in an Overcrowded Shoe Cupboard",
  "Reckoning with Truth in the Crinkle of a Crisp Packet at Midnight",
  "Valuing Patience While Waiting for Your Nail Polish to Dry",
  "Seeking Order in the Chaos of a Dozen Takeaway Menus",
  "A Parable of Modernity Told by an Unsent Text Draft",
  "Exalting the One, True Right-Sized Tupperware for Leftovers",
  "Prophetic Murmurs in the Hum of a Malfunctioning Fridge",
  "The Sanctity of Silence in the Pause Before Your Computer Restarts",
  "Confronting Vanity in the Smudged Surface of a Compact Mirror",
  "Moral Calibration over the Proper Placement of a Toothbrush",
  "Beholding Eternity in the Slowly Melting Ice Cube in Your Drink",
  "Spiritual Milestones Marked by Resealing a Packet of Crisps Successfully",
  "Summoning Courage to Face the Mystery of Leftover Containers",
  "A Truce with Destiny When Deciding Which Queue Will Move Faster",
  "Balancing the Scales of Justice at the Free Samples Counter",
  "Existential Drift in the Soft Whir of a Desk Fan",
  "Translating the Oracle of a Receipts Pile on Your Desk",
  "A Soul’s Fertile Ground Found in the Soil of a Wilted Plant Pot",
  "Discerning Voices in the Night: A Leaky Radiator’s Confession",
  "The Moral Quandary of Borrowing a Pen Without Returning It",
  "Appreciating Creation in the Pattern of an Overly Floral Wallpaper",
  "Meditations on Chivalry from Watching People Stand on a Bus",
  "Choosing Virtue in the Face of a Half-Eaten Chocolate Bar",
  "The Divine Whisper Hiding in a Squeaky Windshield Wiper",
  "Grappling with Destiny When Your Online Order Arrives Incorrect",
  "An Ascetic’s Path Embodied by Ignoring the Sweets at Reception",
  "The Grand Tapestry of Life Woven in a Stray Thread on Your Jumper",
  "A Voice Crying in the Wilderness: The Echo of an Empty Peanut Jar",
  "Revering the Unknown: The Mystery Detergent Stain on Your Collar",
  "Pilgrim’s Progress Narrated by a Dead Mobile Phone Battery",
  "Finding Purpose in a Rubber Band Strangely Left on Your Desk",
  "The Light at the End of the Tunnel Shown by a Flickering Bulb",
  "Pondering the Infinite in the Last Dribble of the Olive Oil Bottle",
  "The Still, Small Voice of Reason in a Pack of Unused Postcards",
  "Redemption Story in the Recovery of a Lost Receipt",
  "Chasing Shadows of Truth in the Back of the Kitchen Cupboard",
  "Hallowed Ground Discovered Beneath the Mysterious Carpet Stain",
  "Moral Lessons from Accidentally Sending a Text to the Wrong Person",
  "Finding Balance in the Uneasy Truce Between Socks and Sandals",
  "The Choir of Angels Hidden in Your Car’s Rattling Exhaust Pipe",
  "Philosophical Implications of a Dining Chair Always Left Askew",
  "The Theology of Echoes in an Empty Biscuit Tin",
  "A Serenade to the Universe from a Radio Station That Won’t Tune",
  "Epiphanies Found in the Backlit Keys of a Stubborn Keyboard",
  "Tempests in Teacups: The Stirring Spoon That Tells a Saga",
  "Morality as Reflected in Your Choice Between Wooden or Plastic Cutlery",
  "Reconciliation and a Creased Handkerchief in Your Pocket",
  "Wise Counsel Whispered by the Last Slice of a Stale Loaf",
  "Transcendence in the Struggle to Open a Stubborn Jar Lid",
  "Final Benedictions in the Soft Thud of Junk Mail Hitting the Mat"
];

function randomizeDropdowns() {
  randomizeDropdown('object', objects);
}

function randomizeDropdown(dropdownId, values) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = ''; // Clear existing options

  // Shuffle the values array
  const shuffledValues = values.sort(() => Math.random() - 0.5);

  // Add the first four shuffled values to the dropdown
  shuffledValues.slice(0, 4).forEach(value => {
    const option = document.createElement('option');
    option.value = value.toLowerCase();
    option.text = value;
    dropdown.add(option);
  });

  // Add the "Other..." option at the bottom
  const otherOption = document.createElement('option');
  otherOption.value = 'other';
  otherOption.text = 'Other...';
  dropdown.add(otherOption);

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
    "Heavenly things come to those who wait...",
    "Those who wait shall renew their strength...",
    "In patience, possess your souls...",
    "The fruit of the Spirit is love, joy, peace, patience...",
    "Be strong and take heart, and wait patiently...",
    "Rejoice in hope, be patient in tribulation, be constant in prayer...",
    "The testing of your faith produces patience...",
    "Let us run with perseverance the race marked out for us...",
    "Blessed are those who persevere under trial...",
    "Be joyful in hope, patient in affliction, faithful in prayer...",
    "Though it tarry, wait for it; because it will surely come...",
    "Let patience have her perfect work, that you may be perfect and complete...",
    "You need only to be still..."
  ];

// Replace the previous setTimeout code with this:
  const reassuranceInterval = setInterval(() => {
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
    } else {
      // If loading is done, clear the interval
      clearInterval(reassuranceInterval);
    }
  }, 9000); // 9 seconds

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
    clearTimeout(reassuranceInterval);

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