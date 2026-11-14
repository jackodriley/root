(function(root){
function map(h,p){const d=h[6]*p.x+h[7]*p.y+1;return {x:(h[0]*p.x+h[1]*p.y+h[2])/d,y:(h[3]*p.x+h[4]*p.y+h[5])/d};}
function calibrate(points){if(points.length!==4)throw Error('Choose all four targets.');const cross=[];for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];cross.push((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x));}if(!cross.every(x=>x>.005)&&!cross.every(x=>x<-.005))throw Error('Targets must surround the projection in order, without crossing. Try again.');
 const targets=[{x:.06,y:.06},{x:.94,y:.06},{x:.94,y:.94},{x:.06,y:.94}],rows=[];
 points.forEach((p,i)=>{const q=targets[i];rows.push([p.x,p.y,1,0,0,0,-q.x*p.x,-q.x*p.y,q.x],[0,0,0,p.x,p.y,1,-q.y*p.x,-q.y*p.y,q.y]);});
 for(let i=0;i<8;i++){let best=i;for(let j=i+1;j<8;j++)if(Math.abs(rows[j][i])>Math.abs(rows[best][i]))best=j;[rows[i],rows[best]]=[rows[best],rows[i]];const v=rows[i][i];if(Math.abs(v)<1e-9)throw Error('Projection too narrow. Move the camera and try again.');for(let k=i;k<=8;k++)rows[i][k]/=v;for(let j=0;j<8;j++)if(j!==i){const f=rows[j][i];for(let k=i;k<=8;k++)rows[j][k]-=f*rows[i][k];}}
 return rows.map(r=>r[8]);
}
function largest(hands,h){return hands.map(l=>{const palm=[0,5,9,13,17].map(i=>l[i]);const p={x:palm.reduce((s,p)=>s+p.x,0)/5,y:palm.reduce((s,p)=>s+p.y,0)/5};const target=map(h,p);const xs=l.map(p=>p.x),ys=l.map(p=>p.y);return {target,area:(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))};}).filter(v=>Number.isFinite(v.target.x)&&Number.isFinite(v.target.y)&&v.target.x>=0&&v.target.x<=1&&v.target.y>=0&&v.target.y<=1).sort((a,b)=>b.area-a.area)[0]?.target||null;}
const api={map,calibrate,largest};if(typeof module!=='undefined')module.exports=api;else root.ProjectionMap=api;
})(globalThis);
