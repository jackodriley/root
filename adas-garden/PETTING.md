# Pet your butterfly

Open the garden, add butterflies, then use **Pet your butterfly**. It pauses the garden and opens `adas-garden/pet-your-butterfly/` in a new tab. Keep the garden tab open to return without losing the game. Press Resume when you return.

## Projector setup

1. Use HTTPS on the deployed website (or localhost for local testing). Enable full screen before calibration.
2. Point the camera at the entire projection on the wall. Start camera and allow access. Choose another camera from the selector if necessary.
3. Check all four numbered projected targets are visible in the camera preview. Freeze the image and click their centres in order 1, 2, 3, 4. Choose Use calibration.
4. Choose an existing butterfly and Let it fly. Hold an open hand, palm towards the camera, close to the wall. The largest detected hand inside the projection is selected. The butterfly flies away gently if tracking is lost.
5. H reveals controls to change butterfly, recalibrate or stop the camera. Recalibrate after moving either the camera or projector. Resizing the display invalidates calibration automatically.

The calibration maps a flat wall, not depth. A hand far in front of the wall will have a parallax offset. Bright projection, deep shadows and occlusion can reduce hand detection. Rehearse on the actual setup before use. If tracking is unreliable, use Rehearse with mouse.

## Data and dependencies

Butterfly images and original attributes are copied to IndexedDB on this device when opening petting mode. Opening it again replaces that stored roster. The garden game itself is still not saved across reloads. Camera frames are neither uploaded nor recorded. The camera stops when leaving the petting page or pressing Stop camera. Hand tracking is MediaPipe Tasks Vision 0.10.21 (up to four hands), loaded from jsDelivr, with Google's hand-landmarker model. An internet connection is required for the initial downloads.

No build step or backend needed. All original attribute allocations are reused; Speed controls movement, Size controls wingspan, Vision controls turning responsiveness, and Cheekiness triggers spins and speed boosts.

## Verification

Automated checks cover perspective mapping, invalid calibration, largest-hand selection, out-of-projection hands and garden simulation. Browser checks covered roster transfer, selection and mouse rehearsal. Physical camera/projector alignment and live hand recognition require an on-site test.
