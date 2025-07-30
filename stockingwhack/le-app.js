<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Stockingwhack</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f0f0f0;
    margin: 0;
    padding: 0;
  }
  h1.title {
    font-family: 'VT323', monospace;
    font-size: 10vw;
    color: #002366;
    text-align: center;
    margin: 20px 0;
  }
  h2{ text-align:center; }
  #play-audio-button{
    display:block;
    margin:10px auto;
    font-family:'VT323',monospace;
    font-size:5vw;
    background:#fff;
    color:#002366;
    border:1px solid #002366;
  }
  @media(min-width:600px){
    #play-audio-button{font-size:20px;}
  }
  @media(min-width:600px){
    footer{font-size:10px;}
  }
  /* Override winner badges per table */
  #todayLeaderboard .winner::before      { content:'🐸 '; }
  #yesterdayLeaderboard .winner::before  { content:'🐌 '; }
</style>
</head>
<body>
  <h1 class="title">Stockingwhack</h1>
  <section>
    <h2>Entrée</h2>
    <!-- form and content here -->
  </section>
  <section>
    <h2>Classement</h2>
    <!-- leaderboard content here -->
  </section>
  <button id="play-audio-button">Play Audio</button>
  <footer style="text-align:center;margin-top:40px;font-size:1vw">
    &copy; 2024 POTATOCORP
  </footer>
  <script>
    (function(){
      const emojis=['🧀','🐌','🇫🇷'];
      const tbody=document.querySelector('#winnersTable tbody');
      const decorate=()=>{
        tbody.querySelectorAll('tr').forEach(tr=>{
          const cell=tr.cells[1];
          if(cell && !cell.dataset.decorated && cell.innerText.trim()!=='No winner' && cell.innerText.trim()!=='Pas de gagnant'){
            const emoji=emojis[Math.floor(Math.random()*emojis.length)];
            cell.innerHTML=emoji+' '+cell.innerHTML;
            cell.dataset.decorated='yes';
          }
        });
      };
      new MutationObserver(decorate).observe(tbody,{childList:true});
      decorate();
    })();
  </script>
</body>
</html>