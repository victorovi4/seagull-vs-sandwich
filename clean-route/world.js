/* Clean Route: deterministic world, walkability, A* routes and original canvas art. */
'use strict';
window.CG={};
(()=>{
const C=window.CG;
C.W=960;C.H=1440;C.T=32;
C.kinds=[
 {name:'Пластик',color:'#478dcc',symbol:'♳',item:'ПЭТ-бутылка',hint:'Пустая ПЭТ-бутылка → пластик.'},
 {name:'Металл',color:'#d2a136',symbol:'▤',item:'Алюминиевая банка',hint:'Алюминиевая банка → металл.'},
 {name:'Стекло',color:'#4b9669',symbol:'◇',item:'Стеклянная бутылка',hint:'Целая стеклянная бутылка → стекло.'},
 {name:'Бумага',color:'#ad7c50',symbol:'▱',item:'Сухой картон',hint:'Чистый сухой картон → бумага.'},
 {name:'Смешанное',color:'#68767f',symbol:'▰',item:'Грязная салфетка',hint:'Использованная салфетка → смешанные отходы.'}
];
C.levels=[
 {name:'Парк у воды',count:18,cap:8,target:180,ground:'#83a765',light:'#a7be7d',dark:'#62874f',seed:321,areas:['Входная поляна','Тихий берег','Старая беседка'],artifact:'Потерянный компас',icon:'◈',artifactStory:'Стрелка еще движется. Кто-то искал здесь север, а ты нашел способ вернуть парку чистоту.',story:'После выходных мусор остался на поляне, у воды и возле беседки. Пройди по тропе и очисти все три места. Говорят, в беседке потеряли старый компас.'},
 {name:'Лесная тропа',count:24,cap:10,target:240,ground:'#789466',light:'#a0b77c',dark:'#567b4c',seed:841,areas:['Лесная опушка','Озеро в лесу','Стоянка туристов'],artifact:'Кассета «Лето 2001»',icon:'▣',artifactStory:'На этикетке — выцветшее «Лето 2001». Музыку мы уже не услышим, зато лес снова звучит без хруста бутылок.',story:'Вдоль тропы остались следы пикников. Освободи опушку, берег озера и старую стоянку. Среди вещей туристов может найтись маленькая капсула времени.'},
 {name:'После пикника',count:30,cap:10,target:300,ground:'#a3ad6c',light:'#c5c78b',dark:'#879754',seed:1492,areas:['Большая лужайка','Место для пикника','Площадка у сцены'],artifact:'Кубок дворового чемпиона',icon:'♜',artifactStory:'На кубке написано «За волю к победе». Кажется, сегодня он заслуженно переходит команде чистоты.',story:'Праздник закончился — пора вернуть поляну природе. Пройди от лужайки до сцены, отсортируй все находки и проверь, что блестит под последней кучкой.'}
];
C.rand=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
C.dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
C.pathPoints=[{x:480,y:1330},{x:480,y:1170},{x:295,y:1050},{x:240,y:875},{x:365,y:730},{x:635,y:695},{x:690,y:510},{x:545,y:355},{x:290,y:310},{x:230,y:130}];
function lineDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y;const f=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-f*dx,p.y-a.y-f*dy);}
C.inWater=(x,y,l)=>l===1?((x-820)/145)**2+((y-710)/252)**2<1:x>824+Math.sin(y/170)*30+(l===2?20:0);
C.buildWorld=level=>{
 const def=C.levels[level],rng=C.rand(def.seed);
 const w={level,def,base:{x:480,y:1190},zones:[{x:270,y:980},{x:625,y:690},{x:305,y:335}],trees:[],rocks:[],items:[],flowers:[],decor:[]};
 w.zones.forEach((z,i)=>{z.name=def.areas[i];z.id=i;z.count=def.count/3;});
 for(let i=0;i<240;i++){
  const p={x:50+rng()*720,y:45+rng()*1320};
  if(C.inWater(p.x,p.y,level)||C.dist(p,w.base)<155||w.zones.some(z=>C.dist(p,z)<158)||C.pathPoints.some((v,j,a)=>j&&lineDistance(p,a[j-1],v)<77)||w.trees.some(t=>C.dist(t,p)<65))continue;
  w.trees.push({...p,size:.8+rng()*.55,type:rng()>.5?1:0});
 }
 for(let z of w.zones)for(let j=0;j<z.count;j++){
  const a=j/z.count*Math.PI*2+rng()*.35,r=52+(j%3)*26;
  let x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r*.83;
  while(C.inWater(x+22,y,level)||C.inWater(x-22,y,level))x-=24;
  w.items.push({id:w.items.length,x,y,kind:(j+z.id*2+level)%5,zone:z.id,state:0,angle:(rng()-.5)*1.2});
 }
 for(let i=0;i<16;i++){
  const p={x:65+rng()*670,y:70+rng()*1250};
  if(w.items.some(t=>C.dist(t,p)<65)||C.dist(p,w.base)<160||w.zones.some(z=>C.dist(p,z)<155)||C.pathPoints.some((v,j,a)=>j&&lineDistance(p,a[j-1],v)<65)||C.inWater(p.x,p.y,level))continue;
  w.rocks.push({...p,size:15+rng()*8});
 }
 w.artifact={x:340,y:306,status:0};
 w.walkable=(x,y,r=12)=>x>27&&x<C.W-27&&y>28&&y<C.H-28&&!C.inWater(x+r,y,level)&&!C.inWater(x-r,y,level)&&!w.trees.some(t=>Math.hypot(t.x-x,t.y-y)<r+11)&&!w.rocks.some(t=>Math.hypot(t.x-x,t.y-y)<r+t.size*.7);
 w.cols=C.W/C.T;w.rows=C.H/C.T;w.grid=[];
 for(let y=0;y<w.rows;y++)for(let x=0;x<w.cols;x++)w.grid.push(w.walkable((x+.5)*C.T,(y+.5)*C.T,15));
 w.terrain=terrain(w,rng);return w;
};
C.route=(w,start,end)=>{
 const cols=w.cols,rows=w.rows,T=C.T;
 const cell=p=>({x:Math.max(0,Math.min(cols-1,Math.floor(p.x/T))),y:Math.max(0,Math.min(rows-1,Math.floor(p.y/T)))});
 function nearest(p){let q=cell(p),best=-1,d=Infinity;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=q.x+dx,y=q.y+dy,k=y*cols+x;if(x<0||x>=cols||y<0||y>=rows||!w.grid[k])continue;let v=Math.hypot((x+.5)*T-p.x,(y+.5)*T-p.y);if(v<d){d=v;best=k;}}return best;}
 const from=nearest(start),to=nearest(end);if(from<0||to<0)return[];
 const costs=new Float64Array(cols*rows).fill(Infinity),parent=new Int32Array(cols*rows).fill(-1),closed=new Uint8Array(cols*rows),open=[from];costs[from]=0;
 const h=k=>Math.hypot(k%cols-to%cols,Math.floor(k/cols)-Math.floor(to/cols));
 let found=false;
 while(open.length){let bi=0;for(let j=1;j<open.length;j++)if(costs[open[j]]+h(open[j])<costs[open[bi]]+h(open[bi]))bi=j;let k=open.splice(bi,1)[0];if(k===to){found=true;break;}if(closed[k])continue;closed[k]=1;const x=k%cols,y=Math.floor(k/cols);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy,n=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||!w.grid[n]||closed[n])continue;if(dx&&dy&&(!w.grid[y*cols+nx]||!w.grid[ny*cols+x]))continue;let v=costs[k]+(dx&&dy?Math.SQRT2:1);if(v<costs[n]){costs[n]=v;parent[n]=k;open.push(n);}}
 }
 if(!found)return[];let out=[],k=to;while(k!==from){out.push({x:(k%cols+.5)*T,y:(Math.floor(k/cols)+.5)*T});k=parent[k];if(k<0)return[];}out.reverse();if(out.length===0)out.push({x:(to%cols+.5)*T,y:(Math.floor(to/cols)+.5)*T});return out;
};
function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function trail(c,w,width,color){c.lineJoin='round';c.lineCap='round';c.lineWidth=width;c.strokeStyle=color;c.beginPath();C.pathPoints.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}
function terrain(w,rng){
 const cn=document.createElement('canvas');cn.width=C.W;cn.height=C.H;const c=cn.getContext('2d'),d=w.def;
 c.fillStyle=d.ground;c.fillRect(0,0,C.W,C.H);
 c.globalAlpha=.11;for(let i=0;i<130;i++){ellipse(c,rng()*C.W,rng()*C.H,20+rng()*65,12+rng()*35,i%2?d.light:d.dark);c.globalAlpha=.11;}c.globalAlpha=1;
 c.fillStyle='#5c989b';for(let y=0;y<C.H;y+=6)for(let x=660;x<C.W;x+=6)if(C.inWater(x,y,w.level))c.fillRect(x,y,7,7);
 c.strokeStyle='#cce2b077';c.lineWidth=2;for(let i=0;i<95;i++){let x=710+rng()*250,y=rng()*C.H;if(C.inWater(x,y,w.level)){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+10,y-3,x+22,y);c.stroke();}}
 trail(c,w,96,'#52744b35');trail(c,w,83,'#c8bd86');trail(c,w,61,'#d4c698');
 for(let i=0;i<1500;i++){const x=rng()*C.W,y=rng()*C.H;if(C.inWater(x,y,w.level))continue;c.fillStyle=i%4===0?'#e9e3b963':'#355c3b28';c.fillRect(x,y,2+rng()*2,1+rng()*3);}
 w.zones.forEach((z,i)=>{ellipse(c,z.x,z.y,147,114,'#cdc68c44');ellipse(c,z.x,z.y,116,84,'#c2bb853d');
  // The recovered territory grows visibly greener as the player removes litter.
  const bx=z.x+18,by=z.y-130;c.save();c.translate(bx,by);rr(c,-38,-8,76,14,3,'#795e46');rr(c,-38,-23,76,11,2,'#957b57');c.fillStyle='#5e5d40';c.fillRect(-28,6,6,16);c.fillRect(24,6,6,16);c.restore();
  c.fillStyle='#526742';c.fillRect(z.x-99,z.y-133,4,32);rr(c,z.x-119,z.y-150,45,24,3,'#f0e8bb');c.font='bold 12px system-ui';c.textAlign='center';c.fillStyle='#537047';c.fillText('0'+(i+1),z.x-97,z.y-134);
 });
 // Wooden sorting platform.
 rr(c,w.base.x-111,w.base.y-77,222,148,12,'#36564235');rr(c,w.base.x-105,w.base.y-85,210,142,10,'#c5b489');c.strokeStyle='#ac996d';c.lineWidth=1;for(let y=w.base.y-72;y<w.base.y+58;y+=16){c.beginPath();c.moveTo(w.base.x-99,y);c.lineTo(w.base.x+99,y);c.stroke();}
 // Quiet environmental details: fence, stepping stones and reeds.
 c.strokeStyle='#e0d3a299';c.lineWidth=4;for(let x=75;x<720;x+=39){c.beginPath();c.moveTo(x,1375);c.lineTo(x,1402);c.stroke();}c.beginPath();c.moveTo(68,1384);c.lineTo(745,1384);c.stroke();
 for(let i=0;i<55;i++){let y=45+rng()*1320,x=780+Math.sin(y/170)*30;if(w.level===1)x=775+rng()*60;if(!C.inWater(x,y,w.level)&&!w.zones.some(z=>C.dist(z,{x,y})<110)){c.strokeStyle='#446d45';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y-13);c.moveTo(x,y);c.lineTo(x+5,y-16);c.stroke();}}
 return cn;
}
C.itemSvg=kind=>{const colors=['#76b5cf','#b9c5c1','#619479','#c9a474','#8c9692'];const shapes=[`<path d="M33 13h18v13l8 12v44q-17 8-34 0V38l8-12z"/><path d="M31 52h22v19H31z" fill="#eef3e6"/><path d="M32 10h20v10H32z" fill="#4b78ad"/>`,`<rect x="23" y="24" width="39" height="62" rx="9"/><ellipse cx="42" cy="26" rx="19" ry="7" fill="#e2e8df"/><ellipse cx="42" cy="27" rx="7" ry="3" fill="#70877c"/><path d="M29 53h27v16H29z" fill="#d3b966"/>`,`<path d="M35 8h14v25l11 18v32q-18 9-36 0V51l11-18z"/><path d="M32 57h20v17H32z" fill="#ebe3b9"/><path d="M37 15v20l-7 18" stroke="#b5d5b4" fill="none"/>`,`<path d="M18 24l44-5 8 60-44 8z"/><path d="M18 24l15 10 29-15M33 34l7 46" fill="none" stroke="#9a794f"/><path d="M45 41l12-2m-11 9 12-2m-10 9 11-2" stroke="#806942"/>`,`<path d="M19 36l16-15 13 11 15-3 7 34-13 20-34-7-7-20z"/><path d="M26 44l15 12 18-13m-18 13 4 20" fill="none" stroke="#64746b"/>`];return `<svg viewBox="0 0 86 98" aria-hidden="true"><ellipse cx="43" cy="89" rx="25" ry="5" fill="#163c3220"/><g fill="${colors[kind]}" stroke="#41615b" stroke-width="2.5" stroke-linejoin="round">${shapes[kind]}</g></svg>`;};
function item(c,o,time,selected){c.save();c.translate(o.x,o.y);if(selected){ellipse(c,0,0,26,17,'#f2fae23d');c.strokeStyle='#fcffe7';c.lineWidth=2;c.beginPath();c.ellipse(0,0,25,16,0,0,Math.PI*2);c.stroke();}ellipse(c,4,4,13,6,'#244b352f');c.rotate(o.angle);c.lineWidth=2;c.strokeStyle='#fcffe1';
 switch(o.kind){case 0:rr(c,-7,-15,14,29,4,'#76c2d5','#e6f6d1');rr(c,-4,-22,8,9,2,'#5989b8');rr(c,-6,-4,12,10,1,'#f7f2ca');break;case 1:rr(c,-9,-12,18,25,4,'#c5d2c4','#eff4cf');ellipse(c,0,-11,8,3,'#eff4df');ellipse(c,0,-11,3,1,'#728c78');rr(c,-8,-3,16,8,1,'#dabb62');break;case 2:rr(c,-7,-8,14,25,4,'#4d9a72','#b7dfaa');rr(c,-3,-24,6,18,2,'#448562');rr(c,-6,1,12,10,1,'#e6dca5');break;case 3:c.fillStyle='#caad74';c.beginPath();c.moveTo(-13,-12);c.lineTo(12,-16);c.lineTo(16,13);c.lineTo(-10,17);c.closePath();c.fill();c.stroke();c.strokeStyle='#957847';c.beginPath();c.moveTo(-6,-12);c.lineTo(-1,14);c.moveTo(2,-6);c.lineTo(9,-7);c.moveTo(3,0);c.lineTo(10,-1);c.stroke();break;case 4:c.fillStyle='#89968a';c.beginPath();[[-13,-5],[-8,-15],[3,-9],[12,-12],[16,4],[8,15],[-10,11]].forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();c.strokeStyle='#536e5e';c.beginPath();c.moveTo(-6,-4);c.lineTo(3,6);c.lineTo(9,-2);c.stroke();}
 c.restore();}
