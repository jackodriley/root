# Your Rockpool

Static Bluetooth control page for potatocorp.ai/rockpool/. No build step or backend.

This folder belongs at `rockpool/` inside the `jackodriley/root` repository, alongside the domain's existing homepage. Commit and push its added files using GitHub Desktop, then wait for the repository's existing GitHub Pages deployment. This work does not change the homepage or publish automatically.

On iPhone, open https://potatocorp.ai/rockpool/ in Bluefy. Keep the board powered, tap Connect to Rockpool and select The Rockpool. No iOS Settings pairing is normally needed. Controls appear only after a valid connection state is read. Tapping the crab reveals a labelled, disconnected preview.

Power and presets apply immediately. Colours apply on tap or when the shade wheel is released. Tide Speed applies on slider release. Timer scrolling is a draft: press Start timer to arm it. The board keeps animating and its timer keeps running after the page disconnects or closes.

Ocean wanders through blue, turquoise and violet with independently changing brightness. Customise Rockpool expands the shade wheel inside the mode panel: colours swirl roughly 36° either side of the selected hue. Every power-on and pattern selection starts with a unified 450ms rainbow pass.

A single touch pauses/resumes the previous mode; two taps while paused select Ocean. Three taps select Rainbow; the existing fifteen-tap dim-red gesture remains. Timer expiry turns the rock off and clears the timer.

Brightness ranges from 1–100% of the existing safe output cap, applies across all modes, and is saved to the board's flash 1.5 seconds after the last change. The board's value takes precedence on connection; browser storage remembers the preview value. The optional read/write characteristic is `5f740006-6f63-4b70-9a79-726f636b706c`, a single byte (1–100). Older firmware retains normal controls with brightness disabled.

Page accepts protocol v3 (normal controls), v4 (including Weather), and v5 (including Meditations), service `5f740001-6f63-4b70-9a79-726f636b706c`.

Firmware lives in the Rockpool project's `RockpoolWIP2810` Arduino sketch. It targets Seeed XIAO nRF52840 Plus with Seeed nRF52 Boards 1.1.13, Adafruit TinyUSB 1.7.0, NeoPixel 1.15.5 and Bluefruit 0.21.0. Three external GRBW pixels on D2 and touch input on D1 are enabled.

VT323 is bundled with its licence. Artwork prompts are recorded in `assets/GENERATION.md`.

## Weather — fixed London stage

Weather uses a fixed forecast point near West Norwood, SE27 (51.43, -0.10). It does not request location access. Tap Weather to fetch and send the next 24 hours as a repeating 24-minute light pattern. Refresh explicitly for new weather; the page does not need to stay open after transfer. Tide Speed changes wave movement, not forecast progression.

Real forecasts are saved only after the board confirms activation; **Use saved weather** is available for six hours while that forecast still extends into the future. Resetting the board clears its weather buffer and starts Off.

Deploy this updated page before uploading the v4 sketch. Existing v3 boards retain their normal controls and show Weather as unavailable until updated. Include `weather.js` when copying this folder. See the project’s `WEATHER-IMPLEMENTATION.md` for verification and rollback details.

Each forecast hour has a moving palette for 50 seconds, followed by a smooth ten-second blend to the next palette. The final five seconds close the 24-minute loop. Every palette breathes even with little wind. The public synthetic/test controls have been removed; synthetic fixtures remain available to automated tests.

GA4 uses Potatocorp's existing `G-5WZEF7TFB5` property. Custom events: `rockpool_pattern`, `rockpool_customise`, `rockpool_brightness`, `rockpool_speed`, `rockpool_timer`. Pattern events are emitted after device confirmation; preview colour browsing does not log a hardware pattern change.

Turn the wheel by dragging from a coloured button; scroll the page from its centre or surrounding space. Keyboard arrows and tapping remain available.


## Meditations (protocol v5)

Meditations opens three tracks: Sea (2:28), Farm (1:55), Forest (1:06), using the supplied audio files. The native browser player provides play/pause, scrubbing and volume. Choosing a track starts audio directly in the click gesture and sends its matching pattern over Bluetooth. Old firmware keeps the existing controls but disables meditation tracks until updated. Disconnected preview can play audio without sending commands.

The measured loops are 147,561ms / 114,793ms / 66,409ms. Each has six slowly blended colour chapters, independent pixel movement and a seamless return to its start: sea blue/turquoise, meadow green/wheat gold, forest green/moss/shaded teal. Loops run on real elapsed time independently of Tide Speed. Pausing, buffering or seeking audio does not pause or stop the light loop. Native replay starts a new session.

Audio ending, a playback error, leaving the meditation panel or selecting another mode ends the session. A physical mode change pauses the browser audio; Bluetooth disconnection also exits the session and turns meditation lights off on the board. Closing the browser therefore cannot leave an unattended meditation loop. Ordinary modes still run independently after disconnecting. A previous sleep timer is cleared on meditation entry; new sleep timers are disabled until the session ends. This keeps the audio/session in charge of its ending.

Protocol v5 retains the ten-byte state: modes 6/7/8 represent Sea/Farm/Forest. Command `[9, theme]` starts theme 0/1/2; `[10]` stops only a meditation, leaving other modes untouched. This protects a newer pattern from a late audio completion. Deploy the page before uploading firmware v5.

## Weather ring and controls

The forecast scale is a ring with twelve markers, one at each two-hour break. Labels show London local hours and actual forecast conditions (sun/moon, cloud, rain, snow, fog, thunder or wind). The saved forecast includes display metadata; old saved patterns without those details need a refresh for symbols. Fetched time is separate above the Open-Meteo credit. Customise, Weather and Meditations panels are mutually exclusive.

Custom hue spread is now about ±36°, mirrored by the webpage palette. The brightness thumb shows only the moon below 50%, and only the sun at 50% and above.
