/* Services: pale drafting paper, construction plan, then pencil shading. */
(() => {
  const section=document.querySelector('#services');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section || motion.matches || !window.IntersectionObserver || !Element.prototype.animate) return;
  let started=false,layer,timer;
  const animations=[];
  function finish(){clearTimeout(timer);animations.forEach(a=>a.cancel());layer?.remove();}
  function animate(element,frames,options){const a=element.animate(frames,{fill:'both',...options});animations.push(a);return a;}
  function build(){
    if(started || document.hidden || motion.matches)return;
    started=true;
    timer=setTimeout(finish,4200);
    try{
      layer=document.createElement('div');layer.className='services-blueprint';layer.setAttribute('aria-hidden','true');
      const grid=[];
      for(let x=0;x<=1440;x+=48)grid.push(`M${x} 0V900`);
      for(let y=0;y<=900;y+=48)grid.push(`M0 ${y}H1440`);
      const strokes=[];
      for(let row=0,t=-1540;t<=980;row++,t+=24){
        const a=[-40,t+Math.sin(row*1.7)*3],b=[1480,t+1520+Math.cos(row*1.3)*3];
        const [from,to]=row%2?[b,a]:[a,b];
        strokes.push(`${row===0?'M':'L'}${from.join(' ')}L${to.join(' ')}`);
      }
      layer.innerHTML=`<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
        <g class="blueprint-diagram">
        <path class="blueprint-grid" d="${grid.join('')}"/>
        <g class="blueprint-plan">
          <path d="M210 180H1230V720H210ZM225 195H1215V705H225Z"/>
          <path d="M560 195V390H225M560 470V705M578 195V390M578 470V705M225 410H445M525 410H730M810 410H1215M225 428H445M525 428H730M810 428H1215"/>
          <path d="M875 195V390M893 195V390M875 428V548M875 628V705M893 428V548M893 628V705M893 568H1030M1110 568H1215M893 586H1030M1110 586H1215"/>
          <path d="M445 410V330Q525 330 525 410M730 410V330Q810 330 810 410M875 548H795Q795 628 875 628M1030 568V488Q1110 488 1110 568"/>
          <path d="M265 180V195M345 180V195M390 180V195M470 180V195M655 180V195M735 180V195M965 180V195M1045 180V195M1100 180V195M1180 180V195M265 705V720M345 705V720M390 705V720M470 705V720M655 705V720M735 705V720M965 705V720M1045 705V720M1100 705V720M1180 705V720"/>
          <path d="M625 480H825V505H625ZM625 520H825M625 537H825M625 554H825M625 571H825M625 588H825M625 605H825M625 622H825M625 639H825M725 490V660m-8-8 8 8 8-8"/>
          <path d="M265 245H430V335H265ZM285 245V275H410V245M940 240H1160V335H940ZM965 255H1135M965 275H1135M965 295H1135M270 490H455V650H270ZM300 520H425V620H300Z"/>
        </g>
        <g class="blueprint-dimensions"><path d="M180 140H1260M210 115V165M560 115V165M884 115V165M1230 115V165M200 150l20-20m330 20 20-20m304 20 20-20m326 20 20-20M160 160V740M135 180H185M135 410H185M135 720H185M150 190l20-20m-20 250 20-20m-20 330 20-20M210 760H1230M210 740V785M1230 740V785M200 770l20-20m1000 20 20-20M1290 590V490l-12 22m12-22 12 22"/></g>
        <g class="blueprint-sketch"><path d="M225 195H560V390H225ZM578 195H875V390H578ZM893 195H1215V390H893ZM225 428H560V705H225ZM893 428H1215V548H893ZM893 586H1215V705H893Z"/><path class="blueprint-courtyard" d="M578 428H855V705H578Z"/></g>
        </g>
        <g class="blueprint-shading"><path class="blueprint-pencil-stroke" d="${strokes.join('')}"/><path class="blueprint-pencil-grain" d="${strokes.join('')}"/></g>
        <rect class="blueprint-surface" width="1440" height="900"/>
      </svg>`;
      section.prepend(layer);
      const color=getComputedStyle(section).backgroundColor;
      layer.querySelector('.blueprint-surface').setAttribute('fill',color);
      layer.querySelector('.blueprint-pencil-stroke').setAttribute('stroke',color);
      layer.querySelectorAll('.blueprint-shading path').forEach(path=>{
        path.setAttribute('pathLength','1');
        animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1900,delay:1450,easing:'linear'});
      });
      animate(layer.querySelector('.blueprint-grid'),[{opacity:0},{opacity:1}],{duration:300});
      layer.querySelectorAll('.blueprint-plan path,.blueprint-dimensions path').forEach((path,index)=>{
        path.setAttribute('pathLength','1');
        animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:850,delay:100+index*70,easing:'ease-in-out'});
      });
      animate(layer.querySelector('.blueprint-sketch'),[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:1000,easing:'ease-out'});
      const surface=layer.querySelector('.blueprint-surface');
      const completion=animate(surface,[{opacity:0},{opacity:1}],{duration:200,delay:3350,easing:'ease-out'});
      completion.finished.then(finish,finish);
    }catch{finish();}
  }
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){build();if(started)observer.disconnect();}
  },{threshold:.12});
  function observe(){if(!started){observer.unobserve(section);observer.observe(section);}}
  if(document.documentElement.classList.contains('is-loading'))document.addEventListener('site:ready',observe,{once:true});else observe();
  motion.addEventListener('change',()=>{if(motion.matches){started=true;observer.disconnect();finish();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)finish();else if(!document.hidden)observe();});
  window.addEventListener('pagehide',finish);
})();
