(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const stage = hero.querySelector('.hero-stage');
  const panel = hero.querySelector('.hero-panel');
  const border = hero.querySelector('.hero-border');
  const photo = hero.querySelector('.hero-photo');
  const lightPlane = hero.querySelector('.hero-light-plane');
  const videoPlane = hero.querySelector('.hero-bg');
  const atmosphere = hero.querySelector('.hero-atmosphere');
  const cursorLight = hero.querySelector('.hero-light');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 721px) and (hover: hover) and (pointer: fine)');

  // All motion parameters live here. The original page routes remain native anchors.
  const config = { revealMs: 660, staggerMs: 140, tiltDeg: 3.6,
    photoPx: 18, photoY: 10, lightPx: 38, lightY: 22, interpolation: .075 };
  const clamp = (v, lo=0, hi=1) => Math.min(hi,Math.max(lo,v));
  const smooth = v => { v=clamp(v); return v*v*(3-2*v); };
  const segment = (p,a,b) => smooth((p-a)/(b-a));
  const pieces = [...panel.querySelectorAll('.hero-piece')];
  const offsets = [{start:.04,end:.64,scale:1.2}, {start:.1,end:.74,scale:1},
    ...Array.from({length:5},(_,i)=>({start:.16+i*.04,end:.75+i*.025,scale:1}))];
  let introTimeline, introDone=false, frame=0, active=true, geometry;
  let targetX=0,targetY=0,x=0,y=0,glow=0,targetGlow=0;
  let pointerX=0,pointerY=0,lightX=0,lightY=0,lastTime=0;
  const events = new AbortController();

  // 1. Intro delegates to one master timeline; pointer and scroll logic below stays unchanged.
  function finishIntro() {
    if (introDone) return;
    introDone=true; hero.classList.remove('hero-intro-running');
    introTimeline?.finish();
    document.documentElement.classList.remove('intro-pending','intro-running');
    clearTimeout(window.portfolioIntroWatchdog);
    hero.dataset.intro='complete'; request();
  }
  function animateOpening() {
    if (reduced.matches || scrollY>30 || (location.hash && location.hash!=='#home') || !Element.prototype.animate || !window.PortfolioIntro) { finishIntro(); return; }
    try {
      introTimeline=window.PortfolioIntro.create({hero,onComplete:finishIntro,revealMs:config.revealMs,staggerMs:config.staggerMs});
      introTimeline.play();
    } catch (_) { finishIntro(); }
  }

  // 2. Scroll composition: measure natural slots once, only transform on each scroll.
  function measure() {
    const w=stage.clientWidth,h=stage.clientHeight;
    const left=panel.offsetLeft-panel.offsetWidth/2;
    const top=panel.offsetTop-panel.offsetHeight/2;
    const margin=w*(desktop.matches ? .044 : .06);
    const mobile=w<=720;
    const titleY=Math.max(135,h-(mobile?355:330));
    const philosophyY=titleY+55;
    const navY=philosophyY+60;
    geometry={w,h,pin:Math.max(1,hero.offsetHeight-stage.offsetHeight),
      slots:pieces.map((node,i)=>({dx:margin+(i>=2?(i-2)*(mobile?3:8):0)-left-node.offsetLeft,
        dy:(i===0?titleY:i===1?philosophyY:navY+(i-2)*(mobile?29:31))-top-node.offsetTop}))};
    pointerX=lightX=w/2;pointerY=lightY=h/2;
    request();
  }
  function request() { if(active&&!frame&&!document.hidden)frame=requestAnimationFrame(render); }
  function render(now) {
    frame=0; if(!active||!geometry)return;
    const rect=hero.getBoundingClientRect();
    const visible=rect.bottom>0&&rect.top<innerHeight;
    const p=reduced.matches?0:clamp(-rect.top/geometry.pin);
    hero.dataset.scrollProgress=p.toFixed(3);
    if(p>.008&&!introDone)finishIntro();
    const dt=Math.min(40,lastTime?now-lastTime:16.67);lastTime=now;
    const alpha=1-Math.pow(1-config.interpolation,dt/16.67);
    const canTilt=desktop.matches&&!reduced.matches&&introDone&&visible&&!document.querySelector('.case-dialog')?.open;
    if(!canTilt)targetX=targetY=targetGlow=0;
    x+=(targetX-x)*alpha;y+=(targetY-y)*alpha;
    lightX+=(pointerX-lightX)*alpha;lightY+=(pointerY-lightY)*alpha;glow+=(targetGlow-glow)*alpha;
    const movement=(1-p*.85)*(canTilt?1:0);
    panel.style.transform=`translate(-50%,-50%) rotateX(${-y*config.tiltDeg*movement}deg) rotateY(${x*config.tiltDeg*movement}deg)`;
    border.style.opacity=String(.72*(1-segment(p,.02,.45)));
    pieces.forEach((node,i)=>{
      const o=offsets[i],t=segment(p,o.start,o.end),slot=geometry.slots[i];
      node.style.transform=`translate3d(${slot.dx*t}px,${slot.dy*t}px,0) scale(${1+(o.scale-1)*t})`;
    });
    photo.style.transform=`translate3d(${x*config.photoPx*movement}px,calc(-50% + ${y*config.photoY*movement-p*14}px),0) scale(${1+p*.035})`;
    lightPlane.style.transform=`translate3d(${x*config.lightPx*movement}px,calc(-50% + ${y*config.lightY*movement-p*20}px),0) scale(${1+p*.04})`;
    videoPlane.style.transform=`translate3d(${x*config.lightPx*movement}px,${y*config.lightY*movement}px,0) scale(${1+p*.035})`;
    cursorLight.style.transform=`translate3d(${lightX-140}px,${lightY-140}px,0)`;
    cursorLight.style.opacity=String(glow*.5*(1-p));
    atmosphere.style.animationPlayState=!introDone||hero.querySelector('video').paused?'paused':'running';
    const unsettled=Math.abs(targetX-x)+Math.abs(targetY-y)>.002 || Math.abs(pointerX-lightX)+Math.abs(pointerY-lightY)>.25 || Math.abs(targetGlow-glow)>.002;
    if(visible&&unsettled&&!reduced.matches)request();
  }

  // 3. Pointer depth: no touch/gyroscope effect, a brief interpolation loop only.
  function pointerMove(event) {
    if(!desktop.matches||reduced.matches||!introDone||event.pointerType==='touch')return;
    const rect=stage.getBoundingClientRect();
    pointerX=event.clientX-rect.left;pointerY=event.clientY-rect.top;
    targetX=clamp(pointerX/geometry.w*2-1,-1,1);targetY=clamp(pointerY/geometry.h*2-1,-1,1);
    targetGlow=.65;request();
  }
  function resetPointer(){targetX=targetY=targetGlow=0;request();}
  function motionPreference(){if(reduced.matches)finishIntro();hero.classList.toggle('has-story',!reduced.matches);resetPointer();measure();}
  function scroll(){request();}
  function resize(){measure();}
  function visibility(){lastTime=0;resetPointer();if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else request();}
  function cleanUp(event){if(event.persisted)return;active=false;events.abort();observer.disconnect();introTimeline?.dispose();cancelAnimationFrame(frame);}
  hero.classList.toggle('has-story',!reduced.matches);
  const options={passive:true,signal:events.signal};
  stage.addEventListener('pointermove',pointerMove,options);
  stage.addEventListener('pointerleave',resetPointer,options);
  addEventListener('scroll',scroll,options);addEventListener('resize',resize,options);
  addEventListener('pagehide',cleanUp,{signal:events.signal});addEventListener('pageshow',resize,{signal:events.signal});
  document.addEventListener('visibilitychange',visibility,{signal:events.signal});
  addEventListener('portfolio:intro-timeout',finishIntro,{signal:events.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Tab')finishIntro();},{signal:events.signal});
  reduced.addEventListener('change',motionPreference,{signal:events.signal});
  desktop.addEventListener('change',resize,{signal:events.signal});
  hero.querySelector('video').addEventListener('play',request,{signal:events.signal});
  hero.querySelector('video').addEventListener('pause',request,{signal:events.signal});
  const observer=new ResizeObserver(measure);observer.observe(stage);observer.observe(panel);
  measure();animateOpening();
})();
