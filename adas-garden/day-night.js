(function(root){
class DayNightCycle{
 constructor(){this.enabled=false;this.phase='day';this.daySeconds=0;this.quietSeconds=0;this.threshold=22;}
 start(){this.enabled=true;this.phase='day';this.daySeconds=0;this.quietSeconds=0;}
 stop(){this.enabled=false;this.phase='day';this.daySeconds=0;this.quietSeconds=0;}
 endNight(){if(!this.enabled||this.phase!=='night')return null;this.phase='day';this.daySeconds=0;this.quietSeconds=0;return 'day';}
 step(dt,level,valid){if(!this.enabled)return null;if(this.phase==='day'){this.daySeconds+=dt;if(this.daySeconds>=120){this.phase='night';this.quietSeconds=0;return 'night';}}else{this.quietSeconds=valid&&level<=this.threshold?this.quietSeconds+dt:0;if(this.quietSeconds>=20)return this.endNight();}return null;}
 multiplier(level){return this.enabled&&this.phase==='day'?1+Math.max(0,Math.min(100,level))/50:1;}
}
if(typeof module!=='undefined')module.exports=DayNightCycle;else root.DayNightCycle=DayNightCycle;
})(globalThis);
