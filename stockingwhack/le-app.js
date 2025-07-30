<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Forty Whack</title>
  <style>
    /* existing styles */

    /* --- Title entrance & page reveal --- */
    h1.title.centered {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    h1.title.move-up {
      transition: top 1s ease-in-out, transform 1s ease-in-out;
      top: 10px;
      transform: translate(-50%, 0);
    }
    /* Hide the rest of the page until the title animation finishes */
    #mainContent {
      opacity: 0;
      visibility: hidden;
      transition: opacity 1s ease-in-out;
    }
    #mainContent.visible {
      opacity: 1;
      visibility: visible;
    }
  </style>
</head>
<body>
  <h1 class="title centered" style="margin-top: 10px; margin-bottom: 20px;">
    <!-- title content -->
  </h1>

  <div id="mainContent">
  <h2>🇫🇷 Entrez les poquettes d'aujourd'hui 🇫🇷</h2>
  <!-- rest of page content -->

  <footer>
  </div><!-- /#mainContent -->
  </footer>

  <script>
    // existing audio-autoplay script
  </script>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      const title    = document.querySelector('h1.title');
      const lastSpan = title.querySelector('span:last-child');
      const content  = document.getElementById('mainContent');

      // When the final letter finishes its wave animation…
      lastSpan.addEventListener('animationend', function () {
        title.classList.add('move-up');   // slide the whole title to the top
        content.classList.add('visible'); // fade‑in the rest of the page
      }, { once: true });
    });
  </script>
</body>
</html>