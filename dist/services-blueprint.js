/* Services shading plays once when visible, independently of company text. */
(() => {
  const section=document.querySelector('#services');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section || motion.matches || !Element.prototype.animate || !window.IntersectionObserver) return;
  let layer,timer,started=false;
  const animations=[],checks=[];
  function destroy(){clearTimeout(timer);animations.splice(0).forEach(a=>a.cancel());layer?.remove();layer=null;checks.splice(0).forEach(check=>check.remove());}
  function animate(element,frames,options){
    const a=element.animate(frames,{fill:'both',...options});
    animations.push(a);return a;
  }
  function build(){
    if(started)return;
    started=true;observer.disconnect();readyObserver.disconnect();
    timer=setTimeout(destroy,6500);
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
      const summaries=[...section.querySelectorAll('.service-list summary')];
      const markDuration=280,markStep=420,firstMark=300;
      const lastMarkEnd=firstMark+Math.max(0,summaries.length-1)*markStep+markDuration;
      const shadingStart=lastMarkEnd+700;
      const shadingEnd=shadingStart+1900;
      clearTimeout(timer);timer=setTimeout(destroy,shadingEnd+850);
      summaries.forEach((summary,index)=>{
        const check=document.createElement('span');check.className='services-blueprint-check';check.setAttribute('aria-hidden','true');
        check.innerHTML='<svg viewBox="0 0 24 18" focusable="false" aria-hidden="true"><path d="M3 9l6 6L21 3" pathLength="1"/></svg>';
        summary.prepend(check);checks.push(check);
        const delay=firstMark+index*markStep;
        animate(check,[{opacity:0},{opacity:1}],{duration:90,delay});
        animate(check.querySelector('path'),[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:markDuration,delay,easing:'ease-out'});
        animate(check,[{opacity:1},{opacity:0}],{duration:400,delay:shadingStart+700,fill:'forwards'});
      });
      const color=getComputedStyle(section).backgroundColor;
      layer.querySelector('.blueprint-surface').setAttribute('fill',color);
      layer.querySelector('.blueprint-pencil-stroke').setAttribute('stroke',color);
      layer.querySelectorAll('.blueprint-shading path').forEach(path=>{
        path.setAttribute('pathLength','1');
        animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1900,delay:shadingStart,easing:'linear'});
      });
      animate(layer.querySelector('.blueprint-grid'),[{opacity:0},{opacity:1}],{duration:300});
      const surface=layer.querySelector('.blueprint-surface');
      const completion=animate(surface,[{opacity:0},{opacity:1}],{duration:200,delay:shadingEnd,easing:'ease-out'});
      completion.finished.then(destroy,destroy);
    }catch{destroy();}
  }
  function checkVisibility(entries){
    if(started || motion.matches || document.hidden || document.documentElement.classList.contains('is-loading'))return;
    const rect=section.getBoundingClientRect();
    const visible=Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0);
    const ratio=Array.isArray(entries)?entries[0].intersectionRatio:visible/rect.height;
    if(ratio>=.55)build();
  }
  // The observer only triggers playback; scrolling never controls animation time.
  const observer=new IntersectionObserver(checkVisibility,{threshold:.55});
  // Wait for the loading screen itself, without using the company animation event.
  const readyObserver=new MutationObserver(()=>{
    if(!document.documentElement.classList.contains('is-loading')){
      readyObserver.disconnect();checkVisibility();
    }
  });
  observer.observe(section);
  if(document.documentElement.classList.contains('is-loading'))readyObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  else checkVisibility();
  window.addEventListener('pageshow',checkVisibility);
  window.addEventListener('pagehide',destroy);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&started)destroy();else if(!document.hidden)checkVisibility();
  });
  motion.addEventListener('change',()=>{if(motion.matches){started=true;observer.disconnect();readyObserver.disconnect();destroy();}});
})();
