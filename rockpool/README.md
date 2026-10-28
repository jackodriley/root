# The Rockpool

Static Bluetooth control page for potatocorp.ai/rockpool/. No build step or backend.

This folder belongs at `rockpool/` inside the `jackodriley/root` repository, alongside the domain's existing homepage. Commit and push its added files using GitHub Desktop, then wait for the repository's existing GitHub Pages deployment. This work does not change the homepage or publish automatically.

On iPhone, open https://potatocorp.ai/rockpool/ in Bluefy. Keep the board powered, tap Connect to Rockpool and select Faye's Rockpool. No iOS Settings pairing is normally needed. Controls appear only after a valid connection state is read. Tapping the crab reveals a labelled, disconnected preview.

Power and presets apply immediately. Colours apply on tap or when the shade wheel is released. Tide Speed applies on slider release. Timer scrolling is a draft: press Start timer to arm it. The board keeps animating and its timer keeps running after the page disconnects or closes.

During the onboard-LED test, Ocean is a blue/turquoise wave, Rainbow cycles hues, Red is a very dim red wave, and Custom uses the selected small moving palette. The one onboard RGB LED represents the first of the three final pixels; it cannot demonstrate spatial movement among three lights. On/off, six speeds and the real device-side sleep timer use the final protocol and controller. Boot starts off, while Bluetooth is discoverable.

Page protocol: v3, service `5f740001-6f63-4b70-9a79-726f636b706c`.

Firmware lives in the Rockpool project's `RockpoolWIP2810` Arduino sketch. It targets Seeed XIAO nRF52840 Plus with Seeed nRF52 Boards 1.1.13, Adafruit TinyUSB 1.7.0, NeoPixel 1.15.5 and Bluefruit 0.21.0. Onboard RGB proxy enabled; physical touch input disabled until the sensor is connected. No external electronics are needed for phone-control testing.

VT323 is bundled with its licence. Artwork prompts are recorded in `assets/GENERATION.md`.
