// A deterministic construction timeline: every frame is derived from the slider.
// No video, network requests or external rendering libraries are required.
(() => {
  'use strict';
  const root = document.querySelector('#construction');
  const canvas = document.querySelector('#construction-canvas');
  const ctx = canvas?.getContext('2d');
  if (!root || !ctx) return;

  const scene = root.querySelector('.construction-scene');
  const controls = root.querySelector('.construction-controls');
  const slider = document.querySelector('#build-time');
  const play = document.querySelector('#build-play');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 7000;
  const width = 13;
  const depth = 7;
  const floors = 5;
  const floorHeight = 1.55;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  let progress = motion.matches ? 1 : 0;
  let playing = !motion.matches;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let lastPaint = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;

  // Parallel projection keeps the building stable while its layers are added.
  const project = (x, y, z = 0) => [500 + (x - y) * 21.5, 220 + (x + y) * 10.75 - z * 23.8];

  function polygon(points, fill, stroke, lineWidth = .8) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = project(...point);
      if (index) ctx.lineTo(...p); else ctx.moveTo(...p);
    });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  }

  function line(points, color, lineWidth = 1) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const p = project(...point);
      if (index) ctx.lineTo(...p); else ctx.moveTo(...p);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function box(x, y, z, w, d, h, colors = ['#e6e5d9', '#bfc3b5', '#a8b2a4']) {
    polygon([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]], colors[1], '#69756740');
    polygon([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]], colors[2], '#69756740');
    polygon([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]], colors[0], '#69756740');
  }

  function ground() {
    ctx.fillStyle = '#e9eae2';
    ctx.fillRect(0, 0, 1100, 560);
    // Survey grid and the boundary are part of the site plan, not decoration.
    for (let n = -22; n <= 30; n += 2) {
      line([[n,-20,-.12],[n,28,-.12]], '#75837012', .65);
      line([[-22,n,-.12],[30,n,-.12]], '#75837012', .65);
    }
    polygon([[-3,-3,-.1],[16,-3,-.1],[16,10,-.1],[-3,10,-.1]], '#dce0d3', '#a8b39f', .7);
    polygon([[16,-3,-.1],[17,-3,-.1],[17,10,-.1],[16,10,-.1]], '#ced4c6');
    polygon([[-3,10,-.1],[17,10,-.1],[17,11,-.1],[-3,11,-.1]], '#ced4c6');
    ctx.setLineDash([5, 5]);
    line([[-1,-1,0],[14,-1,0],[14,8,0],[-1,8,0],[-1,-1,0]], '#87927e', .8);
    ctx.setLineDash([]);
    // Four survey stakes remain until the site is landscaped.
    const alpha = 1 - smooth((progress - .88) / .12);
    ctx.save(); ctx.globalAlpha = alpha;
    [[-1,-1],[14,-1],[14,8],[-1,8]].forEach(([x,y]) => {
      line([[x,y,0],[x,y,.4]], '#aa4326', 1.7);
      line([[x-.12,y,.4],[x+.12,y,.4]], '#aa4326', 1.7);
    });
    ctx.restore();
  }

  function foundation() {
    const excavation = smooth((progress - .035) / .12);
    if (!excavation) {
      ctx.setLineDash([3, 4]);
      polygon([[0,0,0],[width,0,0],[width,depth,0],[0,depth,0]], null, '#8c9782', 1);
      ctx.setLineDash([]);
      return;
    }
    const pitWidth = (width + 1.4) * excavation;
    polygon([[-.7,-.7,0],[pitWidth-.7,-.7,0],[pitWidth-.7,depth+.7,0],[-.7,depth+.7,0]], '#a89a80', '#8c846c', 1);
    polygon([[-.35,-.35,-.5],[pitWidth-1.05,-.35,-.5],[pitWidth-1.05,depth+.35,-.5],[-.35,depth+.35,-.5]], '#8a806b');
    const poured = smooth((progress - .145) / .12);
    if (poured) {
      box(0, 0, -.4, width * poured, depth, .45, ['#cbd0c1','#aeb5a3','#929e8c']);
      if (poured > .85) {
        for (let x = .5; x < width; x += .65) line([[x,.2,.055],[x,depth-.2,.055]], '#77836a55', .5);
        for (let y = .5; y < depth; y += .65) line([[.2,y,.055],[width-.2,y,.055]], '#77836a55', .5);
      }
    }
  }

  function frameStructure() {
    const built = clamp((progress - .255) / .43) * floors;
    if (!built) return;
    // A quiet ground shadow gives depth without a heavy blur or glow.
    ctx.save(); ctx.globalAlpha = .065 * clamp(built);
    polygon([[1,1,0],[width+3,1,0],[width+5,depth+4,0],[2,depth+4,0]], '#253c2d');
    ctx.restore();
    for (let level = 0; level < floors; level++) {
      const fraction = smooth(built - level);
      if (!fraction) continue;
      const z = level * floorHeight + .1;
      for (const y of [0, depth / 2, depth - .2]) {
        for (let x = 0; x <= width - .1; x += 3.2) {
          box(x, y, z, .2, .2, (floorHeight - .1) * fraction);
        }
      }
      const slab = smooth((fraction - .72) / .28);
      if (slab) box(0, 0, (level + 1) * floorHeight, width * slab, depth, .17);
    }
    return built;
  }

  function facades() {
    const enclosed = clamp((progress - .69) / .235) * floors;
    if (!enclosed) return;
    for (let level = 0; level < floors; level++) {
      const coverage = smooth(enclosed - level);
      if (!coverage) continue;
      const bottom = level * floorHeight + .24;
      const top = bottom + (floorHeight - .32) * coverage;
      // Individual glass bays preserve the legibility of the structural grid.
      for (let bay = 0; bay < 8; bay++) {
        const x = .22 + bay * (width - .4) / 8;
        const end = x + (width - .4) / 8 - .055;
        const fill = ['#849b92','#758e84','#91a59a','#7d968c'][bay % 4];
        polygon([[x,depth+.02,bottom],[end,depth+.02,bottom],[end,depth+.02,top],[x,depth+.02,top]], fill, '#d9dfcf', .65);
        const highlight = (end - x) * .22;
        polygon([[x,depth+.025,bottom],[x+highlight,depth+.025,bottom],[end,depth+.025,top],[end-highlight,depth+.025,top]], '#e1e4cb32');
        line([[x,depth+.04,bottom+(top-bottom)*.48],[end,depth+.04,bottom+(top-bottom)*.48]], '#d9dfcf', .6);
      }
      for (let bay = 0; bay < 4; bay++) {
        const y = .2 + bay * (depth - .4) / 4;
        const end = y + (depth - .4) / 4 - .055;
        polygon([[width+.02,y,bottom],[width+.02,end,bottom],[width+.02,end,top],[width+.02,y,top]], bay % 2 ? '#536f66' : '#607d72', '#c9d3bf', .65);
        line([[width+.04,y,bottom+(top-bottom)*.48],[width+.04,end,bottom+(top-bottom)*.48]], '#c9d3bf', .6);
      }
    }
    const finish = smooth((progress - .91) / .07);
    if (finish) {
      ctx.save(); ctx.globalAlpha = finish;
      // A recessed roof pavilion and the entrance canopy finish the silhouette.
      box(2, 1.2, floors * floorHeight + .17, 5, 3.5, .55, ['#d4d8ca','#9ca995','#899985']);
      box(2.2, 1.4, floors * floorHeight + .72, 4.6, 3.1, .1);
      box(4.7, depth, 1.45, 4, 1.05, .14, ['#b4a181','#918669','#7b785f']);
      for (const x of [4.9,8.4]) box(x,depth+.75,.1,.12,.12,1.4);
      polygon([[5.9,depth+.04,.15],[7.4,depth+.04,.15],[7.4,depth+.04,1.48],[5.9,depth+.04,1.48]], '#344e46', '#c9d3bf', 1);
      ctx.restore();
    }
  }

  function tree(x, y, size = 1) {
    const p = project(x, y, 0);
    const top = project(x, y, 1.7 * size);
    ctx.fillStyle = '#43553e14';
    ctx.beginPath(); ctx.ellipse(p[0]+12*size,p[1]+5,20*size,7*size,.3,0,Math.PI*2); ctx.fill();
    line([[x,y,0],[x,y,1.6*size]], '#777660', 2.5 * size);
    ctx.fillStyle = '#687b59';
    ctx.beginPath(); ctx.ellipse(top[0],top[1],16*size,22*size,-.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#7d8d68';
    ctx.beginPath(); ctx.ellipse(top[0]-5*size,top[1]-5*size,12*size,17*size,-.25,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#94a17a';
    ctx.beginPath(); ctx.ellipse(top[0]-7*size,top[1]-10*size,7*size,10*size,-.25,0,Math.PI*2); ctx.fill();
  }

  function landscape(front) {
    const amount = smooth((progress - .905) / .095);
    if (!amount) return;
    ctx.save(); ctx.globalAlpha = amount;
    if (!front) {
      polygon([[-2.5,-2.5,.03],[15.5,-2.5,.03],[15.5,9.5,.03],[-2.5,9.5,.03]], '#c5d0b5');
      polygon([[-.7,-.7,.045],[width+.7,-.7,.045],[width+.7,depth+.7,.045],[-.7,depth+.7,.045]], '#d8dbcf');
      [[-1.7,-1.7,.95],[4,-1.7,.8],[10,-1.7,1.05]].forEach(args => tree(...args));
    } else {
      polygon([[4.1,depth+.8,.06],[9.2,depth+.8,.06],[9.2,10.8,.06],[4.1,10.8,.06]], '#e0dfd1');
      for (let y = 8; y < 10.8; y += .6) line([[4.1,y,.07],[9.2,y,.07]], '#bcc3b1', .7);
      [[-1.8,7.8,1],[12,9.1,.9],[15,6.5,1.05]].forEach(args => tree(...args));
      box(.5,8.2,.07,2.4,.65,.3,['#a8b698','#879b79','#758b68']);
      box(10,8.2,.07,1.5,.65,.3,['#a8b698','#879b79','#758b68']);
    }
    ctx.restore();
  }

  function crane() {
    const presence = smooth((progress - .16) / .08) * (1 - smooth((progress - .865) / .1));
    if (!presence) return;
    ctx.save(); ctx.globalAlpha = presence;
    const color = '#a55233';
    box(15.6,1.7,.02,.9,.9,.25,['#b0b7a4','#919d89','#7e8e75']);
    // Tower and jib trusses use the same world coordinates as the building.
    for (let z = .3; z < 9.9; z += .75) {
      line([[16,2,z],[16.4,2,z+.75],[16,2,z+.75],[16.4,2,z],[16,2,z]],color,1.1);
    }
    line([[16,2,.3],[16,2,10.8],[16.4,2,10.8],[16.4,2,.3]],color,1.5);
    for (let x = 3.5; x < 21; x += 1) {
      line([[x,2,10.1],[x+1,2,10.55],[x,2,10.55],[x+1,2,10.1]],color,1.05);
    }
    line([[3.5,2,10.1],[21.5,2,10.1],[21.5,2,10.55],[3.5,2,10.55],[3.5,2,10.1]],color,1.5);
    line([[5,2,10.55],[16.2,2,11.7],[21,2,10.55]],'#797c68',.8);
    box(18.8,1.65,9.9,1.7,.8,.65,['#a6ad99','#87947f','#71846d']);
    box(15.3,1.6,9.65,.8,.8,.7,['#d9c6a2','#aa8664','#876d50']);
    const trolley = 5.5 + 6 * (.5 + .5 * Math.sin(progress * 17));
    const hook = 3.8 + 3 * smooth((progress - .25) / .5);
    line([[trolley,2,10.1],[trolley,2,hook]],'#686f5e',.9);
    line([[trolley-.12,2,hook+.2],[trolley,2,hook],[trolley+.14,2,hook+.12]],'#686f5e',1.7);
    if (progress < .69) box(trolley-.45,1.65,hook-.23,.9,.7,.13,['#c2c7b7','#9fa994','#85967d']);
    ctx.restore();
  }

  function draw() {
    if (!viewportWidth || !viewportHeight) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = '#e9eae2';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    const mobile = viewportWidth <= 700;
    const zoom = mobile ? 1.85 : .82;
    const scale = Math.min(viewportWidth / 1100, viewportHeight / 520) * zoom;
    ctx.translate(viewportWidth * (mobile ? .52 : .7), viewportHeight * (mobile ? .64 : .52));
    ctx.scale(scale, scale);
    ctx.translate(-565, -260);
    ground();
    landscape(false);
    foundation();
    frameStructure();
    facades();
    landscape(true);
    crane();
  }

  function update() {
    slider.value = String(Math.round(progress * 1000));
    const percent = Math.round(progress * 100);
    slider.style.setProperty('--progress', `${progress * 100}%`);
    slider.setAttribute('aria-valuetext', `${percent}%`);
    draw();
  }

  function schedule() {
    if (!frame && playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    lastPaint = 0;
  }

  function setPlaying(value) {
    playing = value;
    play.setAttribute('aria-label', value ? 'Выключить анимацию' : 'Включить анимацию');
    play.setAttribute('aria-pressed', String(value));
    if (value) schedule(); else stopFrame();
  }

  function tick(now) {
    frame = 0;
    if (!playing || !visible || document.hidden) { lastTime = 0; return; }
    if (lastTime) progress = Math.min(1, progress + Math.min(now - lastTime, 100) / duration);
    lastTime = now;
    // Render at most 30 frames/second; the timeline itself stays time-based.
    if (now - lastPaint >= 1000 / 30 || progress >= 1) { update(); lastPaint = now; }
    if (progress >= 1) { setPlaying(false); return; }
    schedule();
  }

  function seek(value) {
    setPlaying(false);
    progress = clamp(value / 1000);
    update();
    setPlaying(false); // Refresh the play label when seeking to the last frame.
  }

  slider.addEventListener('input', () => seek(Number(slider.value)));
  slider.addEventListener('pointerdown', () => setPlaying(false));
  play.addEventListener('click', () => {
    if (!playing && progress >= 1) { progress = 0; update(); }
    setPlaying(!playing);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFrame(); else schedule();
  });
  motion.addEventListener('change', event => { if (event.matches) setPlaying(false); });

  const resize = new ResizeObserver(entries => {
    const rect = entries[0].contentRect;
    viewportWidth = rect.width;
    viewportHeight = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewportWidth * dpr);
    canvas.height = Math.round(viewportHeight * dpr);
    draw();
  });
  resize.observe(scene);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) schedule(); else stopFrame();
  }, { threshold: .12 });
  observer.observe(scene);
  controls.hidden = false;
  root.classList.add('is-ready');
  update();
  setPlaying(playing);
})();
