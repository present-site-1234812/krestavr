/* Sequential construction: horizontal courses assembled from separate fragments. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('#about-title,#services-title,#projects-title,#process-title')];
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const jobs = [];
  let current = null;
  let suspended = false;
  const worker = `<svg viewBox="0 0 80 48" aria-hidden="true" focusable="false">
    <path class="builder-scaffold" d="M4 43h67M9 43v5m52-5v5"/>
    <g class="builder-helper" transform="translate(4 17) scale(.72)"><path d="M12 23l-3 8m9-8 4 8M10 16l-5 5h17"/><path class="builder-vest" d="M10 13h9l3 11H8z"/><circle class="builder-face" cx="15" cy="9" r="4"/><path class="builder-hat" d="M9 8a6 6 0 0 1 12 0m-14 1h16"/><path class="builder-brick" d="M0 17h10v5H0z"/></g>
    <g transform="translate(30 8)"><path d="M12 23l-3 8m9-8 4 8"/><path class="builder-vest" d="M10 13h9l3 11H8z"/><circle class="builder-face" cx="15" cy="9" r="4"/><path class="builder-hat" d="M9 8a6 6 0 0 1 12 0m-14 1h16"/><path class="builder-arm" d="M16 16l8-5 4 3M24 11l-2-5m-3 0h7"/></g>
    <g class="builder-sparks"><path d="M59 19l5-3m-4 8 8 1m-9 3 4 5"/><circle cx="67" cy="19" r="1"/></g>
    <g class="builder-dust"><circle cx="57" cy="36" r="2"/><circle cx="63" cy="39" r="3"/><circle cx="69" cy="36" r="1.5"/></g>
    <g class="builder-chips"><path d="M61 29h3v3h-3zM68 31h2v2h-2z"/></g>
  </svg>`;
  const cloud = `<svg viewBox="0 0 72 44" aria-hidden="true"><g class="builder-dust-cloud" fill="#b3a58d"><ellipse cx="30" cy="27" rx="13" ry="8"/><circle cx="19" cy="22" r="9"/><circle cx="40" cy="19" r="12"/><circle cx="53" cy="27" r="8"/></g><g fill="#9d6c50"><path d="M18 34h4v3h-4zM44 33h3v4h-3zM57 31h2v2h-2z"/></g><path d="M34 12l-2-6m13 9 6-4m-25 7-7-2" fill="none" stroke="#c49b45" stroke-width="1.5"/></svg>`;

  function restore(job) {
    if (job.done) return;
    job.done = true;
    clearTimeout(job.timer);
    job.animations.forEach(animation => animation.cancel());
    if (job.copy.isConnected) job.copy.replaceWith(...job.copy.childNodes);
    job.stage?.remove();
    job.el.classList.remove('text-building', 'text-build-pending');
    job.el.dataset.built = 'true';
    if (current === job) current = null;
  }
  function complete(job) {
    restore(job);
    pump();
  }
  function failOpen() {
    suspended = true;
    jobs.forEach(restore);
  }
  function animate(job, element, frames, options) {
    const animation = element.animate(frames, {fill: 'both', ...options});
    job.animations.push(animation);
    return animation;
  }
  function build(job) {
    current = job;
    job.el.classList.remove('text-build-pending');
    job.el.classList.add('text-building');
    // A separate clock guarantees restoration even if all browser animations stop.
    job.timer = setTimeout(() => complete(job), 4200);
    try {
      const origin = job.copy.getBoundingClientRect();
      const lines = [];
      const walker = document.createTreeWalker(job.copy, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          let line = lines.find(row => Math.abs(row.top - (rect.top - origin.top)) < 4);
          if (!line) {
            line = {top: Math.max(0, rect.top - origin.top), bottom: rect.bottom - origin.top, left: rect.left - origin.left, right: rect.right - origin.left};
            lines.push(line);
          } else {
            line.left = Math.min(line.left, rect.left - origin.left);
            line.right = Math.max(line.right, rect.right - origin.left);
            line.bottom = Math.max(line.bottom, rect.bottom - origin.top);
          }
        }
      }
      if (!lines.length) return complete(job);
      lines.sort((a,b) => a.top - b.top);
      const stage = document.createElement('span');
      stage.className = 'text-build-stage';
      stage.setAttribute('aria-hidden', 'true');
      job.stage = stage;
      job.el.append(stage);
      const ink = getComputedStyle(job.el).color;
      const order = [0,2,1,3];
      let duration = 0;
      const positions = [];
      // Lay the bottom course of every line first, then the middle and top.
      for (let course = 0; course < 3; course++) {
        lines.forEach((line,row) => {
          const height = (line.bottom - line.top) / 3;
          const top = line.bottom - (course + 1) * height;
          const bottom = top + height;
          order.forEach((column,step) => {
            const left = line.left + (line.right-line.left) * column / 4;
            const right = line.left + (line.right-line.left) * (column+1) / 4;
            const delay = 120 + course * 620 + row * 95 + step * 90;
            const fragment = document.createElement('span');
            fragment.className = 'text-build-fragment';
            const text = job.copy.cloneNode(true);
            text.className = 'text-build-tile';
            text.style.clipPath = `inset(${top}px ${Math.max(0,origin.width-right)}px ${Math.max(0,origin.height-bottom)}px ${left}px)`;
            fragment.append(text);
            stage.append(fragment);
            animate(job, fragment, [
              {opacity:0, transform:`translate(${column%2 ? 7 : -7}px,12px)`, color:'#a48e70'},
              {opacity:.8, transform:'translate(0,-1px)', color:'#8e7c60', offset:.7},
              {opacity:1, transform:'translate(0,0)', color:ink}
            ], {duration:500, delay, easing:'cubic-bezier(.2,.7,.3,1)'});
            const dust = document.createElement('span');
            dust.className = 'text-build-impact';
            dust.style.left = `${Math.max(0,Math.min(origin.width-72,(left+right)/2-36))}px`;
            dust.style.top = `${bottom-30}px`;
            dust.innerHTML = cloud;
            stage.append(dust);
            animate(job,dust,[
              {opacity:0,transform:'translateY(3px) scale(.35)'},
              {opacity:.48,transform:'translateY(-2px) scale(.85)',offset:.2},
              {opacity:0,transform:'translateY(-15px) scale(1.3)'}
            ],{duration:650,delay:delay+290,easing:'ease-out'});
            const x = Math.max(0, Math.min(origin.width-80, (left+right)/2-45));
            positions.push({time:delay,transform:`translate(${x}px,${bottom-40}px)`});
            duration = Math.max(duration, delay+940);
          });
        });
      }
      const crew = document.createElement('span');
      crew.className = 'text-build-crew';
      crew.innerHTML = worker;
      stage.append(crew);
      positions.sort((a,b)=>a.time-b.time);
      const frames = [{transform:positions[0].transform,opacity:0,offset:0},...positions.map(position=>({transform:position.transform,opacity:1,offset:position.time/duration})),{transform:positions.at(-1).transform,opacity:0,offset:1}];
      const completion = animate(job,crew,frames,{duration,easing:'ease-in-out'});
      // The last dust cloud settles before the queue advances to another heading.
      completion.finished.then(()=>{if(!job.done)complete(job);},()=>{if(!job.done)complete(job);});
    } catch {
      complete(job);
    }
  }
  function pump() {
    if (current || suspended || document.hidden) return;
    const next = jobs.find(job => !job.done && job.seen);
    if (!next) return;
    // Jumping directly to a later section must not leave earlier text unfinished.
    for (const job of jobs) {
      if (job === next) break;
      if (!job.done) restore(job);
    }
    build(next);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const job = jobs.find(job => job.el === entry.target);
      if (job && !job.done) job.seen = true;
      observer.unobserve(entry.target);
    });
    pump();
  }, {threshold:.3});
  function setup() {
    try {
      targets.forEach(el => {
        const copy = document.createElement('span');
        copy.className = 'text-build-copy';
        while (el.firstChild) copy.append(el.firstChild);
        el.append(copy);
        const job = {el,copy,seen:false,done:false,animations:[],timer:0};
        jobs.push(job);
        el.classList.add('text-build-pending');
        observer.observe(el);
      });
    } catch { failOpen(); }
  }
  if (document.documentElement.classList.contains('is-loading')) document.addEventListener('site:ready', setup, {once:true});
  else setup();
  window.addEventListener('resize', () => {
    // A responsive line break invalidates fragment coordinates; reveal safely.
    if (current) restore(current);
    pump();
  }, {passive:true});
  window.addEventListener('pagehide', failOpen);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && current) restore(current);
    if (!document.hidden) pump();
  });
  motion.addEventListener('change', () => { if (motion.matches) failOpen(); });
})();
