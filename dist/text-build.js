/* Company heading: reinforcement, concrete and paint, with independent workers. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('#about-title')];
  if (motion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const jobs = [];
  let current = null;
  let suspended = false;
  const workers = [
    `<svg viewBox="0 0 36 48" aria-hidden="true" focusable="false">
      <path class="worker-shadow" d="M5 45h25"/>
      <path class="worker-boots" d="M11 31l-2 12h7l2-11m4-1 3 12h6"/>
      <path class="worker-suit" d="M10 18h13l3 16H9z"/>
      <path class="worker-vest" d="M10 19h5l3 13 2-13h4l2 15H9z"/>
      <path class="worker-reflector" d="M10 28h14m-10-8 3 11m5-11-3 11"/>
      <circle class="worker-skin" cx="17" cy="12" r="6"/>
      <path class="worker-helmet" d="M10 11a7 7 0 0 1 14 0H9m8-8v7"/>
      <path class="worker-mask" d="M16 10h9v9h-9z"/><path class="worker-visor" d="M18 12h5v3h-5z"/>
      <g class="worker-tool-arm"><path class="worker-sleeve" d="M21 21l5 5 6-2"/><path class="worker-glove" d="M29 24h4"/><path class="worker-torch" d="M32 22v8"/><path class="worker-weld" d="M31 31l-3 3m5-2 2 4m-4-7-3-1"/></g>
    </svg>`,
    `<svg viewBox="0 0 36 48" aria-hidden="true" focusable="false">
      <path class="worker-shadow" d="M4 45h28"/>
      <path class="worker-boots" d="M12 31l-2 12h7l2-10m3-2 2 12h6"/>
      <path class="worker-suit" d="M10 19h13l3 15H9z"/>
      <path class="worker-vest worker-vest-light" d="M10 19h5l3 12 2-12h4l2 15H9z"/>
      <path class="worker-reflector" d="M10 27h15m-10-7 3 12m4-12-3 12"/>
      <circle class="worker-skin" cx="17" cy="12" r="6"/>
      <path class="worker-helmet worker-helmet-light" d="M10 11a7 7 0 0 1 14 0H9m8-8v7"/>
      <path class="worker-face" d="M20 14h1m-7 4h6"/>
      <g class="worker-roller-arm"><path class="worker-sleeve" d="M22 21l6-3 2-6"/><path class="worker-glove" d="M29 13l1-3"/><path class="worker-roller" d="M30 10V6h-6"/><rect class="worker-roller-head" x="20" y="3" width="12" height="5" rx="1"/></g>
    </svg>`
  ];
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
      const duration = 3700;
      const reveal = [
        {clipPath:'inset(100% 0 0 0)', opacity:0, transform:'translateY(4px)'},
        {clipPath:'inset(70% 0 0 0)', opacity:1, transform:'translateY(0)', offset:.3},
        {clipPath:'inset(35% 0 0 0)', opacity:1, transform:'translateY(0)', offset:.65},
        {clipPath:'inset(0% 0 0 0)', opacity:1, transform:'translateY(0)'}
      ];
      const addMaterial = (material, delay, time) => {
        const layer = job.copy.cloneNode(true);
        layer.className = `text-build-material text-build-${material}`;
        stage.append(layer);
        animate(job,layer,reveal,{duration:time,delay,easing:'ease-in-out'});
      };
      // Each material is completed and briefly held before the next is applied.
      addMaterial('rebar',100,850);
      addMaterial('concrete',1250,900);
      addMaterial('paint',2450,950);
      let completion;
      workers.forEach((model,workerIndex) => {
        const crew = document.createElement('span');
        crew.className = `text-build-crew text-build-worker-${workerIndex+1}`;
        crew.innerHTML = model;
        const interval = workerIndex === 0 ? 400 : 300;
        crew.dataset.interval = String(interval);
        stage.append(crew);
        const positions = [];
        const fractions = workerIndex === 0 ? [.08,.2,.32] : [.68,.82,.94];
        // Hold each position, then reappear elsewhere. No fast running between points.
        for (let time=0,step=0; time<duration; time+=interval,step++) {
          const line = lines[(step+workerIndex)%lines.length];
          const x = Math.max(0,Math.min(origin.width-36,line.left+(line.right-line.left)*fractions[step%fractions.length]-18));
          positions.push({transform:`translate(${x}px,${line.bottom-42}px)`,offset:time/duration,easing:'steps(1,end)'});
        }
        positions.push({...positions.at(-1),offset:1});
        animate(job,crew,positions,{duration,easing:'linear'});
        const visibility = animate(job,crew,[
          {opacity:0,offset:0},{opacity:1,offset:.06},
          {opacity:1,offset:.94},{opacity:0,offset:1}
        ],{duration,easing:'ease-in-out'});
        if (workerIndex === 0) completion = visibility;
      });
      // A few local plumes at material changes, rather than dust on every letter.
      for (const phase of [420,1510]) {
        lines.forEach((line,row) => {
          const dust = document.createElement('span');
          dust.className = 'text-build-impact';
          dust.style.left = `${Math.max(0,Math.min(origin.width-72,line.left+(line.right-line.left)*.65-36))}px`;
          dust.style.top = `${line.bottom-32}px`;
          dust.innerHTML = cloud;
          stage.append(dust);
          animate(job,dust,[
            {opacity:0,transform:'translateY(3px) scale(.4)'},
            {opacity:.45,transform:'translateY(-2px) scale(.9)',offset:.25},
            {opacity:0,transform:'translateY(-14px) scale(1.4)'}
          ],{duration:850,delay:phase+row*110,easing:'ease-out'});
        });
      }
      // A broad, faint wet edge accompanies the final coat of paint.
      const edge = document.createElement('span');
      edge.className = 'text-build-paint-edge';
      edge.style.width = `${Math.max(...lines.map(line=>line.right))}px`;
      stage.append(edge);
      animate(job,edge,[
        {transform:`translateY(${origin.height}px)`,opacity:0},
        {transform:`translateY(${origin.height*.8}px)`,opacity:.12,offset:.2},
        {transform:'translateY(0)',opacity:0}
      ],{duration:950,delay:2450,easing:'ease-in-out'});
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
