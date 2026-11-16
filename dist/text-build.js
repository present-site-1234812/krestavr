/* Build the four section headings. Never leave content dependent on animation. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = document.querySelectorAll('#about-title,#services-title,#projects-title,#process-title');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const active = new Set();
  const worker = `<svg viewBox="0 0 80 48" aria-hidden="true" focusable="false">
    <path class="builder-scaffold" d="M4 43h67M9 43v5m52-5v5"/>
    <g class="builder-helper" transform="translate(4 17) scale(.72)"><path d="M12 23l-3 8m9-8 4 8M10 16l-5 5h17"/><path class="builder-vest" d="M10 13h9l3 11H8z"/><circle class="builder-face" cx="15" cy="9" r="4"/><path class="builder-hat" d="M9 8a6 6 0 0 1 12 0m-14 1h16"/><path class="builder-brick" d="M0 17h10v5H0z"/></g>
    <g transform="translate(30 8)"><path d="M12 23l-3 8m9-8 4 8"/><path class="builder-vest" d="M10 13h9l3 11H8z"/><circle class="builder-face" cx="15" cy="9" r="4"/><path class="builder-hat" d="M9 8a6 6 0 0 1 12 0m-14 1h16"/><path class="builder-arm" d="M16 16l8-5 4 3M24 11l-2-5m-3 0h7"/></g>
    <g class="builder-sparks"><path d="M59 19l5-3m-4 8 8 1m-9 3 4 5"/><circle cx="67" cy="19" r="1"/></g>
    <g class="builder-dust"><circle cx="57" cy="36" r="2"/><circle cx="63" cy="39" r="3"/><circle cx="69" cy="36" r="1.5"/></g>
    <g class="builder-chips"><path d="M61 29h3v3h-3zM68 31h2v2h-2z"/></g>
  </svg>`;

  function finish(item) {
    clearTimeout(item.timer);
    item.animations.forEach(animation => animation.cancel());
    // Restore the exact text/BR nodes, rather than retaining animation wrappers.
    item.copy.replaceWith(...item.copy.childNodes);
    item.crew.remove();
    item.el.classList.remove('text-building');
    active.delete(item);
  }
  function build(el) {
    if (motion.matches || el.dataset.built || document.hidden) return;
    const bounds = el.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    el.dataset.built = 'true';
    const copy = document.createElement('span');
    copy.className = 'text-build-copy';
    while (el.firstChild) copy.append(el.firstChild);
    el.append(copy);
    const crew = document.createElement('span');
    crew.className = 'text-build-crew';
    crew.setAttribute('aria-hidden', 'true');
    crew.innerHTML = worker;
    el.append(crew);
    el.classList.add('text-building');
    const item = {el, copy, crew, animations: [], timer: 0};
    active.add(item);
    try {
      const origin = copy.getBoundingClientRect();
      const lines = [];
      const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
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
      if (!lines.length) return finish(item);
      lines.sort((a, b) => a.top - b.top);
      const clips = [], positions = [];
      const polygon = (line, x) => `polygon(0 0,100% 0,100% ${line.top}px,${x}px ${line.top}px,${x}px ${line.bottom}px,0 ${line.bottom}px)`;
      lines.forEach((line, index) => {
        const start = index / lines.length;
        const end = (index + 1) / lines.length - (index === lines.length - 1 ? 0 : .001);
        clips.push({clipPath: polygon(line, line.left), offset: start}, {clipPath: polygon(line, line.right), offset: end});
        positions.push({transform: `translate(${line.left - 57}px,${line.bottom - 40}px)`, opacity: index === 0 ? 0 : 1, offset: start}, {transform: `translate(${line.right - 57}px,${line.bottom - 40}px)`, opacity: index === lines.length - 1 ? 0 : 1, offset: end});
      });
      // Fade in quickly; keep the workers visible until the last few letters.
      positions.splice(1, 0, {...positions[0], opacity: 1, offset: .025});
      const last = positions[positions.length - 1];
      positions.splice(positions.length - 1, 0, {...last, opacity: 1, offset: .96});
      const duration = 1250 + lines.length * 400;
      // Set the fallback BEFORE starting anything that could fail or be interrupted.
      item.timer = setTimeout(() => finish(item), duration + 350);
      const options = {duration, easing: 'linear', fill: 'both'};
      item.animations.push(copy.animate(clips, options), crew.animate(positions, options));
      item.animations[0].finished.then(() => { if (active.has(item)) finish(item); }, () => { if (active.has(item)) finish(item); });
    } catch {
      finish(item);
    }
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      build(entry.target);
      if (entry.target.dataset.built) observer.unobserve(entry.target);
    }
  }), {threshold: .3});
  function observe() { targets.forEach(el => observer.observe(el)); }
  if (document.documentElement.classList.contains('is-loading')) document.addEventListener('site:ready', observe, {once: true});
  else observe();
  window.addEventListener('resize', () => active.forEach(finish), {passive: true});
  window.addEventListener('pagehide', () => active.forEach(finish));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) active.forEach(finish);
    else observe();
  });
  motion.addEventListener('change', () => { if (motion.matches) active.forEach(finish); });
})();
