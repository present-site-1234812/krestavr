/* Services background: drawn plan -> shaded drawing -> existing solid surface. */
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
    timer=setTimeout(finish,3700);
    try{
      layer=document.createElement('div');layer.className='services-blueprint';layer.setAttribute('aria-hidden','true');
      const grid=[];
      for(let x=0;x<=1440;x+=48)grid.push(`M${x} 0V900`);
      for(let y=0;y<=900;y+=48)grid.push(`M0 ${y}H1440`);
      layer.innerHTML=`<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
        <path class="blueprint-grid" d="${grid.join('')}"/>
        <g class="blueprint-plan">
          <path d="M200 180H1240V720H200ZM216 196H1224V704H216Z"/>
          <path d="M560 196V390H216M560 470V704M580 196V390M580 470V704M216 410H450M530 410H720M800 410H1224M216 430H450M530 430H720M800 430H1224"/>
          <path d="M870 196V390M890 196V390M870 430V550M870 630V704M890 430V550M890 630V704M890 570H1030M1110 570H1224M890 590H1030M1110 590H1224"/>
          <path d="M450 410V330Q530 330 530 410M720 410V330Q800 330 800 410M870 550H790Q790 630 870 630M1030 570V490Q1110 490 1110 570"/>
          <path d="M260 180V196M320 180V196M350 180V196M410 180V196M650 180V196M710 180V196M970 180V196M1030 180V196M1070 180V196M1130 180V196M260 704V720M340 704V720M390 704V720M470 704V720M650 704V720M730 704V720M970 704V720M1050 704V720M1110 704V720M1170 704V720"/>
          <path d="M630 485H820V510H630ZM630 525H820M630 540H820M630 555H820M630 570H820M630 585H820M630 600H820M630 615H820M630 630H820M725 495V650m-8-8 8 8 8-8"/>
        </g>
        <g class="blueprint-dimensions"><path d="M170 140H1270M200 115V165M560 115V165M880 115V165M1240 115V165M190 150l20-20m340 20 20-20m300 20 20-20m340 20 20-20M150 160V740M125 180H175M125 410H175M125 720H175M140 190l20-20m-20 250 20-20m-20 330 20-20M200 760H1240M200 740V785M1240 740V785M190 770l20-20m1020 20 20-20"/></g>
        <g class="blueprint-sketch"><path d="M216 196H560V390H216ZM580 196H870V390H580ZM890 196H1224V390H890ZM216 430H560V704H216ZM890 430H1224V550H890ZM890 590H1224V704H890Z"/><path class="blueprint-courtyard" d="M580 430H850V704H580Z"/></g>
        <rect class="blueprint-surface" width="1440" height="900"/>
      </svg>`;
      section.prepend(layer);
      layer.querySelector('.blueprint-surface').setAttribute('fill',getComputedStyle(section).backgroundColor);
      animate(layer.querySelector('.blueprint-grid'),[{opacity:0},{opacity:1}],{duration:300});
      layer.querySelectorAll('.blueprint-plan path,.blueprint-dimensions path').forEach((path,index)=>{
        path.setAttribute('pathLength','1');
        animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:850,delay:100+index*70,easing:'ease-in-out'});
      });
      animate(layer.querySelector('.blueprint-sketch'),[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:1100,easing:'ease-out'});
      const surface=layer.querySelector('.blueprint-surface');
      const completion=animate(surface,[{clipPath:'circle(0% at 48% 48%)'},{clipPath:'circle(115% at 48% 48%)'}],{duration:1100,delay:1900,easing:'cubic-bezier(.45,0,.2,1)'});
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
