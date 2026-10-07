(() => {
  const hero = document.querySelector('.hero');
  const scene = hero.querySelector('.hero-bg');
  const content = hero.querySelector('.hero-content');
  const light = hero.querySelector('.hero-light');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const letters = [];
  hero.querySelectorAll('.hero-title-line').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.className = 'hero-letter';
      span.textContent = char;
      line.append(span);
      letters.push(span);
    });
  });
  let frame = 0, tx = 0, ty = 0, x = 0, y = 0, glow = 0, targetGlow = 0;
  let gx = innerWidth / 2, gy = innerHeight / 2, px = gx, py = gy;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  function request() { if (!frame) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    const travel = clamp(-rect.top, 0, rect.height);
    const progress = travel / rect.height;
    if (reduced.matches) {
      content.style.transform = 'translateY(-50%)';
      content.style.opacity = '1';
      content.style.filter = 'none';
      scene.style.transform = 'none';
      light.style.opacity = '0';
      letters.forEach(letter => { letter.style.cssText = ''; });
      return;
    }
    x += (tx - x) * .065; y += (ty - y) * .065;
    gx += (px - gx) * .09; gy += (py - gy) * .09;
    glow += (targetGlow - glow) * .065;
    // The image and lettering have separate depths, with gently eased pointer input.
    scene.style.transform = `translate3d(${x * 13}px,${y * 9 + travel * .18}px,0) rotateX(${-y * 3.2}deg) rotateY(${x * 4.2}deg) scale(${1 - progress * .055})`;
    content.style.transform = `translate3d(${-x * 5}px,calc(-50% + ${travel * 1.08}px),0)`;
    content.style.opacity = String(1 - clamp((progress - .04) / .6, 0, 1));
    content.style.filter = `blur(${Math.pow(progress, 2) * 9}px)`;
    content.style.pointerEvents = progress > .65 ? 'none' : '';
    letters.forEach((letter, i) => {
      const fade = clamp((progress - .08 - i * .009) / .46, 0, 1);
      letter.style.opacity = String(1 - fade);
      letter.style.transform = `translate3d(${Math.sin(i * 2.1) * fade * 9}px,${fade * fade * (18 + i * 3)}px,0)`;
      letter.style.filter = `blur(${fade * fade * 7}px)`;
    });
    light.style.transform = `translate3d(${gx - 160}px,${gy - 160}px,0)`;
    light.style.opacity = String(glow * (1 - progress));
    if (rect.bottom > 0 && !document.hidden &&
        (Math.abs(tx-x) + Math.abs(ty-y) > .002 || Math.abs(px-gx) + Math.abs(py-gy) > .2 || Math.abs(targetGlow-glow) > .002)) request();
  }
  hero.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    px = event.clientX - rect.left; py = event.clientY - rect.top;
    tx = clamp(px / rect.width * 2 - 1, -1, 1);
    ty = clamp(py / rect.height * 2 - 1, -1, 1);
    targetGlow = .72; request();
  }, {passive:true});
  hero.addEventListener('pointerleave', () => { tx = ty = targetGlow = 0; request(); });
  addEventListener('scroll', request, {passive:true});
  addEventListener('resize', request, {passive:true});
  document.addEventListener('visibilitychange', request);
  reduced.addEventListener('change', request);
  request();
})();
