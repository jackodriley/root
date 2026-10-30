'use strict';
const $=id=>document.getElementById(id),names=['Off','Ocean','Rainbow','Dark room','Custom colour','Weather','Sea meditation','Farm meditation','Forest meditation'],speeds=['0.25×','0.5×','0.75×','1× · Original','1.5×','2×'];
let device,commandChar,stateChar,confirmed=null,ready=false,busy=false,connecting=false,manual=false;
let hueDraft=false,timerDraft=false,timerValue=0,reportedAt=0,checking=false,revision=0,epoch=0;
let notificationWait=null,readChain=Promise.resolve(),previewUnlocked=false,pendingHue=null;
let transportChain=Promise.resolve(),weatherTransferChar=null,weatherStatusChar=null,weatherStatus=null,weatherSupported=false;
let weatherJob=null,weatherSequence=0,weatherMetadata=null,savedWeather=null,weatherError=false;
try{savedWeather=RockpoolWeather.checkStored(JSON.parse(localStorage.getItem('rockpool.weather.london.v1')));}catch(_){}
function gattRun(task,token=epoch){const result=transportChain.catch(()=>{}).then(()=>{if(token!==epoch)throw Error('Connection changed.');return bounded(task());});transportChain=result;return result;}
function weatherText(text){$('weatherMessage').textContent=text;}
function weatherCacheSave(pattern){savedWeather=pattern;try{localStorage.setItem('rockpool.weather.london.v1',JSON.stringify({...pattern,payload:Array.from(pattern.payload)}));}catch(_){} }
function renderWeather(){
 $('weatherButton').disabled=ready&&!weatherSupported;
 $('weatherButton').setAttribute('aria-pressed',String(ready&&confirmed?.mode===5));
 $('weatherButton').title=ready&&!weatherSupported?'Update Rockpool to use Weather.':'';
 $('weatherRefresh').disabled=Boolean(weatherJob)||(ready&&!weatherSupported);

 $('weatherCancel').hidden=!weatherJob;
 $('weatherSaved').hidden=!RockpoolWeather.eligible(savedWeather);
 $('weatherSaved').disabled=Boolean(weatherJob)||!ready||!weatherSupported;
 if(ready&&!weatherSupported)weatherText('Update Rockpool to use Weather. Your other controls still work.');
 if(!weatherJob&&!weatherError&&ready&&confirmed?.mode===5){
  const meta=weatherMetadata?.id===weatherStatus?.id?weatherMetadata:savedWeather?.id===weatherStatus?.id?savedWeather:null;
  if(meta){describeWeather(meta);weatherText(meta.kind==='synthetic'?'Synthetic test pattern playing — not a forecast.':meta.end<Date.now()/1000?'Saved weather pattern — refresh for a new forecast.':'Weather playing');}
  else{weatherText('Weather pattern playing');$('weatherDates').textContent='';}
 }
}
function describeWeather(p){
 const format=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const hour=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'});
 $('weatherDates').textContent=`${format.format(new Date(p.start*1000))} – ${format.format(new Date(p.end*1000))}`;
 $('weatherFetched').textContent=`Fetched ${format.format(new Date(p.fetched*1000))}${p.partial?' · Some detail unavailable':''}`;
 const colours=[];for(let i=0;i<25;i++)colours.push(`rgb(${Array.from(p.payload.slice(i*10,i*10+3)).join(',')}) ${i*15}deg`);
 const ring=$('weatherPalette');ring.style.setProperty('--forecast-colours','conic-gradient('+colours.join(',')+')');
 ring.querySelectorAll('.forecast-hour').forEach(node=>node.remove());
 for(const sample of p.samples||[]){
  const angle=(sample.time-p.start)/86400*2*Math.PI-Math.PI/2,condition=RockpoolWeather.condition(sample);
  const node=document.createElement('div');node.className='forecast-hour';node.setAttribute('role','listitem');
  const detail=`${format.format(new Date(sample.time*1000))}: ${condition.label}${sample.wind!==null?', wind '+sample.wind+' km/h':''}${sample.rain!==null?', rain '+sample.rain+' mm':''}`;
  node.setAttribute('aria-label',detail);node.title=detail;
  node.style.left=(50+40*Math.cos(angle))+'%';node.style.top=(50+40*Math.sin(angle))+'%';
  const time=document.createElement('span');time.textContent=hour.format(new Date(sample.time*1000))+':00';
  const icon=document.createElement('span');icon.className='forecast-emoji';icon.textContent=condition.emoji;
  time.setAttribute('aria-hidden','true');icon.setAttribute('aria-hidden','true');node.append(time,icon);ring.append(node);
 }
}
function acceptWeatherStatus(view){
 weatherStatus=RockpoolWeather.decodeStatus(view);
 if(weatherJob&&weatherJob.revision!==undefined&&weatherStatus.revision!==weatherJob.revision&&!(weatherJob.committing&&weatherStatus.playing&&weatherStatus.id===weatherJob.pattern?.id))cancelWeather('Weather loading cancelled. Your latest light setting is kept.');
 renderWeather();return weatherStatus;
}
async function readWeatherStatus(){const chr=weatherStatusChar;if(!chr)throw Error('Update Rockpool to use Weather.');return acceptWeatherStatus(await gattRun(()=>chr.readValue()));}
function weatherNotify(e){try{acceptWeatherStatus(e.target.value);}catch(e){cancelWeather(e.message);}}
function cancelWeather(text='Weather loading cancelled.'){
 const job=weatherJob;weatherSequence++;weatherJob=null;if(job)job.abort.abort();
 if(job?.pattern&&ready&&weatherTransferChar){const packet=RockpoolWeather.operation(0x13,job.pattern.id),chr=weatherTransferChar;gattRun(()=>chr.writeValueWithResponse(packet)).catch(()=>{});}
 if(job){weatherError=true;weatherText(text);}renderWeather();
}
async function loadWeather(kind='forecast'){
 if(weatherJob)return;weatherError=false;const previewOnly=!ready;
 if(!previewOnly&&!weatherSupported){weatherText('Update Rockpool to use Weather.');return;}
 const job={sequence:++weatherSequence,abort:new AbortController(),epoch,revision:undefined,pattern:null,committing:false};weatherJob=job;
 const current=()=>weatherJob===job&&weatherSequence===job.sequence&&(previewOnly||ready&&epoch===job.epoch);
 $('weatherPanel').hidden=false;renderWeather();weatherText(kind==='synthetic'?'Preparing synthetic test sky…':kind==='saved'?'Preparing saved weather…':'Getting your forecast…');
 let timeout;
 try{
  if(!previewOnly){const status=await readWeatherStatus();if(!current())return;job.revision=status.revision;}
  timeout=setTimeout(()=>job.abort.abort(),10000);
  if(kind==='saved'&&!RockpoolWeather.eligible(savedWeather))throw Error('Saved weather is too old. Refresh for a new forecast.');
  const pattern=kind==='synthetic'?RockpoolWeather.synthetic():kind==='saved'?savedWeather:await RockpoolWeather.fetchLondon(job.abort.signal);
  clearTimeout(timeout);if(!current())return;job.pattern=pattern;describeWeather(pattern);
  if(previewOnly){weatherText('');return;}
  const chr=weatherTransferChar;
  await gattRun(()=>chr.writeValueWithResponse(RockpoolWeather.begin(pattern,job.revision)));if(!current())return;
  for(let at=0;at<pattern.payload.length;at+=13){
   if(!current())return;weatherText(`Sending weather to your Rockpool… ${Math.round(at/pattern.payload.length*100)}%`);
   await gattRun(()=>chr.writeValueWithResponse(RockpoolWeather.chunk(pattern,at)));
  }
  if(!current())return;job.committing=true;weatherText('Checking your weather pattern…');
  await gattRun(()=>chr.writeValueWithResponse(RockpoolWeather.operation(0x12,pattern.id)));
  await readState();if(!current())return;await readWeatherStatus();if(!current())return;
  if(confirmed.mode!==5||weatherStatus.id!==pattern.id||!weatherStatus.playing)throw Error('Rockpool did not confirm the new pattern. Please retry.');
  track('rockpool_pattern',{pattern:'weather'});weatherMetadata=pattern;if(pattern.kind==='forecast')weatherCacheSave(pattern);
  weatherText(pattern.kind==='synthetic'?'Synthetic test pattern playing — not a forecast.':'Weather playing');
 }catch(e){
  if(current()){
   weatherError=true;weatherText(e.name==='AbortError'?'Weather request timed out. Please retry.':e.message||'Weather could not be loaded. Please retry.');
   if(job.pattern&&ready&&weatherTransferChar){const chr=weatherTransferChar;gattRun(()=>chr.writeValueWithResponse(RockpoolWeather.operation(0x13,job.pattern.id))).catch(()=>{});}
  }
 }finally{clearTimeout(timeout);if(weatherJob===job){weatherJob=null;renderWeather();}}
}
$('weatherButton').onclick=()=>{showModePanel('weather');weatherError=false;$('weatherPanel').hidden=false;renderWeather();if(confirmed?.mode!==5)loadWeather();};
$('weatherRefresh').onclick=()=>loadWeather();$('weatherSaved').onclick=()=>loadWeather('saved');$('weatherCancel').onclick=()=>cancelWeather();

