/* Company heading: bent steel letters and workers that build each local section. */
(() => {
  const heading = document.querySelector('#about-title');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!heading || motion.matches || !Element.prototype.animate || !window.IntersectionObserver) return;
  const speed = 2;
  const ns = 'http://www.w3.org/2000/svg';
  // Centre lines, rather than a mesh or the outlines of a filled font.
  const rods = {
    'О':'M50 6C-6 6-6 94 50 94S106 6 50 6',
    'В':'M12 95V5H50C94 5 94 46 50 47H12M50 47C102 47 102 95 50 95H12',
    'о':'M50 7C-5 7-5 94 50 94S105 7 50 7',
    'а':'M84 95V8M84 50C84-9 10-6 10 50S84 108 84 50',
    'д':'M9 93H91M22 92Q39 60 39 9H75V92M9 93V116M91 93V116',
    'н':'M12 7V95M88 7V95M12 50H88',
    'к':'M12 7V95M86 7L16 50 91 95',
    'м':'M10 95V8L50 76 90 8V95',
    'е':'M12 48H87Q86 7 51 7C-1 7-2 95 51 95Q74 95 88 80',
    'с':'M87 18C5-35-22 129 87 83',
    'ь':'M12 7V94H53C100 94 100 49 53 49H12',
    'ц':'M12 7V94H82V7M82 94H95V116',
    'и':'M12 7V95L88 7V95',
    'л':'M6 95Q30 95 37 8H82V95',
    'т':'M5 9H95M50 9V95',
    'р':'M13 122V8M13 50C13-8 91-8 91 50S13 109 13 50',
    'в':'M13 95V8H47C92 8 92 48 47 48H13M47 48C103 48 103 95 47 95H13',
    '.':'M44 93h5'
  };
  const model = (second) => `<svg viewBox="0 0 40 48" aria-hidden="true" focusable="false">
    <path class="worker-shadow" d="M4 46h30"/><path class="worker-boots" d="M12 32l-2 12h7l2-11m3-1 2 12h7"/>
    <path class="worker-suit" d="M10 19h14l3 16H9z"/><path class="worker-vest ${second?'worker-vest-light':''}" d="M10 19h5l3 12 2-12h5l2 16H9z"/>
    <path class="worker-reflector" d="M10 28h15m-10-8 3 13m4-13-3 13"/><circle class="worker-skin" cx="17" cy="12" r="6"/>
    <path class="worker-helmet ${second?'worker-helmet-light':''}" d="M10 11a7 7 0 0 1 14 0H9m8-8v7"/><path class="worker-face" d="M20 14h1m-7 4h6"/>
    <g class="worker-action worker-action-rebar"><path class="worker-sleeve" d="M22 21l5 4 6-3"/><path class="worker-glove" d="M30 22h4"/><path class="worker-carried-rod" d="M24 31V18Q24 12 30 12H38"/><path class="worker-rod-ribs" d="M22 19h4m-4 5h4m-4 5h4m4-19v4m5-4v4"/><path class="worker-weld" d="M33 25l4 2m-6 0 1 5"/></g>
    <g class="worker-action worker-action-concrete"><path class="worker-sleeve" d="M22 21l6-1 5-5"/><path class="worker-glove" d="M31 16l3-2"/><g class="worker-bucket"><path class="worker-pail" d="M25 12h12l-2 11h-8z"/><path class="worker-handle" d="M27 12V9q4-6 8 0v3"/><path class="worker-pail-rim" d="M25 12h12"/></g><path class="worker-pour" d="M36 18q-4 4-3 13l2 5m-2-5-2 4"/></g>
    <g class="worker-action worker-action-paint"><path class="worker-sleeve" d="M22 21l6-3 2-6"/><path class="worker-glove" d="M29 13l1-3"/><path class="worker-roller" d="M30 10V6h-6"/><rect class="worker-roller-head" x="21" y="3" width="15" height="5" rx="1"/></g>
  </svg>`;
  const cloud = `<svg viewBox="0 0 72 44" aria-hidden="true"><g class="builder-dust-cloud" fill="#b3a58d"><ellipse cx="30" cy="27" rx="13" ry="8"/><circle cx="19" cy="22" r="9"/><circle cx="40" cy="19" r="12"/><circle cx="53" cy="27" r="8"/></g><g fill="#7e857a"><path d="M18 34h4v3h-4zM44 33h3v4h-3zM57 31h2v2h-2z"/></g></svg>`;
  let job;
  function finish() {
    if (!job || job.done) return;
    job.done = true;
    clearTimeout(job.timer);
    job.animations.forEach(a => a.cancel());
    job.copy.replaceWith(...job.copy.childNodes);
    job.stage?.remove();
    heading.classList.remove('text-building','text-build-pending');
    heading.dataset.built = 'true';
  }
  function animate(element,frames,options) {
    const a=element.animate(frames,{fill:'both',...options});
    a.playbackRate = speed;
    job.animations.push(a);
    return a;
  }
  function svgElement(name,attributes={}) {
    const el=document.createElementNS(ns,name);
    Object.entries(attributes).forEach(([key,value])=>el.setAttribute(key,String(value)));
    return el;
  }
  function build() {
    if (!job || job.done || job.started || document.hidden) return;
    job.started=true;
    heading.classList.replace('text-build-pending','text-building');
    job.timer=setTimeout(finish,12000/speed);
    try {
      const origin=job.copy.getBoundingClientRect();
      const font=parseFloat(getComputedStyle(heading).fontSize);
      const glyphs=[], lines=[];
      const walker=document.createTreeWalker(job.copy,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) {
        const node=walker.currentNode;
        for(let i=0;i<node.length;i++) {
          const char=node.data[i];
          if (/\s/.test(char)) continue;
          const range=document.createRange();
          range.setStart(node,i);range.setEnd(node,i+1);
          const rect=range.getBoundingClientRect();
          if(!rect.width) continue;
          let line=lines.find(row=>Math.abs(row.top-(rect.top-origin.top))<4);
          if(!line) {line={top:rect.top-origin.top,bottom:rect.bottom-origin.top,left:rect.left-origin.left,right:rect.right-origin.left,glyphs:[]};lines.push(line);}
          line.left=Math.min(line.left,rect.left-origin.left);line.right=Math.max(line.right,rect.right-origin.left);
          const glyph={char,left:rect.left-origin.left,width:rect.width,top:rect.top-origin.top,line};
          glyphs.push(glyph);line.glyphs.push(glyph);
        }
      }
      if(!glyphs.length || glyphs.some(g=>!rods[g.char])) return finish();
      lines.sort((a,b)=>a.top-b.top);
      const stage=document.createElement('span');stage.className='text-build-stage';stage.setAttribute('aria-hidden','true');heading.append(stage);job.stage=stage;
      const steel=svgElement('svg',{class:'text-build-rebar',width:origin.width,height:origin.height,viewBox:`0 0 ${origin.width} ${origin.height}`});stage.append(steel);
      const stride=750, span=lines.length*stride, phaseStarts=[0,span+200,2*(span+200)], duration=phaseStarts[2]+span+220;
      clearTimeout(job.timer);job.timer=setTimeout(finish,duration/speed+650);
      // Four safe corner stations around the letters; routes follow the perimeter.
      const textRight=Math.max(...lines.map(line=>line.right));
      const desiredWidth=innerWidth<=700?18:26;
      const workerWidth=Math.max(10,Math.min(desiredWidth,origin.left-5,innerWidth-origin.left-textRight-8));
      const workerHeight=workerWidth*1.2;
      const leftEdge=-workerWidth-3,rightEdge=textRight+6;
      const topEdge=-workerHeight-4,bottomEdge=origin.height+1;
      const corners=[{x:leftEdge,y:topEdge},{x:rightEdge,y:topEdge},{x:rightEdge,y:bottomEdge},{x:leftEdge,y:bottomEdge}];
      const crews=[0,1].map(index=>{
        const crew=document.createElement('span');crew.className=`text-build-crew text-build-worker-${index+1}`;crew.innerHTML=model(index===1);crew.style.width=`${workerWidth}px`;crew.style.height=`${workerHeight}px`;crew.dataset.route='corners';stage.append(crew);return crew;
      });
      const motions=[[],[]],facings=[[],[]],previous=[null,null];
      const pose=(point,scale='1,1')=>`translate(${point.x}px,${point.y}px) scale(${scale})`;
      let completion;
      for(let phase=0;phase<3;phase++) {
        const material=['rebar','concrete','paint'][phase];
        crews.forEach((crew,index)=>{
          const travel=index===0?400:300;
          const action=crew.querySelector(`.worker-action-${material}`);
          animate(action,[{opacity:1},{opacity:1}],{delay:phaseStarts[phase],duration:span,fill:'none'});
          for(let step=0;step<lines.length;step++) {
            const row=(index+phase)%2===0?step:lines.length-1-step;
            const line=lines[row],middle=(line.left+line.right)/2;
            const left=index===0?line.left:middle,right=index===0?middle:line.right;
            const part=line.glyphs.filter(g=>(g.left+g.width/2<middle?0:1)===index);
            const stationX=Math.max(0,Math.min(origin.width-40,(left+right)/2-31));
            const stationY=line.top+font*.65-24;
            const corner=(phase*lines.length+step+index*2)%corners.length;
            const point=corners[corner];
            const start=phaseStarts[phase]+step*stride,arrival=start+travel,work=arrival+15;
            const from=previous[index]||point;
            if(!motions[index].length)motions[index].push({transform:pose(from),offset:0});
            else motions[index].push({transform:pose(from),offset:start/duration});
            const mid={x:(from.x+point.x)/2,y:(from.y+point.y)/2};
            if(from.y===point.y) {
              // The upper leap rises; the lower route stays in the gap under the text.
              mid.y+=point.y===topEdge?-9:1;
            } else if(from.x===point.x) {
              const clearance=point.x===leftEdge?origin.left-workerWidth-5:innerWidth-origin.left-rightEdge-workerWidth-2;
              mid.x+=(point.x===leftEdge?-1:1)*Math.max(0,Math.min(6,clearance));
            }
            motions[index].push(
              {transform:pose(mid),offset:(start+travel*.5)/duration},
              {transform:pose(point,'1.08,.92'),offset:arrival/duration},
              {transform:pose(point),offset:(arrival+60)/duration},
              {transform:pose(point),offset:(start+stride)/duration}
            );
            const facing=corner===0||corner===3?'scaleX(1)':'scaleX(-1)';
            if(!facings[index].length)facings[index].push({transform:facing,offset:0});
            facings[index].push({transform:facing,offset:arrival/duration},{transform:facing,offset:(start+stride)/duration});
            previous[index]=point;
            animate(action,[{transform:'translateY(3px) rotate(-8deg)'},{transform:'translateY(-2px) rotate(5deg)',offset:.5},{transform:'translateY(0) rotate(0)'}],{duration:320,delay:work,easing:'ease-in-out'});
            if(phase===0) {
              part.forEach((glyph,i)=>{
                const uppercase=glyph.char===glyph.char.toUpperCase()&&glyph.char!=='.';
                const group=svgElement('g',{transform:`translate(${glyph.left+glyph.width*.08} ${glyph.top+font*(uppercase ? .18 : .36)}) scale(${glyph.width*.84/100} ${font*(uppercase ? .69 : .51)/100})`});
                for(const type of ['rod-core','rod-highlight','rod-ribs']){
                  const path=svgElement('path',{d:rods[glyph.char],class:type,'vector-effect':'non-scaling-stroke'});group.append(path);
                }
                steel.append(group);glyph.steel=group;
                // The curved rod is lowered into place at the worker's current station.
                animate(group,[{opacity:0,translate:'0 -5px'},{opacity:1,translate:'0 0'}],{duration:260,delay:work+Math.min(i*12,60),easing:'ease-out'});
              });
            } else {
              const layer=job.copy.cloneNode(true);layer.className=`text-build-material text-build-${material}`;
              // Local half-line masks tie poured/painted material to this worker's tool.
              const top=Math.max(0,line.top-1),bottom=Math.min(origin.height,line.bottom+2);
              const clip=(amount)=>`inset(${bottom-(bottom-top)*amount}px ${Math.max(0,origin.width-right)}px ${Math.max(0,origin.height-bottom)}px ${left}px)`;
              stage.insertBefore(layer,crews[0]);
              animate(layer,[{opacity:0,clipPath:clip(0)},{opacity:1,clipPath:clip(.2),offset:.15},{opacity:1,clipPath:clip(1)}],{duration:330,delay:work,easing:'ease-in-out'});
            }
            if(phase===1) {
              part.forEach(glyph=>animate(glyph.steel,[{opacity:1},{opacity:0}],{duration:90,delay:work+300}));
              const stream=crew.querySelector('.worker-pour');
              animate(stream,[{opacity:0},{opacity:.9,offset:.2},{opacity:.9,offset:.8},{opacity:0}],{duration:320,delay:work,fill:'none'});
              const bucket=crew.querySelector('.worker-bucket');
              animate(bucket,[{transform:'rotate(0)'},{transform:'rotate(32deg)',offset:.3},{transform:'rotate(32deg)',offset:.8},{transform:'rotate(0)'}],{duration:330,delay:work,fill:'none'});
            }
            const effect=document.createElement('span');effect.className=`text-build-impact text-build-impact-${material}`;effect.style.left=`${Math.max(0,Math.min(origin.width-72,stationX-5))}px`;effect.style.top=`${stationY+11}px`;
            effect.innerHTML=phase===0?'<svg viewBox="0 0 72 44" aria-hidden="true"><path d="M35 15l5-4m-6 9 9 2m-12-1-2 7" fill="none" stroke="#c99b40" stroke-width="1.5"/></svg>':phase===1?cloud:'<svg viewBox="0 0 72 44" aria-hidden="true"><path d="M27 19h16m-15 3h14m-11 3h9" stroke="#536153" stroke-width="2" opacity=".35"/></svg>';
            stage.insertBefore(effect,crews[0]);
            animate(effect,[{opacity:0,transform:'scale(.5)'},{opacity:phase===1?.35:.7,transform:'scale(.9)',offset:.25},{opacity:0,transform:'translateY(-5px) scale(1.2)'}],{duration:430,delay:work+60,easing:'ease-out'});
          }
        });
      }
      // Remove exposed steel after the concrete sets, before the final coat.
      animate(steel,[{opacity:1},{opacity:0}],{duration:140,delay:phaseStarts[2]-150});
      crews.forEach((crew,index)=>{
        motions[index].push({...motions[index].at(-1),offset:1});
        facings[index].push({...facings[index].at(-1),offset:1});
        animate(crew.querySelector('svg'),facings[index],{duration,easing:'linear'});
        animate(crew,motions[index].map(frame=>({...frame,easing:'cubic-bezier(.4,0,.2,1)'})),{duration,easing:'linear'});
        const a=animate(crew,[{opacity:0},{opacity:1,offset:.04},{opacity:1,offset:.96},{opacity:0}],{duration});
        if(index===0)completion=a;
      });
      completion.finished.then(finish,finish);
    } catch {finish();}
  }
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){build();if(job?.started)observer.disconnect();}
  },{threshold:.3});
  function setup() {
    if(job || motion.matches) return;
    const copy=document.createElement('span');copy.className='text-build-copy';
    while(heading.firstChild)copy.append(heading.firstChild);heading.append(copy);
    job={copy,stage:null,animations:[],timer:0,done:false,started:false};
    heading.classList.add('text-build-pending');
    try {observer.observe(heading);} catch {finish();}
  }
  if(document.documentElement.classList.contains('is-loading'))document.addEventListener('site:ready',setup,{once:true});else setup();
  window.addEventListener('resize',()=>{if(job?.started)finish();},{passive:true});
  window.addEventListener('pagehide',finish);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&job?.started)finish();else if(!document.hidden&&!job?.started&&job&&!job.done)observer.observe(heading);});
  motion.addEventListener('change',()=>{if(motion.matches)finish();});
})();