function tree(c,t,l){c.save();c.translate(t.x,t.y);c.scale(t.size,t.size);ellipse(c,19,5,37,16,'#213e3433');rr(c,-5,-49,10,56,3,'#6c6344');if(t.type===1){const colors=l===2?['#536e45','#698a50','#83a05e']:['#3e694b','#4f8057','#6d965f'];[0,1,2].forEach(i=>{c.fillStyle=colors[i];c.beginPath();c.moveTo(0,-105+i*23);c.lineTo(-31+i*5,-34+i*13);c.quadraticCurveTo(0,-23+i*13,32-i*5,-34+i*13);c.closePath();c.fill();});}else{ellipse(c,0,-54,35,34,'#416a49');ellipse(c,-16,-62,22,25,'#4f7e50');ellipse(c,14,-64,24,28,'#588557');ellipse(c,-3,-78,24,24,'#6d965b');ellipse(c,-10,-83,13,14,'#86a467');}c.restore();}
function player(c,p,t,moving){c.save();c.translate(p.x,p.y);ellipse(c,0,6,17,8,'#203d3939');const walk=moving?Math.sin(t*15)*5:0;const flip=p.facing<0?-1:1;c.scale(flip,1);rr(c,-10,-5+walk,8,16,3,'#173e4e');rr(c,3,-5-walk,8,16,3,'#173e4e');rr(c,-12,4+walk,11,6,2,'#efebbf');rr(c,2,4-walk,11,6,2,'#efebbf');rr(c,-17,-33,14,32,6,'#bfcf6d','#759052');rr(c,-11,-34,26,30,7,'#387dad');rr(c,-1,-33,5,28,1,'#bbde7a');rr(c,-16,-29,7,21,4,'#c4db81');rr(c,14,-29,7,21,4,'#c4db81');ellipse(c,17,-6,5,5,'#eef4c7');ellipse(c,-12,-8,5,5,'#eef4c7');ellipse(c,2,-43,13,14,'#e1b383');ellipse(c,-1,-49,14,8,'#234d50');rr(c,0,-48,20,5,2,'#345d57');ellipse(c,8,-40,1.5,1.6,'#294a46');c.restore();}
function base(c,b,near){c.save();c.translate(b.x,b.y);if(near){ellipse(c,0,19,72,24,'#e6fabe50');}for(let i=0;i<5;i++){const x=-86+i*36;rr(c,x,-57,29,45,3,'#284f4550');rr(c,x,-61,28,42,3,C.kinds[i].color,'#ecf4cd');rr(c,x-2,-65,32,7,2,'#ecf0c5');c.fillStyle='#fff8';c.font='bold 16px system-ui';c.textAlign='center';c.fillText(C.kinds[i].symbol,x+14,-34);}rr(c,-76,-109,152,29,5,'#163e3b');c.fillStyle='#e7f4c7';c.font='bold 12px system-ui';c.textAlign='center';c.fillText('ПУНКТ СОРТИРОВКИ',0,-90);c.fillStyle='#856f50';c.fillRect(-64,-80,4,17);c.fillRect(61,-80,4,17);c.restore();}
function artifact(c,a,level,t){c.save();c.translate(a.x,a.y);const pulse=1+Math.sin(t*3)*.12;ellipse(c,0,0,29*pulse,19*pulse,'#f5db794d');c.translate(0,Math.sin(t*3)*3-9);c.strokeStyle='#fff2bb';c.lineWidth=2.5;if(level===0){ellipse(c,0,0,13,13,'#d4af58');ellipse(c,0,0,9,9,'#f4edcb');c.strokeStyle='#5f8277';c.beginPath();c.moveTo(-3,7);c.lineTo(3,-7);c.stroke();c.strokeStyle='#c47349';c.beginPath();c.moveTo(0,0);c.lineTo(3,-7);c.stroke();}else if(level===1){rr(c,-17,-11,34,24,3,'#bb8ba2','#f3d9c5');rr(c,-13,-7,26,11,2,'#f1dabd');ellipse(c,-7,-2,3,3,'#566469');ellipse(c,7,-2,3,3,'#566469');}else{rr(c,-4,0,8,13,1,'#e0bf5b');rr(c,-11,10,22,5,2,'#cab164');rr(c,-12,-13,24,17,6,'#edd578','#fff1b5');}c.fillStyle='#fff4c9';c.font='20px system-ui';c.fillText('✦',19,-18);c.restore();}
C.draw=(g,canvas,now)=>{
 const c=canvas.getContext('2d'),w=g.world;if(!w)return;const W=g.viewW,H=g.viewH,s=g.scale;c.setTransform(g.dpr,0,0,g.dpr,0,0);c.clearRect(0,0,W,H);c.save();c.scale(s,s);c.translate(-g.camera.x,-g.camera.y);c.drawImage(w.terrain,0,0);
 w.zones.forEach(z=>{const count=w.items.filter(t=>t.zone===z.id&&t.state>0).length;if(count){c.globalAlpha=count/z.count*.4;ellipse(c,z.x,z.y,120,95,w.def.light);c.globalAlpha=1;}if(count===z.count){c.fillStyle='#f5f6d2';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('✓ МЕСТО СНОВА ЧИСТОЕ',z.x,z.y+118);}});
 w.items.filter(t=>t.state>0).forEach(t=>{c.strokeStyle='#4e8051';c.lineWidth=2;c.beginPath();c.moveTo(t.x,t.y+3);c.lineTo(t.x,t.y-7);c.stroke();ellipse(c,t.x-4,t.y-1,4,2,'#477747');ellipse(c,t.x,t.y-8,4,4,t.id%2?'#e8e8ad':'#dfe9db');ellipse(c,t.x,t.y-8,1.5,1.5,'#d2b558');});
 if(g.route&&g.route.length){c.setLineDash([3,9]);c.lineWidth=3;c.strokeStyle='#effacfa3';c.beginPath();c.moveTo(g.player.x,g.player.y);g.route.forEach(p=>c.lineTo(p.x,p.y));c.stroke();c.setLineDash([]);let p=g.route[g.route.length-1];ellipse(c,p.x,p.y,6,4,'#f2f6cc');}
 const sel=g.nearest?g.nearest():null,entities=[];w.items.filter(t=>!t.state).forEach(t=>entities.push({y:t.y,draw:()=>item(c,t,now,sel&&sel.type==='item'&&sel.obj.id===t.id)}));w.trees.forEach(t=>entities.push({y:t.y,draw:()=>tree(c,t,w.level)}));w.rocks.forEach(t=>entities.push({y:t.y,draw:()=>{ellipse(c,t.x+5,t.y+4,t.size,t.size*.5,'#38533830');ellipse(c,t.x,t.y,t.size,t.size*.65,'#99a389');ellipse(c,t.x-3,t.y-4,t.size*.6,t.size*.32,'#b1b59a');}}));entities.push({y:w.base.y-20,draw:()=>base(c,w.base,C.dist(g.player,w.base)<92)});if(w.artifact.status===1)entities.push({y:w.artifact.y,draw:()=>artifact(c,w.artifact,w.level,now)});entities.push({y:g.player.y,draw:()=>player(c,g.player,now,g.moving)});entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
 (g.effects||[]).forEach(e=>{const p=(now-e.born)/.9;if(p<0||p>1)return;c.globalAlpha=1-p;if(e.text){c.fillStyle='#fffbd3';c.strokeStyle='#214437';c.lineWidth=3;c.font='bold 14px system-ui';c.textAlign='center';c.strokeText(e.text,e.x,e.y-28-p*35);c.fillText(e.text,e.x,e.y-28-p*35);}else{for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.fillStyle=i%2?'#e5f394':'#f7edb7';c.fillRect(e.x+Math.cos(a)*p*40,e.y+Math.sin(a)*p*30,4,4);}}c.globalAlpha=1;});c.restore();
};
C.drawMap=(g,canvas,full=false)=>{
 const c=canvas.getContext('2d'),w=g.world;if(!w)return;const W=canvas.width,H=canvas.height,s=Math.min(W/C.W,H/C.H),ox=(W-C.W*s)/2,oy=(H-C.H*s)/2;c.clearRect(0,0,W,H);c.fillStyle='#234b3f';c.fillRect(0,0,W,H);c.save();c.translate(ox,oy);c.scale(s,s);c.drawImage(w.terrain,0,0);c.fillStyle='#315d424f';w.trees.forEach(t=>ellipse(c,t.x,t.y,23,23,'#365f49'));
 w.zones.forEach(z=>{c.strokeStyle=w.items.filter(t=>t.zone===z.id&&t.state>0).length===z.count?'#f2f8c0':'#315642';c.lineWidth=full?5:8;c.beginPath();c.arc(z.x,z.y,127,0,Math.PI*2);c.stroke();if(full){c.fillStyle='#193e35';c.font='bold 43px system-ui';c.textAlign='center';c.fillText('0'+(z.id+1),z.x,z.y-148);}});
 w.items.filter(t=>!t.state).forEach(t=>ellipse(c,t.x,t.y,full?9:11,full?9:11,'#f6edb3'));
 if(g.route&&g.route.length){c.strokeStyle='#f7ffdb';c.lineWidth=full?8:10;c.setLineDash([18,16]);c.beginPath();c.moveTo(g.player.x,g.player.y);g.route.forEach(t=>c.lineTo(t.x,t.y));c.stroke();c.setLineDash([]);}
 rr(c,w.base.x-34,w.base.y-30,68,60,6,'#eff3ce','#2b6855');c.fillStyle='#276050';c.font='bold 41px system-ui';c.textAlign='center';c.fillText('⌂',w.base.x,w.base.y+17);
 if(w.artifact.status===1){c.fillStyle='#ffeb81';c.strokeStyle='#547445';c.lineWidth=5;c.font='bold 70px system-ui';c.strokeText('✦',w.artifact.x,w.artifact.y+22);c.fillText('✦',w.artifact.x,w.artifact.y+22);}ellipse(c,g.player.x,g.player.y,full?22:29,full?22:29,'#f4f8db');ellipse(c,g.player.x,g.player.y,full?14:19,full?14:19,'#4c89d7');c.restore();return{scale:s,x:ox,y:oy};
};
})();