function message(text){$('message').textContent=text;}
const seasideColours=[
 {hue:0,name:'Crab red',swatch:'#de6261'},
 {hue:30,name:'Shrimp orange',swatch:'#e8a16b'},
 {hue:60,name:'Sandy yellow',swatch:'#e7d886'},
 {hue:90,name:'Dune grass',swatch:'#b9ca85'},
 {hue:120,name:'Seaweed green',swatch:'#74ad87'},
 {hue:150,name:'Sea glass',swatch:'#85c9af'},
 {hue:180,name:'Lagoon turquoise',swatch:'#7dcbd0'},
 {hue:210,name:'Rockpool blue',swatch:'#79afd6'},
 {hue:240,name:'Deep sea',swatch:'#858dd0'},
 {hue:270,name:'Periwinkle purple',swatch:'#b39bd3'},
 {hue:300,name:'Anemone pink',swatch:'#d49bc9'},
 {hue:330,name:'Coral rose',swatch:'#db93ad'}
];
function preview(){
 const h=Number($('hue').value),choice=seasideColours.find(c=>c.hue===h);
 const label=choice?choice.name:'Your saved seaside shade';
 $('hueValue').textContent=label;
 const palette=`linear-gradient(90deg,hsl(${h-36} 72% 72%),hsl(${h} 72% 72%),hsl(${h+36} 72% 72%))`;
 for(const id of ['hueValue','colour-heading']){
  $(id).style.backgroundImage=palette;$(id).classList.add('shade-text');
 }
 $('rockPreview').style.setProperty('--selected-hue',h);
 $('rockPreview').setAttribute('aria-label',`Pixel art rockpool with a suspended shell. Colour preview: ${label}.`);
 $('palette').style.background=`linear-gradient(to right,hsl(${h-36} 65% 60%),hsl(${h} 65% 60%),hsl(${h+36} 65% 60%))`;
 $('palette').setAttribute('aria-label',`Preview of hues ${(h+324)%360} to ${(h+36)%360} degrees`);
 document.querySelectorAll('[data-colour]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.colour)===h)));
}
let wheelRotation=0,dragState=null,suppressColourClickUntil=0;
function turnWheel(degrees){wheelRotation=degrees;$('shadeRing').style.setProperty('--wheel-turn',degrees+'deg');}
function chooseColour(hue,align=true){
 $('hue').value=hue;hueDraft=true;preview();
 if(align){const target=-hue,delta=((target-wheelRotation+540)%360+360)%360-180;turnWheel(wheelRotation+delta);}
 if(ready){pendingHue=hue;flushHue();}
}
async function flushHue(){
 if(!ready||busy||pendingHue===null)return;
 const hue=pendingHue;pendingHue=null;
 await send([5,hue&255,hue>>8],'hue',hue);
}
$('previewCrab').onclick=()=>{previewUnlocked=true;render();};
function showControls(){
 const visible=ready||previewUnlocked,wasHidden=$('controls').hidden;
 $('controls').hidden=!visible;$('landingCrab').hidden=visible;
 $('previewNotice').hidden=!previewUnlocked||ready;
 $('connection').hidden=!ready&&!connecting;
 document.body.dataset.expanded=String(visible);
 if(visible&&wasHidden)positionColours();
}
function crabSpeed(code){
 const rate=[.25,.5,.75,1,1.5,2][code];
 // Updating playback rate preserves the crab's position through a speed change.
 for(const id of ['crabTraveller','crabSprite'])for(const a of $(id).getAnimations())a.updatePlaybackRate(rate);
}
function positionColours(){
 const wheel=$('colourWheel'),size=wheel.clientWidth,radius=size/2-27;
 document.querySelectorAll('[data-colour]').forEach((b,i)=>{
  const angle=(i*30-90)*Math.PI/180;
  b.style.left=(size/2+Math.cos(angle)*radius)+'px';b.style.top=(size/2+Math.sin(angle)*radius)+'px';
 });
}
for(const colour of seasideColours){
 const b=document.createElement('button');b.className='colour-option';b.type='button';
 b.dataset.colour=colour.hue;b.style.setProperty('--swatch',colour.swatch);
 b.setAttribute('aria-label',colour.name);b.setAttribute('aria-pressed','false');b.title=colour.name;
 b.onclick=()=>{if(performance.now()>=suppressColourClickUntil)chooseColour(colour.hue);};
 b.onkeydown=e=>{const keys={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};if(!(e.key in keys))return;e.preventDefault();const i=seasideColours.indexOf(colour),next=(i+keys[e.key]+12)%12;const buttons=document.querySelectorAll('[data-colour]');buttons[next].focus();chooseColour(seasideColours[next].hue);};
 $('shadeRing').append(b);
}
window.addEventListener('resize',positionColours);positionColours();
function pointerAngle(e){const r=$('colourWheel').getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;}
$('colourWheel').addEventListener('pointerdown',e=>{
 if(e.isPrimary===false || (e.pointerType==='mouse'&&e.button!==0))return;
 dragState={id:e.pointerId,x:e.clientX,y:e.clientY,last:pointerAngle(e),ring:!!e.target?.closest?.('.colour-option'),dragged:false};
});
$('colourWheel').addEventListener('pointermove',e=>{
 if(!dragState||e.pointerId!==dragState.id)return;
 if(!dragState.dragged){
  const dx=e.clientX-dragState.x,dy=e.clientY-dragState.y;
  if(Math.hypot(dx,dy)<8)return;
  // On touchscreens vertical gestures belong to page scrolling. A sideways
  // sweep turns the wheel; a cancelled scroll gesture never sends a colour.
  if(e.pointerType==='touch'&&!dragState.ring&&Math.abs(dy)>Math.abs(dx))return;
 }
 if(!dragState.dragged){dragState.dragged=true;$('colourWheel').classList.add('dragging');$('colourWheel').setPointerCapture(e.pointerId);}
 const angle=pointerAngle(e),delta=((angle-dragState.last+540)%360)-180;
 turnWheel(wheelRotation+delta);dragState.last=angle;
});
function finishColourTurn(e){
 if(!dragState||e.pointerId!==dragState.id)return;
 const dragged=dragState.dragged;dragState=null;$('colourWheel').classList.remove('dragging');
 if(dragged){
  suppressColourClickUntil=performance.now()+350;
  if($('colourWheel').hasPointerCapture(e.pointerId))$('colourWheel').releasePointerCapture(e.pointerId);
  turnWheel(Math.round(wheelRotation/30)*30);
  if(e.type!=='pointercancel'){const index=((-Math.round(wheelRotation/30)%12)+12)%12;chooseColour(seasideColours[index].hue,false);}
 }
}
$('colourWheel').addEventListener('pointerup',finishColourTurn);
$('colourWheel').addEventListener('pointercancel',finishColourTurn);
function renderTimerActions(){
 const enabled=ready&&!busy&&!connecting&&!isMeditationMode(confirmed?.mode);
 $('startTimer').textContent=timerValue?'Start timer':'Apply';
 $('startTimer').disabled=!enabled||!confirmed||(timerValue?!confirmed.mode:!confirmed.active);
 $('cancelTimer').hidden=!confirmed?.active;
}
function wheelSet(n,scroll=true){
 n=Math.max(0,Math.min(180,n));
 const previous=$('minute-'+timerValue),next=$('minute-'+n);
 if(previous)previous.setAttribute('aria-selected','false');
 timerValue=n;if(next)next.setAttribute('aria-selected','true');
 $('wheel').setAttribute('aria-activedescendant','minute-'+n);
 if(scroll&&Math.abs($('wheel').scrollTop-n*48)>.5)$('wheel').scrollTop=n*48;
 $('timerDraft').textContent=n?`${n} minute${n===1?'':'s'} selected`:'Off selected';
 renderTimerActions();
}
function render(){
 showControls();
 const enabled=ready&&!busy&&!connecting;
 document.querySelectorAll('[data-device]').forEach(e=>e.disabled=!enabled);
 $('wheel').setAttribute('aria-disabled','false');$('wheel').tabIndex=0;
 $('connect').disabled=busy||connecting;$('connect').textContent=connecting?'Connecting…':ready?'Disconnect':'Connect to Rockpool';
 document.body.dataset.connected=String(ready);
 $('speed').disabled=busy||connecting||isMeditationMode(confirmed?.mode);
 $('brightness').disabled=connecting||(ready&&!brightnessChar);
 $('brightness').title=ready&&!brightnessChar?'Update Rockpool to use brightness.':'';
 $('connectionText').textContent=connecting?'Connecting…':ready?"Connected to Faye's Rockpool":'Not connected';
 $('connectionShell').hidden=!ready;
 if(confirmed){
 $('current').textContent=(ready?'':'Last known: ')+names[confirmed.mode];$('power').textContent=confirmed.mode?'Turn off':'Turn on';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(confirmed.mode===Number(b.dataset.mode))));
 $('speed').value=confirmed.speed;$('speed').setAttribute('aria-valuetext',speeds[confirmed.speed]);crabSpeed(confirmed.speed);
 }
 renderTimerActions();
 $('timerHelp').textContent=confirmed?.mode?'':'Turn on your Rockpool to start a timer.';
 countdown();renderWeather();renderMeditations();
}
function receive(view){
 const s=Rockpool.decode(view);if(weatherJob&&confirmed&&s.mode!==confirmed.mode&&!(weatherJob.committing&&s.mode===5))cancelWeather('Weather loading cancelled by a newer light setting.');confirmed=s;if(meditationSession?.started&&s.mode!==6+meditationSession.index)stopMeditation(false);reportedAt=performance.now();checking=false;revision++;
 if(!hueDraft){$('hue').value=s.hue;preview();}
 if(!timerDraft)wheelSet(s.active?s.minutes:0);render();
 if(notificationWait){notificationWait();notificationWait=null;}
}
function notify(e){try{receive(e.target.value);}catch(e){fail(e);}}
function bounded(p,ms=5000){let t;return Promise.race([p,new Promise((_,reject)=>t=setTimeout(()=>reject(Error('Rockpool did not respond. Tap Connect to reconnect.')),ms))]).finally(()=>clearTimeout(t));}
function readState(){
 const ch=stateChar,token=epoch;
 const next=readChain.catch(()=>{}).then(async()=>{if(token!==epoch||!ch)throw Error('Connection changed.');const v=await gattRun(()=>ch.readValue(),token);if(token===epoch)receive(v);});readChain=next;return next;
}
function lost(){
 stopMeditation(false);
 if(weatherStatusChar)weatherStatusChar.removeEventListener('characteristicvaluechanged',weatherNotify);
 brightnessPending=null;brightnessChar=null;epoch++;ready=false;cancelWeather('Connection lost during weather loading.');weatherTransferChar=null;weatherStatusChar=null;weatherSupported=false;weatherStatus=null;$('weatherPanel').hidden=true;busy=false;connecting=false;hueDraft=timerDraft=false;pendingHue=null;previewUnlocked=false;
 if(stateChar)stateChar.removeEventListener('characteristicvaluechanged',notify);commandChar=stateChar=null;
 if(notificationWait){notificationWait();notificationWait=null;}
 render();if(!manual)message('Connection lost. Tap Connect to reconnect.');else message('Disconnected.');
}
function fail(e){message(e.message||'Connection failed. Tap Connect to retry.');manual=true;if(device?.gatt.connected)device.gatt.disconnect();else lost();message(e.message);}
async function connect(){
 if(ready){manual=true;device.gatt.disconnect();return;}
 if(meditationSession)stopMeditation(false);
 connecting=true;manual=false;message('');render();
 try{
 device=await navigator.bluetooth.requestDevice({filters:[{services:[Rockpool.service]}]});
 device.removeEventListener('gattserverdisconnected',lost);device.addEventListener('gattserverdisconnected',lost);
 const token=++epoch;const server=await bounded(device.gatt.connect());const service=await bounded(server.getPrimaryService(Rockpool.service));
 commandChar=await bounded(service.getCharacteristic(Rockpool.command));stateChar=await bounded(service.getCharacteristic(Rockpool.state));
 stateChar.addEventListener('characteristicvaluechanged',notify);await bounded(stateChar.startNotifications());
 hueDraft=timerDraft=false;await readState();
 if(confirmed.version>=4){
  try{weatherTransferChar=await bounded(service.getCharacteristic(Rockpool.weatherTransfer));weatherStatusChar=await bounded(service.getCharacteristic(Rockpool.weatherState));
   weatherStatusChar.addEventListener('characteristicvaluechanged',weatherNotify);await bounded(weatherStatusChar.startNotifications());await readWeatherStatus();weatherSupported=true;
  }catch(e){weatherSupported=false;weatherText('Weather unavailable: '+e.message);}
 }
 try{brightnessChar=await bounded(service.getCharacteristic('5f740006-6f63-4b70-9a79-726f636b706c'));const value=await gattRun(()=>brightnessChar.readValue());if(value.byteLength!==1||value.getUint8(0)<1||value.getUint8(0)>100)throw Error("Invalid brightness");setBrightness(value.getUint8(0));}catch(_){brightnessChar=null;}
 if(token!==epoch)throw Error('Connection changed.');ready=true;connecting=false;render();
 }catch(e){connecting=false;if(e.name==='NotFoundError'){message('');render();}else fail(e);}
}
async function send(bytes,kind,submittedHue){
 if(!ready||busy)return;if(bytes[0]<=5)cancelWeather('Weather loading cancelled by your new selection.');busy=true;message('');render();const token=epoch,before=revision;
 try{
 await gattRun(()=>commandChar.writeValueWithResponse(Uint8Array.from(bytes)));
 if(token!==epoch)throw Error('Connection lost. Tap Connect to reconnect.');
 if(revision===before)await new Promise(resolve=>{const timer=setTimeout(()=>{notificationWait=null;resolve();},2000);notificationWait=()=>{clearTimeout(timer);resolve();};});
 if(token!==epoch)throw Error('Connection lost. Tap Connect to reconnect.');
 if(revision===before)await readState();
 if(kind==='hue'&&pendingHue===null&&Number($('hue').value)===submittedHue){hueDraft=false;$('hue').value=confirmed.hue;preview();}
 if(bytes[0]<=5)track('rockpool_pattern',{pattern:names[confirmed.mode]});
 if(bytes[0]===6)track('rockpool_speed',{speed:bytes[1]});
 if(kind==='timer')track('rockpool_timer',{minutes:confirmed.minutes});
 if(kind==='timer'){timerDraft=false;wheelSet(confirmed.active?confirmed.minutes:0);}
 message('');
 }catch(e){fail(e);}finally{busy=false;render();if(pendingHue!==null)flushHue();}
}
function countdown(){
 const s=confirmed;if(!s?.active){$('countdown').textContent='No timer running';return;}
 if(!ready){$('countdown').textContent='Timer continues on your Rockpool';return;}
 const remaining=Math.max(0,Math.ceil(s.remaining-(performance.now()-reportedAt)/1000));
 $('countdown').textContent=remaining?`Turns off in ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} · ${s.minutes} min timer`:'Checking timer…';
 if(!remaining&&!checking&&!busy){checking=true;readState().catch(fail);}
}
$('connect').onclick=connect;$('power').onclick=()=>{showModePanel(null);send([confirmed.mode?0:4]);};
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{showModePanel(null);send([Number(b.dataset.mode)]);});
$('hue').oninput=()=>{hueDraft=true;preview();};
$('speed').oninput=()=>{$('speed').setAttribute('aria-valuetext',speeds[$('speed').value]);crabSpeed(Number($('speed').value));};$('speed').onchange=()=>send([6,Number($('speed').value)]);
const spacer=()=>{const s=document.createElement('div');s.className='spacer';return s;};$('wheel').append(spacer());
for(let n=0;n<=180;n++){const o=document.createElement('div');o.id='minute-'+n;o.role='option';o.textContent=n?`${n} min`:'Off';o.setAttribute('aria-selected',String(n===0));o.onclick=()=>{timerDraft=true;wheelSet(n);};$('wheel').append(o);}
$('wheel').append(spacer());let timerScrollFrame=0;
$('wheel').addEventListener('pointerdown',()=>{timerDraft=true;});
$('wheel').addEventListener('wheel',()=>{timerDraft=true;},{passive:true});
$('wheel').onscroll=()=>{
 // Read scrolling; never write scrollTop here. Native momentum and scroll-snap
 // own the movement, avoiding the old 120ms snap-back during an iPhone flick.
 if(timerScrollFrame)return;
 timerScrollFrame=requestAnimationFrame(()=>{
  timerScrollFrame=0;const n=Math.max(0,Math.min(180,Math.round($('wheel').scrollTop/48)));
  if(n!==timerValue){timerDraft=true;wheelSet(n,false);}
 });
};
$('wheel').onkeydown=e=>{let n=timerValue;if(e.key==='ArrowUp')n--;else if(e.key==='ArrowDown')n++;else if(e.key==='Home')n=0;else if(e.key==='End')n=180;else return;e.preventDefault();timerDraft=true;wheelSet(Math.max(0,Math.min(180,n)));};
$('startTimer').onclick=()=>send(timerValue?[7,timerValue,0]:[8],'timer');$('cancelTimer').onclick=()=>send([8],'timer');
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready){readState().then(()=>weatherSupported?readWeatherStatus():null).catch(fail);}});

