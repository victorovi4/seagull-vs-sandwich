/* Canvas map: freely pannable, deterministic scenery, visible litter and animated team. */
'use strict';
window.TeamMap = (()=>{
 const T=window.Team,W=1100,H=1500;
 const palette={ground:'#a8bd88',dark:'#426c56',path:'#eadcaa',water:'#79abad'};
 function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 const random=rng(4817);
 function round(c,x,y,w,h,r,fill,stroke){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
 function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function water(x,y){return ((x-620)/165)**2+((y-525)/237)**2<1||x>1015+Math.sin(y/130)*22;}
 function lineDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,f=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy);}
 const trails=T.edges.map(e=>T.polyline(e[0],e[1]));
 const trees=[];
 for(let i=0;i<390;i++){
  const p={x:50+random()*950,y:70+random()*1360,size:.85+random()*.48,type:random()>.5};
  if(water(p.x,p.y)||Object.values(T.nodes).some(n=>Math.hypot(p.x-n.x,p.y-n.y)<(n.goal||n===T.nodes.stage?165:105))||trees.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<62)||trails.some(line=>line.some((b,j)=>j&&lineDist(p,line[j-1],b)<66)))continue;trees.push(p);
 }
 const terrain=document.createElement('canvas');terrain.width=W;terrain.height=H;
 const tc=terrain.getContext('2d');tc.fillStyle=palette.ground;tc.fillRect(0,0,W,H);
 for(let i=0;i<260;i++)oval(tc,random()*W,random()*H,20+random()*55,10+random()*25,i%2?'#718d5330':'#d6d7a12b');
 oval(tc,620,525,178,251,'#c8c896');oval(tc,620,525,169,241,'#89b4ae');oval(tc,620,525,158,229,palette.water);
 tc.fillStyle='#74a5a9';tc.beginPath();tc.moveTo(1120,-10);for(let y=0;y<=H;y+=10)tc.lineTo(1015+Math.sin(y/130)*22,y);tc.lineTo(1120,H);tc.fill();
 for(let i=0;i<160;i++){const x=430+random()*680,y=random()*H;if(water(x,y)){tc.strokeStyle='#d6ece35b';tc.lineWidth=2;tc.beginPath();tc.moveTo(x,y);tc.quadraticCurveTo(x+10,y-4,x+24,y);tc.stroke();}}
 function strokeLine(c,line,width,color){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();line.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
 trails.forEach(line=>{strokeLine(tc,line,68,'#59795036');strokeLine(tc,line,56,'#c6b989');strokeLine(tc,line,45,palette.path);});
 for(let i=0;i<2200;i++){const x=random()*W,y=random()*H;if(!water(x,y)){tc.fillStyle=i%3?'#45694022':'#f6f0c56b';tc.fillRect(x,y,2,2+random()*2);}}
 T.zones.forEach(z=>{const n=T.nodes[z];oval(tc,n.x,n.y,132,104,'#cad399');oval(tc,n.x,n.y,118,87,'#d4d6a350');});
 // A small stage, picnic tables, footbridge and welcoming sorting warehouse.
 tc.save();tc.translate(220,305);round(tc,-93,-39,186,63,6,'#9e8460');for(let y=-30;y<24;y+=12)strokeLine(tc,[{x:-88,y},{x:88,y}],2,'#b99a6b');tc.fillStyle='#667257';tc.fillRect(-87,-83,5,53);tc.fillRect(81,-83,5,53);strokeLine(tc,[{x:-85,y:-84},{x:83,y:-84}],2,'#506a55');['#ebc56a','#75a9ad','#c57f64','#bad97c'].forEach((v,i)=>{tc.fillStyle=v;tc.beginPath();tc.moveTo(-75+i*39,-83);tc.lineTo(-47+i*39,-83);tc.lineTo(-61+i*39,-62);tc.fill();});tc.restore();
 [[810,480],[910,550]].forEach(([x,y])=>{round(tc,x-28,y-18,56,35,4,'#ba9563');round(tc,x-35,y-30,70,8,3,'#8a7859');round(tc,x-35,y+23,70,8,3,'#8a7859');});
 tc.save();tc.translate(610,870);tc.rotate(-.23);round(tc,-49,-26,98,52,4,'#a39368');for(let x=-45;x<50;x+=14)round(tc,x,-24,11,48,1,'#d5bd87');strokeLine(tc,[{x:-53,y:-30},{x:53,y:-30}],5,'#806f50');strokeLine(tc,[{x:-53,y:30},{x:53,y:30}],5,'#806f50');tc.restore();
 const b=T.nodes.base;round(tc,b.x-108,b.y-86,216,128,12,'#c7b68a');for(let y=b.y-79;y<b.y+42;y+=16)strokeLine(tc,[{x:b.x-102,y},{x:b.x+102,y}],1,'#b09b70');T.kinds.forEach((k,i)=>{const x=b.x-87+i*36;round(tc,x,b.y-75,29,41,4,k.color,'#f5efd0');round(tc,x-2,b.y-80,33,8,2,'#eee5b9');tc.fillStyle='#fff9';tc.font='bold 18px system-ui';tc.textAlign='center';tc.fillText(k.symbol,x+15,b.y-48);});
 round(tc,b.x-85,b.y+60,170,35,5,'#1c4945');tc.fillStyle='#f2f4c5';tc.font='bold 17px system-ui';tc.textAlign='center';tc.fillText('СКЛАД / ФИНИШ',b.x,b.y+83);
 function tree(c,t){c.save();c.translate(t.x,t.y);c.scale(t.size,t.size);oval(c,14,7,34,14,'#23493725');round(c,-4,-39,8,44,2,'#776a48');if(t.type){['#3d6951','#51825b','#709867'].forEach((col,i)=>{c.fillStyle=col;c.beginPath();c.moveTo(0,-94+i*20);c.lineTo(-29+i*4,-32+i*13);c.quadraticCurveTo(0,-24+i*13,29-i*4,-32+i*13);c.fill();});}else{oval(c,0,-49,33,32,'#427253');oval(c,-14,-57,23,23,'#558661');oval(c,13,-62,25,27,'#67966b');oval(c,-5,-76,22,20,'#82a67a');}c.restore();}
 function litter(c,p){const n=T.nodes[p.node],x=n.x+p.dx,y=n.y+p.dy;c.save();c.translate(x,y);oval(c,3,8,p.heavy?27:17,8,'#3752382c');c.lineWidth=2.5;c.strokeStyle='#ffffe1';
  if(p.heavy){round(c,-22,-20,44,8,2,'#7c8b80','#f5f6cd');round(c,-4,-18,8,31,2,'#809284','#f5f6cd');round(c,-27,13,54,7,2,'#829486','#f5f6cd');}
  else for(let j=0;j<Math.min(3,p.q);j++){c.save();c.translate((j-1)*10,-j*3);c.rotate((j-1)*.3);switch(p.kind){case 0:round(c,-6,-12,12,25,3,'#62abcb','#e7f9e5');round(c,-3,-19,6,8,1,'#327baf');round(c,-5,-2,10,8,1,'#edf1c2');break;case 1:round(c,-7,-11,14,23,3,'#d3d9c1','#fdffe2');oval(c,0,-10,6,2,'#849385');round(c,-6,-1,12,6,1,'#dbad52');break;case 2:round(c,-6,-6,12,22,3,'#498669','#cde8b1');round(c,-3,-19,6,16,2,'#397358');round(c,-5,0,10,8,1,'#eae0a7');break;case 3:round(c,-10,-13,19,26,1,'#bc965c','#f5e4a7');c.strokeStyle='#8c784e';c.beginPath();c.moveTo(-4,-11);c.lineTo(-4,10);c.stroke();break;default:c.fillStyle='#869686';c.beginPath();[[-9,-7],[1,-13],[10,-4],[8,10],[-6,12],[-13,1]].forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();c.stroke();}c.restore();}
  c.restore();
 }
 function person(c,p,color,time,moving){c.save();c.translate(p.x,p.y);oval(c,0,7,16,7,'#254e3f38');const step=moving?Math.sin(time*15)*4:0;round(c,-10,-5+step,8,15,3,'#254c54');round(c,2,-5-step,8,15,3,'#254c54');round(c,-11,6+step,10,5,2,'#f3efcc');round(c,1,6-step,10,5,2,'#f3efcc');round(c,-17,-30,9,29,4,'#bfce74');round(c,-11,-30,26,27,7,color);round(c,-2,-29,5,25,1,'#d8e791');round(c,15,-26,6,20,3,'#c1d992');oval(c,18,-5,4,4,'#ecefc6');oval(c,1,-41,12,13,'#d8ad7b');oval(c,-2,-48,13,7,'#245b50');round(c,0,-46,20,4,2,'#326b58');oval(c,7,-39,1.4,1.6,'#294b43');c.restore();}
 function trophy(c,x,y,time){c.save();c.translate(x,y+Math.sin(time*3)*2);oval(c,0,4,26,14,'#f8e29966');round(c,-12,-23,24,18,6,'#e1bc5a','#fff1ba');round(c,-3,-7,6,12,1,'#d0a247');round(c,-12,3,24,5,2,'#cfab54');c.fillStyle='#fff8ca';c.font='24px system-ui';c.fillText('✦',19,-17);c.restore();}
 function world(c,s,time=0,actors=null,before=false){c.drawImage(terrain,0,0);
  T.zones.forEach(z=>{const n=T.nodes[z];if(!before&&T.clear(s,z)){oval(c,n.x,n.y,128,99,'#83b67b5e');for(let i=0;i<12;i++){const a=i*2.4,r=30+(i%4)*24,x=n.x+Math.cos(a)*r,y=n.y+Math.sin(a)*r*.75;c.strokeStyle='#538252';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-8);c.stroke();oval(c,x,y-8,4,4,i%2?'#f6edc0':'#e4eccf');}}});
  const things=trees.map(t=>({y:t.y,draw:()=>tree(c,t)}));T.piles.filter(p=>before||s.state[p.id]===0).forEach(p=>things.push({y:T.nodes[p.node].y+p.dy,draw:()=>litter(c,p)}));
  if(!before&&s.artifact===0&&T.clear(s,'picnic'))things.push({y:570,draw:()=>trophy(c,815,570,time)});
  if(actors&&!before){things.push({y:actors.hero.y,draw:()=>person(c,actors.hero,'#377da5',time,actors.moving)});things.push({y:actors.buddy.y,draw:()=>person(c,actors.buddy,'#c18352',time,actors.moving)});}
  things.sort((a,b)=>a.y-b.y).forEach(v=>v.draw());
 }
 function region(s,z,before){const n=T.nodes[z],c=document.createElement('canvas');c.width=350;c.height=260;const ctx=c.getContext('2d');ctx.translate(175-n.x,140-n.y);world(ctx,s,0,null,before);return c.toDataURL('image/png');}
 class View{
  constructor(canvas,getState,onNode){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.getState=getState;this.onNode=onNode;this.x=550;this.y=830;this.zoom=.4;this.follow=false;this.selected='base';this.trace=null;this.points=new Map();this.tap=null;this.home=true;this.pinch=null;this.dim={w:390,h:700};this.bind();this.resize();}
  resize(){const r=this.canvas.getBoundingClientRect();this.dim={w:r.width||390,h:r.height||700};this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.dim.w*this.dpr);this.canvas.height=Math.round(this.dim.h*this.dpr);this.clamp();}
  project(p){return {x:(p.x-this.x)*this.zoom+this.dim.w/2,y:(p.y-this.y)*this.zoom+this.dim.h/2};}
  unproject(x,y){return {x:(x-this.dim.w/2)/this.zoom+this.x,y:(y-this.dim.h/2)/this.zoom+this.y};}
  clamp(){this.zoom=Math.max(.12,Math.min(1.65,this.zoom));this.x=Math.max(100,Math.min(W-100,this.x));this.y=Math.max(50,Math.min(H-50,this.y));}
  fit(){this.x=W/2;if(this.home){this.zoom=Math.min((this.dim.w-35)/W,(this.dim.h-220)/H);this.y=H/2+70;}else{const dock=document.querySelector('.dock').getBoundingClientRect(),stage=this.canvas.getBoundingClientRect(),top=142,bottom=Math.max(top+140,dock.top-stage.top-55);this.zoom=Math.min((this.dim.w-50)/W,(bottom-top)/1075);this.y=782.5+(this.dim.h/2-(top+bottom)/2)/this.zoom;}this.follow=false;this.clamp();}
  center(){const s=this.getState();this.x=T.nodes[s.node].x;this.y=T.nodes[s.node].y+60;this.zoom=Math.max(this.zoom,.7);this.follow=true;this.clamp();}
  scale(f,px=this.dim.w/2,py=this.dim.h/2){const p=this.unproject(px,py);this.zoom*=f;this.clamp();const q=this.unproject(px,py);this.x+=p.x-q.x;this.y+=p.y-q.y;this.clamp();}
  bind(){const c=this.canvas;const local=e=>{const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
   c.addEventListener('pointerdown',e=>{if(this.home)return;e.preventDefault();const p=local(e);this.points.set(e.pointerId,p);c.setPointerCapture(e.pointerId);if(this.points.size===1)this.tap={id:e.pointerId,...p,moved:false};else{if(this.tap)this.tap.moved=true;this.pinch=null;}});
   c.addEventListener('pointermove',e=>{if(!this.points.has(e.pointerId))return;e.preventDefault();const old=this.points.get(e.pointerId),p=local(e);this.points.set(e.pointerId,p);if(this.tap&&Math.hypot(p.x-this.tap.x,p.y-this.tap.y)>8)this.tap.moved=true;
    if(this.points.size===1){this.x-=(p.x-old.x)/this.zoom;this.y-=(p.y-old.y)/this.zoom;this.follow=false;}else{const a=[...this.points.values()],d=Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(this.pinch){this.scale(d/this.pinch.d,mid.x,mid.y);this.x-=(mid.x-this.pinch.x)/this.zoom;this.y-=(mid.y-this.pinch.y)/this.zoom;}this.pinch={d,...mid};this.follow=false;}
    this.clamp();
   });
   const end=e=>{if(!this.points.has(e.pointerId))return;const tap=this.tap;this.points.delete(e.pointerId);this.pinch=null;if(e.type==='pointerup'&&tap&&!tap.moved&&tap.id===e.pointerId){const p=local(e),targets=Object.entries(T.nodes).map(([id,n])=>({id,p:this.project(n)}));targets.sort((a,b)=>Math.hypot(a.p.x-p.x,a.p.y-p.y)-Math.hypot(b.p.x-p.x,b.p.y-p.y));const target=targets[0];if(Math.hypot(target.p.x-p.x,target.p.y-p.y)<Math.max(38,65*this.zoom))this.onNode(target.id);else{const w=this.unproject(p.x,p.y),pile=T.piles.filter(t=>!this.getState().state[t.id]).sort((a,b)=>Math.hypot(T.nodes[a.node].x+a.dx-w.x,T.nodes[a.node].y+a.dy-w.y)-Math.hypot(T.nodes[b.node].x+b.dx-w.x,T.nodes[b.node].y+b.dy-w.y))[0];if(pile&&Math.hypot(T.nodes[pile.node].x+pile.dx-w.x,T.nodes[pile.node].y+pile.dy-w.y)<Math.max(45,25/this.zoom))this.onNode(pile.node);}}this.tap=null;};
   ['pointerup','pointercancel','lostpointercapture'].forEach(n=>c.addEventListener(n,end));c.addEventListener('wheel',e=>{if(this.home)return;e.preventDefault();const p=local(e);this.scale(Math.exp(-e.deltaY*.0015),p.x,p.y);this.follow=false;},{passive:false});
  }
  animate(result){this.trace={hero:result.hero,buddy:result.buddy,start:performance.now(),duration:Math.min(2400,450+result.cost*160)};if(this.zoom>.5)this.follow=true;return this.trace.duration;}
  render(time){const c=this.ctx,s=this.getState(),d=this.dim;let actors={hero:T.nodes[s.node],buddy:T.buddyPos(s),moving:false};
   if(this.trace){const t=Math.max(0,Math.min(1,(time-this.trace.start)/this.trace.duration)),inter=(arr)=>{const k=t*(arr.length-1),i=Math.min(arr.length-1,Math.floor(k)),j=Math.min(i+1,arr.length-1),f=k-i;return {x:arr[i].x+(arr[j].x-arr[i].x)*f,y:arr[i].y+(arr[j].y-arr[i].y)*f};};actors={hero:inter(this.trace.hero),buddy:inter(this.trace.buddy),moving:true};if(t>=1)this.trace=null;}
   if(this.follow&&!this.home){this.x+=(actors.hero.x-this.x)*.1;this.y+=(actors.hero.y+70-this.y)*.1;}
   c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#94ae83';c.fillRect(0,0,d.w,d.h);c.save();c.translate(d.w/2,d.h/2);c.scale(this.zoom,this.zoom);c.translate(-this.x,-this.y);world(c,s,time/1000,actors);
   if(this.selected!==s.node&&!this.home){const r=T.path(s.node,this.selected);c.strokeStyle='#fff9dc';c.lineWidth=4/this.zoom;c.setLineDash([5/this.zoom,7/this.zoom]);c.beginPath();r.nodes.slice(1).forEach((n,i)=>T.polyline(r.nodes[i],n).forEach((p,j)=>i===0&&j===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y)));c.stroke();c.setLineDash([]);}
   c.restore();if(this.home)return;
   for(const [id,n] of Object.entries(T.nodes)){const p=this.project(n);if(p.x<-100||p.x>d.w+100||p.y<-50||p.y>d.h+80)continue;const selected=id===this.selected,isZone=T.zones.includes(id),complete=isZone&&T.clear(s,id);if(this.zoom<.22&&!isZone&&id!=='base'&&!selected)continue;const r=selected?18:13;
    oval(c,p.x,p.y,r+3,r+3,'#ecedc690');oval(c,p.x,p.y,r,r,selected?'#183e3b':complete?'#507b55':'#f9f3d6');c.fillStyle=selected?'#def285':'#2c574d';c.font='bold '+(selected?12:10)+'px system-ui';c.textAlign='center';c.fillText(complete?'✓':n.icon,p.x,p.y+4);
    if(this.zoom>.48||isZone||id==='base'||selected){const text=n.name,w=Math.min(165,Math.max(80,c.measureText(text).width+18));round(c,p.x-w/2,p.y+20,w,23,7,selected?'#173e3af0':'#f8f5daee');c.fillStyle=selected?'#f3f6dc':'#2b5146';c.font='600 10px system-ui';c.fillText(text,p.x,p.y+35);if(isZone){const all=T.piles.filter(t=>t.node===id),q=all.reduce((a,t)=>a+t.q,0),done=all.reduce((a,t)=>a+(s.state[t.id]?t.q:0),0);round(c,p.x-22,p.y+46,44,15,5,'#2d5641c9');c.fillStyle='#faf5dc';c.font='9px system-ui';c.fillText(done+'/'+q,p.x,p.y+57);}}
   }
   // Team pins are drawn above all trees and overlays.
   [actors.hero,actors.buddy].forEach((a,i)=>{const p=this.project(a);oval(c,p.x,p.y-48*this.zoom,7,7,i?'#d49667':'#3d82b5');c.strokeStyle='#fff8d9';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-48*this.zoom,7,0,Math.PI*2);c.stroke();});
  }
 }
 return {W,H,View,world,region};
})();
