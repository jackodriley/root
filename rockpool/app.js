'use strict';
const $=id=>document.getElementById(id),names=['Off','Ocean','Rainbow','Dark room','Custom colour'],speeds=['0.25×','0.5×','0.75×','1× · Original','1.5×','2×'];
let device,commandChar,stateChar,confirmed=null,ready=false,busy=false,connecting=false,manual=false;
let hueDraft=false,timerDraft=false,timerValue=0,reportedAt=0,checking=false,revision=0,epoch=0;
let notificationWait=null,readChain=Promise.resolve(),previewUnlocked=false,pendingHue=null;
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
 const palette=`linear-gradient(90deg,hsl(${h} 72% 72%),hsl(${(h+30)%360} 72% 72%))`;
 for(const id of ['hueValue','colour-heading']){
  $(id).style.backgroundImage=palette;$(id).classList.add('shade-text');
 }
 $('rockPreview').style.setProperty('--selected-hue',h);
 $('rockPreview').setAttribute('aria-label',`Pixel art rockpool with a suspended shell. Colour preview: ${label}.`);
 $('palette').style.background=`linear-gradient(to right,hsl(${h} 65% 60%),hsl(${(h+15)%360} 65% 60%),hsl(${(h+30)%360} 65% 60%))`;
 $('palette').setAttribute('aria-label',`Preview of hues ${h} to ${(h+30)%360} degrees`);
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
 dragState={id:e.pointerId,x:e.clientX,y:e.clientY,last:pointerAngle(e),dragged:false};
});
$('colourWheel').addEventListener('pointermove',e=>{
 if(!dragState||e.pointerId!==dragState.id)return;
 if(!dragState.dragged){
  const dx=e.clientX-dragState.x,dy=e.clientY-dragState.y;
  if(Math.hypot(dx,dy)<8)return;
  // On touchscreens vertical gestures belong to page scrolling. A sideways
  // sweep turns the wheel; a cancelled scroll gesture never sends a colour.
  if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx))return;
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
 const enabled=ready&&!busy&&!connecting;
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
 $('speed').disabled=busy||connecting;
 $('connectionText').textContent=connecting?'Connecting…':ready?"Connected to Faye's Rockpool":'Not connected';
 $('connectionShell').hidden=!ready;
 if(confirmed){
 $('current').textContent=(ready?'':'Last known: ')+names[confirmed.mode];$('power').textContent=confirmed.mode?'Turn off':'Turn on';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(confirmed.mode===Number(b.dataset.mode))));
 $('speed').value=confirmed.speed;$('speed').setAttribute('aria-valuetext',speeds[confirmed.speed]);crabSpeed(confirmed.speed);
 }
 renderTimerActions();
 $('timerHelp').textContent=confirmed?.mode?'Choose a duration, then start your timer.':'Turn on your Rockpool to start a timer.';
 countdown();
}
function receive(view){
 const s=Rockpool.decode(view);confirmed=s;reportedAt=performance.now();checking=false;revision++;
 if(!hueDraft){$('hue').value=s.hue;preview();}
 if(!timerDraft)wheelSet(s.active?s.minutes:0);render();
 if(notificationWait){notificationWait();notificationWait=null;}
}
function notify(e){try{receive(e.target.value);}catch(e){fail(e);}}
function bounded(p,ms=5000){let t;return Promise.race([p,new Promise((_,reject)=>t=setTimeout(()=>reject(Error('Rockpool did not respond. Tap Connect to reconnect.')),ms))]).finally(()=>clearTimeout(t));}
function readState(){
 const ch=stateChar,token=epoch;
 const next=readChain.catch(()=>{}).then(async()=>{if(token!==epoch||!ch)throw Error('Connection changed.');const v=await bounded(ch.readValue());if(token===epoch)receive(v);});readChain=next;return next;
}
function lost(){
 epoch++;ready=false;busy=false;connecting=false;hueDraft=timerDraft=false;pendingHue=null;previewUnlocked=false;
 if(stateChar)stateChar.removeEventListener('characteristicvaluechanged',notify);commandChar=stateChar=null;
 if(notificationWait){notificationWait();notificationWait=null;}
 render();if(!manual)message('Connection lost. Tap Connect to reconnect.');else message('Disconnected.');
}
function fail(e){message(e.message||'Connection failed. Tap Connect to retry.');manual=true;if(device?.gatt.connected)device.gatt.disconnect();else lost();message(e.message);}
async function connect(){
 if(ready){manual=true;device.gatt.disconnect();return;}
 connecting=true;manual=false;message('');render();
 try{
 device=await navigator.bluetooth.requestDevice({filters:[{services:[Rockpool.service]}]});
 device.removeEventListener('gattserverdisconnected',lost);device.addEventListener('gattserverdisconnected',lost);
 const token=++epoch;const server=await bounded(device.gatt.connect());const service=await bounded(server.getPrimaryService(Rockpool.service));
 commandChar=await bounded(service.getCharacteristic(Rockpool.command));stateChar=await bounded(service.getCharacteristic(Rockpool.state));
 stateChar.addEventListener('characteristicvaluechanged',notify);await bounded(stateChar.startNotifications());
 hueDraft=timerDraft=false;await readState();if(token!==epoch)throw Error('Connection changed.');ready=true;connecting=false;render();
 }catch(e){connecting=false;if(e.name==='NotFoundError'){message('');render();}else fail(e);}
}
async function send(bytes,kind,submittedHue){
 if(!ready||busy)return;busy=true;message('Applying…');render();const token=epoch,before=revision;
 try{
 await bounded(commandChar.writeValueWithResponse(Uint8Array.from(bytes)));
 if(token!==epoch)throw Error('Connection lost. Tap Connect to reconnect.');
 if(revision===before)await new Promise(resolve=>{const timer=setTimeout(()=>{notificationWait=null;resolve();},2000);notificationWait=()=>{clearTimeout(timer);resolve();};});
 if(token!==epoch)throw Error('Connection lost. Tap Connect to reconnect.');
 if(revision===before)await readState();
 if(kind==='hue'&&pendingHue===null&&Number($('hue').value)===submittedHue){hueDraft=false;$('hue').value=confirmed.hue;preview();}
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
$('connect').onclick=connect;$('power').onclick=()=>send([confirmed.mode?0:4]);
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>send([Number(b.dataset.mode)]));
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
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready)readState().catch(fail);});
wheelSet(0,false);preview();render();setInterval(countdown,250);
if(!navigator.bluetooth||!window.isSecureContext){$('connect').hidden=true;$('help').hidden=false;$('help').textContent='To control your Rockpool on iPhone, open this page in Bluefy.';const a=document.createElement('a');a.href='https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055';a.textContent='Get Bluefy on the App Store';$('help').append(document.createElement('br'),a);}
