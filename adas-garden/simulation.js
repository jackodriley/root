(function(root){
class Garden {
 constructor(random=Math.random){this.random=random;this.time=0;this.butterflies=[];this.events=[];this.flowers=[];}
 addFlower(name,art=null){if(this.flowers.length>=20)throw Error('The garden holds 20 flowers.');const f={id:this.flowers.length,name,art,occupant:null};this.flowers.push(f);this.layout();return f;}
 layout(width=this.width||1000,height=this.height||700){
 this.width=width;this.height=height;
 const count=this.flowers.length;
 if(!count)return;
 // Give each bloom and its label a separate cell in the lower garden.
 const areaWidth=width*.88,areaHeight=height*.48;
 const columns=Math.min(count,Math.max(1,Math.ceil(Math.sqrt(count*areaWidth/areaHeight))));
 const rows=Math.ceil(count/columns),cellWidth=areaWidth/columns,cellHeight=areaHeight/rows;
 this.flowerSize=Math.max(1,Math.min(130,cellWidth-24,cellHeight-36));
 this.labelWidth=Math.max(1,cellWidth-12);
 this.flowers.forEach((f,i)=>{
 const row=Math.floor(i/columns),col=i%columns;
 const rowCount=Math.min(columns,count-row*columns);
 f.x=(width/2+(col-(rowCount-1)/2)*cellWidth)/width;
 f.y=(height*.34+(row+.5)*cellHeight)/height;
 });
 }

 add(name,stats,art){if(!name.trim()||!['Speed','Size','Vision','Cheekiness'].every(k=>Number.isInteger(stats[k])&&stats[k]>=0&&stats[k]<=10)||Object.values(stats).reduce((a,b)=>a+b,0)!==10)throw Error('Spend exactly ten points.');const b={id:this.butterflies.length+1,name:name.trim(),stats:{...stats},art,x:.15+this.random()*.7,y:.2+this.random()*.3,angle:0,phase:this.random()*30,score:0,state:'flying',target:null,cooldown:0,rest:0,wander:null,lastFlower:null,spin:0,boost:0,cheekTimer:4+this.random()*8};this.butterflies.push(b);return b;}
 attribute(b,key){return b.stats[key]+(b.name.trim().toLowerCase()==='ada'?5:0);}
 get total(){return this.butterflies.reduce((sum,b)=>sum+b.score,0);}
 leave(b){if(b.target?.occupant===b)b.target.occupant=null;b.lastFlower=b.target?.id??b.lastFlower;b.target=null;b.state='flying';b.cooldown=3;b.wander={x:.1+this.random()*.8,y:.12+this.random()*.4};}
 land(b,f){f.occupant=b;b.target=f;b.state='landed';b.rest=3+this.random()*2;b.x=f.x;b.y=f.y;b.score++;this.events.push({kind:'nectar',name:b.name,x:f.x,y:f.y});}
 step(dt,speedMultiplier=1){this.time+=dt;for(const b of this.butterflies){b.cooldown=Math.max(0,b.cooldown-dt*speedMultiplier);if(b.state==='landed'){b.x=b.target.x;b.y=b.target.y;b.rest-=dt*speedMultiplier;if(b.rest<=0)this.leave(b);continue;}
 if(b.spin>0){b.spin=Math.max(0,b.spin-dt);b.angle+=Math.PI*4*dt;if(b.spin===0)b.boost=2.5;continue;}
 b.boost=Math.max(0,b.boost-dt);b.cheekTimer-=dt;if(this.attribute(b,'Cheekiness')>0&&b.cheekTimer<=0){b.cheekTimer=16-this.attribute(b,'Cheekiness')+this.random()*8;if(this.random()<.2+this.attribute(b,'Cheekiness')*.07){b.spin=1;b.target=null;continue;}}
 const radius=.13+this.attribute(b,'Vision')*.055;
 if(!b.target&&b.cooldown===0)b.target=this.flowers.filter(f=>(this.flowers.length===1||f.id!==b.lastFlower)&&!f.occupant&&Math.hypot(f.x-b.x,f.y-b.y)<=radius).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0]||null;
 if(b.target?.occupant)b.target=null;
 if(!b.wander||Math.hypot(b.wander.x-b.x,b.wander.y-b.y)<.04)b.wander={x:.08+this.random()*.84,y:.15+this.random()*.66};
 const target=b.target||b.wander,dx=target.x-b.x,dy=target.y-b.y,dist=Math.hypot(dx,dy),speed=(.035+this.attribute(b,'Speed')*.013)*(b.boost>0?1.9:1),travel=Math.min(dist,speed*speedMultiplier*dt);
 if(dist>0){b.x+=dx/dist*travel;b.y+=dy/dist*travel;const heading=Math.atan2(dy,dx)+Math.PI/2,diff=Math.atan2(Math.sin(heading-b.angle),Math.cos(heading-b.angle));b.angle+=diff*Math.min(1,dt*4);}
 if(b.target&&dist<=.018+travel&&!b.target.occupant)this.land(b,b.target);
 }}
}
if(typeof module!=='undefined')module.exports=Garden;else root.Garden=Garden;
})(typeof window!=='undefined'?window:globalThis);
