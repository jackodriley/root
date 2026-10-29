(function(root){
'use strict';
const location={name:'West Norwood · SE27, London',latitude:51.43,longitude:-0.10,timezone:'Europe/London',key:'london-se27-v1'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
function crc(bytes){let c=0xffffffff;for(const v of bytes){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function compose(code,cloud,wind,rain,day){
 let a=[45,115,175],b=[100,170,190],depth=150,level=220;
 if(code===0||code===1){a=[235,180,90];b=[65,190,170];}
 else if(code===2){a=[135,185,160];b=[200,185,105];}
 else if(code===45||code===48){a=[105,140,160];b=[145,170,185];depth=95;level=190;}
 else if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)){a=[15,55,165];b=[30,125,195];depth=180+Math.min(rain*8,60);}
 else if([71,73,75,77,85,86].includes(code)){a=[115,185,220];b=[150,205,225];depth=110;}
 else if([95,96,99].includes(code)){a=[35,40,120];b=[95,65,155];depth=230;level=205;}
 const soften=cloud/100*.25;
 a=a.map((v,i)=>lerp(v,[95,145,170][i],soften));b=b.map((v,i)=>lerp(v,[100,155,180][i],soften));
 if(!day){a=a.map((v,i)=>lerp(v,[15,35,105][i],.55));b=b.map((v,i)=>lerp(v,[30,95,145][i],.5));level*=.5;}
 for(const p of [a,b]){const sum=p.reduce((x,y)=>x+y,0);if(sum>430)for(let i=0;i<3;i++)p[i]*=430/sum;}
 return [...a,...b,level,depth,clamp(.75+wind/40,.75,1.75)*256];
}
function encode(records){
 const out=new Uint8Array(250);
 records.forEach((r,i)=>{for(let k=0;k<8;k++)out[i*10+k]=Math.round(clamp(r[k],0,255));const rate=Math.round(r[8]);out[i*10+8]=rate&255;out[i*10+9]=rate>>8;});return out;
}
function packagePattern(payload,start,partial=false,kind='forecast'){
 const id=(crc(payload)^start)>>>0||1;
 return {id,payload,start,end:start+86400,fetched:Math.floor(Date.now()/1000),mapping:1,location:location.key,partial,kind};
}
function fromForecast(json,start){
 const h=json?.hourly,u=json?.hourly_units,fields=['weather_code','cloud_cover','precipitation','wind_speed_10m','is_day'];
 if(!h||!u||!Array.isArray(h.time)||h.time.length<26||h.time.length>2000)throw Error('The forecast did not cover a complete 24 hours.');
 for(const f of fields)if(!Array.isArray(h[f])||h[f].length!==h.time.length)throw Error('The forecast data was incomplete.');
 if(u.time!=='unixtime'||u.wind_speed_10m!=='km/h'||u.precipitation!=='mm'||u.cloud_cover!=='%')throw Error('The forecast used unexpected units.');
 const times=h.time;
 for(let i=0;i<times.length;i++)if(!Number.isFinite(times[i])||(i&&times[i]-times[i-1]!==3600))throw Error('The forecast times were invalid.');
 if(times[0]>start||times.at(-1)<start+86400)throw Error('The forecast did not cover the requested period.');
 let partial=false;
 function optional(value,fallback,max){if(value===null||value===undefined){partial=true;return fallback;}if(!Number.isFinite(value)||value<0||value>max)throw Error('The forecast contained invalid weather values.');return value;}
 function source(i){
  const code=h.weather_code[i],day=h.is_day[i];
  if(!Number.isInteger(code)||code<0||code>999||(day!==0&&day!==1))throw Error('Essential weather conditions were missing.');
  // Hourly rain is a preceding-hour total: the next timestamp describes
  // precipitation during the interval starting at this sample.
  const rain=h.precipitation[Math.min(i+1,times.length-1)];
  return compose(code,optional(h.cloud_cover[i],50,100),optional(h.wind_speed_10m[i],10,400),optional(rain,0,500),day);
 }
 const records=[];
 for(let k=0;k<=24;k++){
  const t=start+k*3600;let i=Math.floor((t-times[0])/3600);if(i===times.length-1)i--;
  const mix=(t-times[i])/3600,a=source(i),b=source(i+1);records.push(a.map((v,n)=>lerp(v,b[n],mix)));
 }
 return packagePattern(encode(records),start,partial);
}
async function fetchLondon(signal,start=Math.floor(Date.now()/1000)){
 const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),hourly:'weather_code,cloud_cover,precipitation,wind_speed_10m,is_day',past_hours:'1',forecast_hours:'28',timeformat:'unixtime',timezone:'auto',wind_speed_unit:'kmh',precipitation_unit:'mm'});
 const response=await fetch('https://api.open-meteo.com/v1/forecast?'+params,{signal});
 if(!response.ok)throw Error(response.status===429?'Weather requests are temporarily limited. Try again later.':'Weather is unavailable. Please try again.');
 return fromForecast(await response.json(),start);
}
function synthetic(){
 const records=[];for(let i=0;i<25;i++){const stage=Math.floor(i/4)%6;records.push(compose([0,3,63,95,45,0][stage],[5,90,95,100,100,5][stage],[5,15,30,40,2,5][stage],stage===2?4:0,stage===5?0:1));}
 return packagePattern(encode(records),Math.floor(Date.now()/1000),false,'synthetic');
}
function checkStored(p){
 if(!p||p.mapping!==1||p.location!==location.key||p.kind!=='forecast'||!Number.isInteger(p.id)||!p.id||!Number.isFinite(p.start)||p.end!==p.start+86400||!Number.isFinite(p.fetched)||!Array.isArray(p.payload)||p.payload.length!==250||p.payload.some(x=>!Number.isInteger(x)||x<0||x>255))return null;
 const payload=Uint8Array.from(p.payload);if(((crc(payload)^p.start)>>>0||1)!==p.id)return null;
 return {...p,payload};
}
function eligible(p,now=Date.now()/1000){return p&&p.kind==='forecast'&&now>=p.fetched&&now-p.fetched<=21600&&p.end>now;}
function begin(p,revision){const a=new Uint8Array(18),v=new DataView(a.buffer);a.set([0x10,1,1,25]);v.setUint32(4,p.id,true);v.setUint16(8,250,true);v.setUint32(10,crc(p.payload),true);v.setUint32(14,revision,true);return a;}
function operation(op,id){const a=new Uint8Array(5);a[0]=op;new DataView(a.buffer).setUint32(1,id,true);return a;}
function chunk(p,offset){const len=Math.min(13,p.payload.length-offset),a=new Uint8Array(7+len),v=new DataView(a.buffer);a[0]=0x11;v.setUint32(1,p.id,true);v.setUint16(5,offset,true);a.set(p.payload.subarray(offset,offset+len),7);return a;}
function decodeStatus(v){
 if(v.byteLength!==20||v.getUint8(0)!==1||v.getUint8(16)!==1||v.getUint8(17)!==0||v.getUint16(18,true)!==250)throw Error('Weather firmware is incompatible with this page.');
 const flags=v.getUint8(1),id=v.getUint32(2,true),offset=v.getUint32(6,true),received=v.getUint16(10,true);
 if(flags>7||received>250||offset>=1440000||Boolean(flags&1)!==Boolean(id)||(flags&4)&&!(flags&1)||!(flags&2)&&received||!(flags&4)&&offset)throw Error('Rockpool reported invalid weather state.');
 return {available:Boolean(flags&1),staging:Boolean(flags&2),playing:Boolean(flags&4),id,offset,received,revision:v.getUint32(12,true)};
}
const api={location,crc,compose,encode,fromForecast,fetchLondon,synthetic,checkStored,eligible,begin,chunk,operation,decodeStatus};
if(typeof module!=='undefined')module.exports=api;else root.RockpoolWeather=api;
})(globalThis);