function track(event,params){if(typeof gtag==='function')gtag('event',event,params);}
let brightnessChar=null,brightnessPending=null,brightnessSending=false;
function setBrightness(value){
 value=Math.max(1,Math.min(100,Number(value)||100));$('brightness').value=value;
 $('brightness').setAttribute('aria-valuetext',value+'%');
 $('brightnessThumb').style.setProperty('--brightness',(value-1)/99);
 $('brightnessThumb').dataset.icon=value<50?'moon':'sun';
 try{localStorage.setItem('rockpool.brightness',String(value));}catch(_){}
}
$('brightness').oninput=()=>setBrightness($('brightness').value);
$('brightness').onchange=async()=>{
 if(!ready||!brightnessChar)return;
 brightnessPending=Number($('brightness').value);if(brightnessSending)return;brightnessSending=true;
 try{while(brightnessPending!==null&&ready&&brightnessChar){const value=brightnessPending;brightnessPending=null;const chr=brightnessChar;await gattRun(()=>chr.writeValueWithResponse(Uint8Array.of(value)));track('rockpool_brightness',{brightness:value});}}
 catch(e){fail(e);}finally{brightnessSending=false;}
};
try{setBrightness(localStorage.getItem('rockpool.brightness'));}catch(_){setBrightness(100);}
$('customSlot').append($('customPanel'));
$('customise').onclick=()=>{const open=$('customPanel').hidden;showModePanel(open?'custom':null);if(open){positionColours();track('rockpool_customise',{});}};

