/* Services: game-style blue construction plans become the original surface. */
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
        <g class="blueprint-diagram">
        <path class="blueprint-grid" d="${grid.join('')}"/>
        <g class="blueprint-plan">
          <path d="M170 205L500 165V550L170 590ZM180 215L490 178V540L180 577Z"/>
          <path d="M280 192V575M390 178V562M170 332L500 292M170 461L500 421M180 215L280 318 390 178M170 332L280 446 390 306M170 461L280 575 390 435M390 178L490 292M390 306L490 421M390 435L490 540"/>
          <path d="M660 600L1020 390 1190 470 830 680ZM660 600V570L1020 360V390M830 680V650L1190 440V470M660 570L830 650M1020 360L1190 440"/>
          <path d="M696 549L866 629M732 528L902 608M768 507L938 587M804 486L974 566M840 465L1010 545M876 444L1046 524M912 423L1082 503M948 402L1118 482M984 381L1154 461M715 626L1075 416M772 652L1132 443"/>
          <path d="M580 460L925 255 1110 343M580 460V425L615 405V390L650 370V355L685 335V320L720 300V285L755 265V250L790 230V215L825 195V180L860 160 1045 248M615 405L800 493M650 370L835 458M685 335L870 423M720 300L905 388M755 265L940 353M790 230L975 318M825 195L1010 283M860 160L1045 248M765 548V513L800 493V478L835 458V443L870 423V408L905 388V373L940 353V338L975 318V303L1010 283V268L1045 248M580 460L765 548"/>
          <path d="M162 197h16v16h-16zM492 157h16v16h-16zM162 582h16v16h-16zM492 542h16v16h-16zM652 592h16v16h-16zM1182 462h16v16h-16z"/>
        </g>
        <g class="blueprint-dimensions"><path d="M145 155L510 111M170 130V175M500 90V135M148 200L148 600M125 205H160M125 590H160M150 215l18-20M485 135l18-20M640 735L1200 500M640 715V755M1200 480V520M625 745l20-20M1190 515l20-20M1190 185h40m-20-20v40M530 700h40m-20-20v40M103 105h40m-20-20v40"/></g>
        <g class="blueprint-sketch"><path d="M170 205L500 165V550L170 590ZM660 600L1020 390 1190 470 830 680ZM580 460L860 160 1045 248 765 548Z"/><path class="blueprint-courtyard" d="M170 461L500 421V550L170 590ZM660 600L830 680V650L660 570Z"/></g>
        </g>
        <rect class="blueprint-surface" width="1440" height="900"/>
      </svg>`;
      // Light ink stays readable over the blue sheet; restore all original colors.
      section.querySelectorAll('.section-label,.section-heading h2,.section-heading > p,.number,.plus,.service-list h3,.service-list details p').forEach(element=>{
        const color=getComputedStyle(element).color;
        animate(element,[{color:'#f0f8ff'},{color:'#f0f8ff',offset:.64},{color,offset:.96},{color}],{duration:3000,easing:'linear'});
      });
      section.prepend(layer);
      layer.querySelector('.blueprint-surface').setAttribute('fill',getComputedStyle(section).backgroundColor);
      animate(layer.querySelector('.blueprint-grid'),[{opacity:0},{opacity:1}],{duration:300});
      layer.querySelectorAll('.blueprint-plan path,.blueprint-dimensions path').forEach((path,index)=>{
        path.setAttribute('pathLength','1');
        animate(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:850,delay:100+index*70,easing:'ease-in-out'});
      });
      animate(layer.querySelector('.blueprint-sketch'),[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,delay:1100,easing:'ease-out'});
      const surface=layer.querySelector('.blueprint-surface');
      const completion=animate(surface,[{opacity:0},{opacity:1}],{duration:1100,delay:1900,easing:'cubic-bezier(.45,0,.2,1)'});
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
