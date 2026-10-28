/* Protocol v3 shared by the page and automated checks. */
(function(root){
'use strict';
function decode(view){
 if(view.byteLength!==10)throw Error('This Rockpool has an incompatible state format.');
 const a=new Uint8Array(view.buffer,view.byteOffset,view.byteLength),u=i=>a[i]|a[i+1]<<8;
 if(a[0]!==3)throw Error('This page needs Rockpool firmware protocol v3.');
 const s={mode:a[1],hue:u(2),speed:a[4],active:a[5],remaining:u(6),minutes:u(8)};
 if(s.mode>4||s.hue>359||s.speed>5||s.active>1||
  (s.active?(!s.mode||s.minutes<1||s.minutes>180||s.remaining<1||s.remaining>s.minutes*60):(s.remaining!==0||s.minutes!==0)))
  throw Error('Rockpool reported an invalid state. Reconnect to try again.');
 return s;
}
const api={decode,service:'5f740001-6f63-4b70-9a79-726f636b706c',command:'5f740002-6f63-4b70-9a79-726f636b706c',state:'5f740003-6f63-4b70-9a79-726f636b706c'};
if(typeof module!=='undefined')module.exports=api;else root.Rockpool=api;
})(globalThis);
