/* BeamWordmarkFooter: native lifecycle adapter for this buildless portfolio.
   The supplied component's math, timing, offsets, and CSS variable painting
   are retained; React hooks become observers and one scoped animation loop. */
(() => {
  'use strict';

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const fitSize = (measuredAt100, target, cap) => {
    if (!(measuredAt100 > 0) || !(target > 0)) return 0;
    const size = (100 * target) / measuredAt100;
    return cap > 0 ? Math.min(size, cap) : size;
  };
  const beamTarget = (u, lo = 30, hi = 82) => lo + (hi - lo) * clamp(Number.isFinite(u) ? u : 0.5, 0, 1);
  const drift = (t, centre = 58, amp = 9) => centre + amp * (0.7 * Math.sin(t * 0.21) + 0.3 * Math.sin(t * 0.077 + 1.3));
  const approach = (from, to, k, dt) => to + (from - to) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60);
  const baselineAt = (ascent, descent) => {
    if (!(ascent > 0) || !(descent >= 0)) return 0.8;
    return clamp(((100 - ascent - descent) / 2 + ascent) / 100, 0.5, 1.2);
  };
  const wordHeight = (fontSize, baseline, cut) => Math.max(0, fontSize * (baseline + clamp(Number.isFinite(cut) ? cut : 0, -0.4, 0.4)));
  const measureBaseline = (family, weight, text) => {
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return 0.8;
      ctx.font = weight + ' 100px ' + family;
      const m = ctx.measureText(text);
      return baselineAt(m.fontBoundingBoxAscent, m.fontBoundingBoxDescent);
    } catch { return 0.8; }
  };

  const root = document.querySelector('#contact.bwf');
  const box = root?.querySelector('.bwf-word');
  const inner = root?.querySelector('.bwf-word-in');
  if (!root || !box || !inner) return;
  const word = 'Simon', wordWeight = 500, cut = 0.14;
  const ptr = { u: 0.5, x: 0, y: 0, inside: false };
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  let alive = true, visible = false, seen = false, reduced = mq.matches;
  let fitFrame = 0, raf = 0;
  root.dataset.in = reduced ? 'true' : 'false';

  const place = () => {
    const r = root.getBoundingClientRect();
    root.style.setProperty('--bwf-rw', r.width + 'px');
    root.style.setProperty('--bwf-rh', r.height + 'px');
    let top = 0;
    inner.querySelectorAll('.bwf-l').forEach((s, i) => {
      // Offset chains deliberately ignore the letters' reveal/hover translate.
      let x = 0, y = 0, el = s;
      while (el && el !== root) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
      }
      s.style.setProperty('--bwf-x', x + 'px');
      s.style.setProperty('--bwf-y', y + 'px');
      if (i === 0) top = y;
    });
    root.style.setProperty('--bwf-top', top + 'px');
    root.style.setProperty('--bwf-bot', top + (parseFloat(inner.style.fontSize) || 0) * 0.92 + 'px');
  };
  const fit = () => {
    const wb = inner.parentElement ?? box;
    const pad = parseFloat(getComputedStyle(wb).paddingLeft) || 0;
    const target = wb.clientWidth - pad * 2;
    inner.style.fontSize = '100px';
    const measured = inner.offsetWidth;
    const base = measureBaseline(getComputedStyle(inner).fontFamily, wordWeight, word);
    const next = fitSize(measured, target, target * 0.42);
    inner.style.fontSize = next + 'px';
    box.style.height = wordHeight(next, base, cut) + 'px';
    place();
  };
  const schedule = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fit);
  };
  fit();
  const ro = new ResizeObserver(schedule);
  ro.observe(root);
  document.fonts?.ready.then(() => alive && schedule());

  const set = (b, px, py, g) => {
    root.style.setProperty('--bwf-b', b.toFixed(2) + '%');
    root.style.setProperty('--bwf-px', px.toFixed(1) + 'px');
    root.style.setProperty('--bwf-py', py.toFixed(1) + 'px');
    root.style.setProperty('--bwf-g', g.toFixed(3));
  };
  const syncMotion = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    root.dataset.running = 'false';
    if (reduced || !visible || document.hidden) {
      set(58, ptr.x, ptr.y, ptr.inside ? 1 : 0);
      return;
    }
    root.dataset.running = 'true';
    let last = performance.now(), t = last / 1000, b = 58;
    let px = ptr.x, py = ptr.y, g = 0;
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      t += dt;
      const p = ptr;
      const idle = drift(t);
      const target = p.inside ? beamTarget(p.u) * 0.75 + idle * 0.25 : idle;
      b = approach(b, target, 0.035, dt);
      px = approach(px, p.x, 0.16, dt);
      py = approach(py, p.y, 0.16, dt);
      g = approach(g, p.inside ? 1 : 0, 0.06, dt);
      set(b, px, py, g);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  // Beam visibility follows the whole Contact region. The word observes its
  // own first entry, so the longer mobile contact layout cannot hide its rise.
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.target === root && visible !== e.isIntersecting) {
        visible = e.isIntersecting;
        syncMotion();
      }
      if (e.target === box && e.isIntersecting && !seen) {
        seen = true;
        root.dataset.in = 'true';
        io.unobserve(box);
      }
    });
  }, { threshold: 0.12 });
  io.observe(root);
  io.observe(box);

  const onMq = () => {
    reduced = mq.matches;
    root.dataset.in = seen || reduced ? 'true' : 'false';
    syncMotion();
  };
  mq.addEventListener('change', onMq);
  const onPointer = e => {
    const r = e.currentTarget.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.u = r.width ? ptr.x / r.width : 0.5;
    ptr.inside = e.type !== 'pointerleave';
    // Reduced motion keeps the original immediate, event-driven pointer glow.
    if (reduced || !visible) set(58, ptr.x, ptr.y, ptr.inside ? 1 : 0);
  };
  ['pointermove', 'pointerenter', 'pointerleave'].forEach(type => root.addEventListener(type, onPointer, { signal: events.signal }));
  inner.querySelectorAll('.bwf-l').forEach(el => {
    el.addEventListener('click', () => {
      if (reduced) return;
      el.classList.remove('is-hop');
      void el.offsetWidth;
      el.classList.add('is-hop');
    }, { signal: events.signal });
    el.addEventListener('animationend', () => el.classList.remove('is-hop'), { signal: events.signal });
  });
  document.addEventListener('visibilitychange', syncMotion, { signal: events.signal });
  window.addEventListener('pageshow', syncMotion, { signal: events.signal });
  window.addEventListener('pagehide', e => {
    cancelAnimationFrame(raf);
    if (e.persisted) return;
    alive = false;
    cancelAnimationFrame(fitFrame);
    io.disconnect();
    ro.disconnect();
    mq.removeEventListener('change', onMq);
    events.abort();
  }, { signal: events.signal });
  syncMotion();
})();