const meditationTracks=[
 {name:'Sea',theme:'sea',duration:'2:28',src:'assets/Meditations/sea.m4a'},
 {name:'Farm',theme:'farm',duration:'1:55',src:'assets/Meditations/farm.m4a'},
 {name:'Forest',theme:'forest',duration:'1:06',src:'assets/Meditations/forest.m4a'}
];
let meditationSession=null,meditationSequence=0,meditationChoice=null;
function isMeditationMode(mode){return mode>=6&&mode<=8;}
function renderMeditations(){
 const supported=!ready||confirmed?.version>=5;
 $('meditationButton').disabled=busy||connecting;
 document.querySelectorAll('[data-meditation]').forEach(b=>{
  b.disabled=!supported||busy||connecting;
  b.setAttribute('aria-pressed',String(meditationSession?.index===Number(b.dataset.meditation)));
 });
 if(ready&&!supported)$('meditationMessage').textContent='Update your Rockpool to play matching meditation lights.';
}
function stopMeditation(turnOff=true){
 const session=meditationSession;meditationSession=null;meditationSequence++;
 $('meditationAudio').pause();
 if(session&&turnOff&&ready&&confirmed?.version>=5){
  const chr=commandChar,token=epoch;
  // Conditional stop: a late audio-ended event cannot turn off another mode.
  gattRun(()=>chr.writeValueWithResponse(Uint8Array.of(10)),token).then(()=>{if(token===epoch)return readState();}).catch(e=>{if(token===epoch)fail(e);});
 }
 renderMeditations();
}
function showModePanel(panel){
 $('speedSection').hidden=panel==='meditation';$('timerSection').hidden=panel==='meditation';
 if(panel!=='meditation')stopMeditation();
 if(panel!=='weather')cancelWeather();
 $('customPanel').hidden=panel!=='custom';$('customise').setAttribute('aria-expanded',String(panel==='custom'));
 $('weatherPanel').hidden=panel!=='weather';
 $('meditationPanel').hidden=panel!=='meditation';$('meditationButton').setAttribute('aria-expanded',String(panel==='meditation'));
}
async function startMeditation(index,fromPlayer=false){
 if(ready&&confirmed?.version<5)return;
 const trackInfo=meditationTracks[index];if(!trackInfo)return;
 cancelWeather();
 // Set ownership before play(): native play events must not start a second session.
 stopMeditation(false);
 const session={index,sequence:++meditationSequence,started:false,connected:ready};meditationSession=session;meditationChoice=index;
 const current=()=>meditationSession===session;
 const audio=$('meditationAudio');
 if(!fromPlayer){audio.src=trackInfo.src;audio.currentTime=0;}
 $('meditationPlayer').hidden=false;$('meditationPlayer').dataset.theme=trackInfo.theme;
 $('meditationTitle').textContent=trackInfo.name+' · '+trackInfo.duration;
 $('meditationMessage').textContent=ready?'Starting your meditation…':'';renderMeditations();
 try{
  // play() happens in the original click gesture for iPhone autoplay rules.
  const playback=audio.play();
  const chr=commandChar;
  const lights=session.connected?gattRun(()=>chr.writeValueWithResponse(Uint8Array.of(9,index))):Promise.resolve();
  await Promise.all([playback,lights]);if(!current())return;
  if(session.connected){await readState();if(!current())return;if(confirmed.mode!==6+index)throw Error('Rockpool did not start the meditation. Please try again.');}
  session.started=true;
  $('meditationMessage').textContent='';
  track(session.connected?'rockpool_pattern':'rockpool_meditation_preview',{pattern:'meditation_'+trackInfo.theme});
 }catch(e){
  if(current()){stopMeditation();$('meditationMessage').textContent=e.message||'Could not start this meditation. Please try again.';}
 }
}
$('meditationButton').onclick=()=>{const open=$('meditationPanel').hidden;showModePanel(open?'meditation':null);};
document.querySelectorAll('[data-meditation]').forEach(b=>b.onclick=()=>startMeditation(Number(b.dataset.meditation)));
$('meditationAudio').addEventListener('play',()=>{if(!meditationSession&&meditationChoice!==null&&!$('meditationPanel').hidden)startMeditation(meditationChoice,true);});
$('meditationAudio').addEventListener('ended',()=>{if(!meditationSession)return;stopMeditation();$('meditationMessage').textContent='Meditation complete. Your Rockpool is resting.';});
$('meditationAudio').addEventListener('error',()=>{if(!meditationSession)return;stopMeditation();$('meditationMessage').textContent='The recording could not be played. Please try again.';});
window.addEventListener('pagehide',()=>{stopMeditation();if(device?.gatt.connected&&isMeditationMode(confirmed?.mode))device.gatt.disconnect();});

wheelSet(0,false);preview();render();setInterval(countdown,250);
if(!navigator.bluetooth||!window.isSecureContext){$('connect').hidden=true;$('help').hidden=false;$('help').textContent='To control your Rockpool on iPhone, open this page in Bluefy.';const a=document.createElement('a');a.href='https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055';a.textContent='Get Bluefy on the App Store';$('help').append(document.createElement('br'),a);}
