/* Services: pale blue grid paper gradually shaded into the original background. */
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
