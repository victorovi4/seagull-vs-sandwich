/* Clean Games / Team Route. Pure, deterministic rules; no network or external dependencies. */
'use strict';
window.Team = (() => {
  const VERSION = '1.0.0', LIMIT = 48, CAP = 12;
  const kinds = [
    {name:'Пластик',symbol:'♳',color:'#428ac2',rate:2},
    {name:'Металл',symbol:'▤',color:'#bc8c2e',rate:3},
    {name:'Стекло',symbol:'◇',color:'#53876d',rate:2},
    {name:'Бумага',symbol:'▱',color:'#ac7952',rate:2},
    {name:'Смешанное',symbol:'▰',color:'#738181',rate:1}
  ];
  const nodes = {
    base:{x:740,y:1320,name:'Склад и финиш',tag:'СДАЧА МЕШКОВ',icon:'⚑'},
    gate:{x:490,y:1140,name:'Южная развилка',tag:'ДВА ПУТИ',icon:'↗'},
    lawn:{x:250,y:1000,name:'Большая поляна',tag:'ОСНОВНАЯ ЗАДАЧА',icon:'01',goal:true},
    bridge:{x:610,y:870,name:'Мостик',tag:'КОРОТКИЙ ПУТЬ',icon:'↔'},
    sign:{x:340,y:690,name:'Лесная развилка',tag:'К СЦЕНЕ ИЛИ К ВОДЕ',icon:'↗'},
    picnic:{x:840,y:590,name:'Место пикника',tag:'ОСНОВНАЯ ЗАДАЧА',icon:'02',goal:true},
    stage:{x:220,y:400,name:'Старая сцена',tag:'ДОПОЛНИТЕЛЬНО',icon:'03'},
    lookout:{x:480,y:245,name:'Верхняя тропа',tag:'В ОБХОД ОЗЕРА',icon:'↗'}
  };
  const edges = [
    ['base','gate',2,[[660,1250],[540,1220]]],
    ['gate','lawn',2,[[390,1110],[315,1060]]],
    ['lawn','sign',3,[[215,890],[255,790]]],
    ['sign','stage',3,[[285,610],[200,515]]],
    ['stage','lookout',2,[[215,290],[355,240]]],
    ['lookout','picnic',4,[[660,230],[820,310],[890,445]]],
    ['picnic','bridge',3,[[900,705],[850,800],[740,865]]],
    ['bridge','gate',2,[[540,975],[555,1070]]],
    ['bridge','sign',2,[[485,810],[415,730]]],
    ['base','bridge',3,[[825,1170],[815,1030],[735,950]]]
  ];
  const piles = [
    {id:0,node:'lawn',kind:0,q:3,name:'Пустые ПЭТ-бутылки',dx:-65,dy:-45},
    {id:1,node:'lawn',kind:1,q:2,name:'Алюминиевые банки',dx:55,dy:-50},
    {id:2,node:'lawn',kind:3,q:2,name:'Сухие картонные коробки',dx:-75,dy:40},
    {id:3,node:'lawn',kind:4,q:3,name:'Использованные салфетки',dx:60,dy:50},
    {id:4,node:'picnic',kind:0,q:3,name:'Пустые ПЭТ-бутылки',dx:-65,dy:-40},
    {id:5,node:'picnic',kind:2,q:3,name:'Целые стеклянные бутылки',dx:60,dy:-30},
    {id:6,node:'picnic',kind:4,q:3,name:'Грязные салфетки',dx:-30,dy:65},
    {id:7,node:'stage',kind:1,q:3,name:'Алюминиевые банки',dx:-65,dy:-45},
    {id:8,node:'stage',kind:2,q:2,name:'Целые стеклянные бутылки',dx:65,dy:-40},
    {id:9,node:'stage',kind:3,q:3,name:'Сухой картон',dx:-65,dy:45},
    {id:10,node:'stage',kind:1,q:4,name:'Металлическая стойка',dx:65,dy:50,heavy:true}
  ];
  const zones = ['lawn','picnic','stage'];
  const graph = Object.fromEntries(Object.keys(nodes).map(k=>[k,[]]));
  edges.forEach(([a,b,c])=>{graph[a].push([b,c]);graph[b].push([a,c]);});
  function path(from,to){
    if(!nodes[from]||!nodes[to])return {nodes:[],cost:Infinity};
    let dist={[from]:0},prev={},open=[from],done=new Set();
    while(open.length){open.sort((a,b)=>dist[a]-dist[b]);const a=open.shift();if(done.has(a))continue;done.add(a);if(a===to)break;
      for(const [b,c] of graph[a])if(dist[b]===undefined||dist[a]+c<dist[b]){dist[b]=dist[a]+c;prev[b]=a;open.push(b);}}
    let route=[to];while(route[0]!==from){if(!prev[route[0]])return {nodes:[],cost:Infinity};route.unshift(prev[route[0]]);}
    return {nodes:route,cost:dist[to]};
  }
  function edge(a,b){return edges.find(e=>e[0]===a&&e[1]===b||e[0]===b&&e[1]===a);}
  function polyline(a,b){const e=edge(a,b);if(!e)return [{...nodes[a]}];let out=[nodes[e[0]],...e[3].map(([x,y])=>({x,y})),nodes[e[1]]];return e[0]===a?out:out.reverse();}
  function along(points,t){
    if(points.length<2)return {...points[0]};
    const ds=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=ds.reduce((a,b)=>a+b,0);let d=Math.max(0,Math.min(1,t))*total;
    for(let i=0;i<ds.length;i++){if(d<=ds[i]||i===ds.length-1){const f=ds[i]?d/ds[i]:0;return {x:points[i].x+(points[i+1].x-points[i].x)*f,y:points[i].y+(points[i+1].y-points[i].y)*f};}d-=ds[i];}return {...points.at(-1)};
  }
  function make(relaxed=false){return {version:1,relaxed,node:'base',turn:0,state:piles.map(()=>0),photos:[],artifact:0,story:false,title:'',errors:0,spent:{walk:0,work:0,wait:0},buddy:{mode:'follow',node:'base',leg:null},finished:false,log:[]};}
  function load(s,holder=1){return piles.reduce((a,p)=>a+(s.state[p.id]===holder?p.q:0),0);}
  function bags(s,holder=1){return kinds.map((_,k)=>piles.reduce((a,p)=>a+(p.kind===k&&s.state[p.id]===holder?p.q:0),0));}
  function clear(s,z){return piles.filter(p=>p.node===z).every(p=>s.state[p.id]>0);}
  function delivered(s,z){return piles.filter(p=>p.node===z).every(p=>s.state[p.id]===3);}
  function together(s){return s.buddy.mode==='follow'||!s.buddy.leg&&s.buddy.node===s.node&&s.buddy.mode==='return';}
  function remaining(s){return s.relaxed?Infinity:Math.max(0,LIMIT-s.turn);}
  function buddyPos(s){const b=s.buddy;return b.mode==='follow'?{x:nodes[s.node].x+30,y:nodes[s.node].y+18}:b.leg?along(polyline(b.leg.from,b.leg.to),1-b.leg.left/b.leg.total):{...nodes[b.node]};}
  function eta(s){const b=s.buddy;if(together(s))return 0;let rest=b.leg?b.leg.left:0,n=b.leg?b.leg.to:b.node;
    if(b.mode==='delivery')return rest+path(n,'base').cost+1+path('base',s.node).cost;
    if(b.mode==='unload')return 1+path('base',s.node).cost;
    return rest+path(n,s.node).cost;
  }
  function tickBuddy(s,targetNode=s.node,captainAtNode=true){const b=s.buddy;
    if(b.mode==='follow'){b.node=s.node;return;}
    if(b.mode==='unload'){s.state=s.state.map(v=>v===2?3:v);b.mode='return';s.log.push('Лена сдала мешки на склад.');if(b.node===targetNode&&captainAtNode)b.mode='follow';return;}
    if(!b.leg){let target=b.mode==='delivery'?'base':targetNode;if(b.node===target){if(b.mode==='delivery')b.mode='unload';else if(captainAtNode)b.mode='follow';return;}const r=path(b.node,target),to=r.nodes[1],duration=edge(b.node,to)[2];b.leg={from:b.node,to,left:duration,total:duration};}
    b.leg.left--;if(b.leg.left<=0){b.node=b.leg.to;b.leg=null;if(b.mode==='delivery'&&b.node==='base')b.mode='unload';else if(b.mode==='return'&&b.node===targetNode&&captainAtNode)b.mode='follow';}
  }
  function points(s){let accepted=0;for(const p of piles)if(s.state[p.id]===3)accepted+=p.q*kinds[p.kind].rate;
    const cleanBonus=zones.filter(z=>delivered(s,z)).length*10,photoBonus=s.photos.length*8,artifactBonus=s.artifact===3?20+(s.story?10:0):0;
    const success=delivered(s,'lawn')&&delivered(s,'picnic')&&s.node==='base';
    const efficiency=success&&!s.relaxed?Math.max(0,LIMIT-s.turn):0;
    return {accepted,cleanBonus,photoBonus,artifactBonus,efficiency,total:accepted+cleanBonus+photoBonus+artifactBonus+efficiency,success};
  }
  function cost(s,a){if(a.type==='move')return path(s.node,a.to).cost;if(a.type==='collect')return piles[a.id]?.heavy?2:1;if(a.type==='wait')return a.n||1;if(a.type==='finish'||a.type==='end')return 0;return 1;}
  function validate(s,a){
    if(s.finished)return 'Раунд уже завершен.';
    if(!['move','collect','dispatch','deposit','photo','artifact','story','present','wait','finish','end'].includes(a.type))return 'Неизвестное действие.';
    if(a.type==='move'&&(!nodes[a.to]||a.to===s.node))return 'Ты уже здесь.';
    if(a.type==='collect'){const p=piles[a.id];if(!p||s.state[a.id]!==0||p.node!==s.node)return 'Сначала подойди к этой находке.';if(!Number.isInteger(a.kind)||!kinds[a.kind])return 'Выбери фракцию.';if(load(s)+p.q>CAP)return 'В мешках не хватает места. Сдай груз или передай его Лене.';if(p.heavy&&!together(s))return 'Стойку можно убрать только вдвоем. Дождись Лены.';}
    if(a.type==='dispatch'&&(!together(s)||!load(s)||s.node==='base'))return 'Лена должна быть рядом. На складе можно сразу сдать мешки.';
    if(a.type==='deposit'&&(s.node!=='base'||!load(s)))return 'Для сдачи нужны мешки и возвращение на склад.';
    if(a.type==='photo'&&(!zones.includes(s.node)||!clear(s,s.node)||s.photos.includes(s.node)))return 'Сначала полностью очисти участок. Повторное фото не нужно.';
    if(a.type==='artifact'&&(s.node!=='picnic'||!clear(s,'picnic')||s.artifact!==0))return 'Кубок откроется после уборки места пикника.';
    if(a.type==='story'&&(s.node!=='stage'||s.story))return 'Стенд находится у старой сцены.';
    if(a.type==='present'&&(s.node!=='base'||s.artifact!==2))return 'Принеси найденный кубок на финиш.';
    if(a.type==='wait'&&(!Number.isInteger(a.n)||a.n<1||a.n>12))return 'Выбери от 1 до 12 ходов ожидания.';
    if(a.type==='finish'&&s.node!=='base')return 'Финиш команды находится на складе.';
    if(cost(s,a)>remaining(s))return 'На это действие не хватает ходов. Заверши раунд или продолжи в режиме прогулки.';
    return '';
  }
  function apply(original,a){
    const s=JSON.parse(JSON.stringify(original)),error=validate(s,a);if(error)return {ok:false,error};
    const hero=[{...nodes[s.node]}],buddy=[buddyPos(s)],events=[];let n=cost(s,a);
    function spend(type,pos,target=s.node,arrived=true){s.turn++;s.spent[type]++;tickBuddy(s,target,arrived);const hp=pos||{...nodes[s.node]};hero.push(hp);buddy.push(s.buddy.mode==='follow'?{x:hp.x+30,y:hp.y+18}:buddyPos(s));}
    if(a.type==='collect'&&a.kind!==piles[a.id].kind){s.errors++;spend('work');events.push('Не эта фракция. '+piles[a.id].name+' → '+kinds[piles[a.id].kind].name.toLowerCase()+'. Потрачен 1 ход.');n=1;}
    else if(a.type==='move'){
      const r=path(s.node,a.to);for(let i=1;i<r.nodes.length;i++){const from=r.nodes[i-1],to=r.nodes[i],dur=edge(from,to)[2],line=polyline(from,to);
        for(let t=1;t<=dur;t++){if(t===dur)s.node=to;spend('walk',along(line,t/dur),to,t===dur);}
      }
    }else if(a.type==='finish'||a.type==='end'){s.finished=true;}
    else {
      if(a.type==='dispatch'){s.state=s.state.map(v=>v===1?2:v);s.buddy={mode:'delivery',node:s.node,leg:null};events.push('Лена повезла раздельные мешки. Продолжай работать: она догонит тебя.');}
      for(let i=0;i<n;i++)spend(a.type==='wait'?'wait':'work');
      if(a.type==='collect'){s.state[a.id]=1;events.push('+'+piles[a.id].q+' в мешок «'+kinds[a.kind].name+'».');if(clear(s,s.node))events.push('Участок чист! Можно сделать фото «после».');}
      if(a.type==='deposit'){s.state=s.state.map(v=>v===1?3:v);events.push('Мешки приняты. Баллы команды обновлены.');}
      if(a.type==='photo'){s.photos.push(s.node);events.push('Фото «до / после» принято. +8 баллов.');}
      if(a.type==='artifact'){s.artifact=2;events.push('Найден кубок «Команда двора · 2001». На стенде у сцены есть его история.');}
      if(a.type==='story'){s.story=true;events.push('На стенде — история дворового турнира. Кубок дали команде, которая помогла всем после праздника.');}
      if(a.type==='present'){s.artifact=3;s.title=['Кубок второго шанса','Приз за волю к уборке','2001: чистая одиссея'][Math.max(0,Math.min(2,a.choice||0))];events.push('«'+s.title+'» принят на конкурс артефактов. +'+(s.story?30:20)+' баллов.');}
    }
    // Both actors share an action clock. Idle thinking, panning and dialogs never spend it.
    if(s.buddy.mode==='follow')s.buddy.node=s.node;
    if(!s.relaxed&&s.turn>=LIMIT){s.finished=true;events.push('Финишный сигнал! Результат сохранен.');}
    events.push(...s.log.splice(0));
    return {ok:true,s,hero,buddy,events,cost:n};
  }
  function restore(raw){
    if(!raw||raw.version!==1||!nodes[raw.node]||!Array.isArray(raw.state)||raw.state.length!==piles.length||!raw.state.every(v=>[0,1,2,3].includes(v)))return null;
    if(!Number.isInteger(raw.turn)||raw.turn<0||raw.turn>10000||load(raw)>CAP||load(raw,2)>CAP)return null;
    const s=JSON.parse(JSON.stringify(raw)),b=s.buddy;
    if(!b||!['follow','delivery','unload','return'].includes(b.mode)||!nodes[b.node])return null;
    if(b.leg&&(!edge(b.leg.from,b.leg.to)||!Number.isFinite(b.leg.left)||b.leg.left<=0||b.leg.left>b.leg.total))return null;
    if(b.mode==='follow'&&s.state.includes(2))return null;
    if(![0,2,3].includes(s.artifact))return null;
    s.relaxed=!!s.relaxed;s.story=!!s.story;s.photos=Array.isArray(s.photos)?[...new Set(s.photos.filter(z=>zones.includes(z)&&clear(s,z)))]:[];s.errors=Number.isInteger(s.errors)?Math.max(0,s.errors):0;s.log=[];
    s.spent=s.spent||{walk:0,work:0,wait:0};for(const k of ['walk','work','wait'])if(!Number.isFinite(s.spent[k])||s.spent[k]<0)s.spent[k]=0;
    return s;
  }
  return {VERSION,LIMIT,CAP,kinds,nodes,edges,piles,zones,path,edge,polyline,along,make,load,bags,clear,delivered,together,remaining,buddyPos,eta,points,cost,validate,apply,restore};
})();
