/* Decorative text construction; the original text remains accessible. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  const active = new Set();
  const worker = `<svg viewBox="0 0 32 34" aria-hidden="true"><path class="builder-arm" d="M16 16l8-5 4 3M24 11l-2-5m-3 0h7"/><path d="M12 23l-3 8m9-8 4 8"/><path class="builder-vest" d="M10 13h9l3 11H8z"/><circle class="builder-face" cx="15" cy="9" r="4"/><path class="builder-hat" d="M9 8a6 6 0 0 1 12 0m-14 1h16"/></svg>`;
  let frame = 0;
  function finish(item) {
    item.copy.style.clipPath = '';
    item.el.classList.remove('text-building');
    item.crew.remove();
    active.delete(item);
  }
  function tick(now) {
    active.forEach(item => {
      const progress = Math.min(1, (now - item.start) / item.duration);
      if (progress >= 1 || motion.matches || !item.el.getClientRects().length) return finish(item);
      const total = progress * item.lines.length;
      const index = Math.min(item.lines.length - 1, Math.floor(total));
      const line = item.lines[index];
      const x = line.left + (line.right - line.left) * (total - index);
      const y = line.bottom;
      item.copy.style.clipPath = `polygon(0 0,100% 0,100% ${line.top}px,${x}px ${line.top}px,${x}px ${y}px,0 ${y}px)`;
      item.crew.style.transform = `translate(${Math.max(0, x - 15)}px,${y - 28}px)`;
    });
    frame = active.size ? requestAnimationFrame(tick) : 0;
  }
  function build(el) {
    if (motion.matches || el.dataset.built) return;
    const bounds = el.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    el.dataset.built = 'true';
    const copy = document.createElement('span');
    copy.className = 'text-build-copy';
    while (el.firstChild) copy.append(el.firstChild);
    el.append(copy);
    const origin = copy.getBoundingClientRect();
    const lines = [];
    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        let line = lines.find(row => Math.abs(row.top - (rect.top - origin.top)) < 4);
        if (!line) { line = {top: rect.top - origin.top, bottom: rect.bottom - origin.top, left: rect.left - origin.left, right: rect.right - origin.left}; lines.push(line); }
        else { line.left = Math.min(line.left, rect.left - origin.left); line.right = Math.max(line.right, rect.right - origin.left); line.bottom = Math.max(line.bottom, rect.bottom - origin.top); }
      }
    }
    if (!lines.length) return;
    lines.sort((a, b) => a.top - b.top);
    const crew = document.createElement('span');
    crew.className = 'text-build-crew';
    crew.setAttribute('aria-hidden', 'true');
    crew.innerHTML = worker;
    el.append(crew);
    el.classList.add('text-building');
    active.add({el, copy, crew, lines, start: performance.now(), duration: Math.min(2300, 800 + lines.length * 250)});
    if (!frame) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !document.documentElement.classList.contains('is-loading')) {
        build(entry.target);
        if (entry.target.dataset.built) observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});
  const targets = document.querySelectorAll(':is(#about,#services,#projects,#process) :is(h2,h3,p:not([role="status"]),.project-title,.project-tag,.section-label > span)');
  function observe() { targets.forEach(el => observer.observe(el)); }
  if (document.documentElement.classList.contains('is-loading')) document.addEventListener('site:ready', observe, {once: true});
  else observe();
  // Opening a service exposes text that was not measurable on the first pass.
  document.querySelectorAll('#services details').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) details.querySelectorAll('p').forEach(el => observer.observe(el));
  }));
  window.addEventListener('resize', () => active.forEach(finish), {passive: true});
  motion.addEventListener('change', () => { if (motion.matches) active.forEach(finish); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) active.forEach(finish); });
  document.addEventListener('focusin', event => active.forEach(item => { if (item.el.contains(event.target)) finish(item); }));
})();
