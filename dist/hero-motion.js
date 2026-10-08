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
  const darken = hero.querySelector('.hero-darken');
  const cursorLight = hero.querySelector('.hero-light');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 721px) and (hover: hover) and (pointer: fine)');

  // All motion parameters live here. The original page routes remain native anchors.
  const config = { drawMs: 1500, revealMs: 660, staggerMs: 140, tiltDeg: 1.8,
    photoPx: 8, lightPx: 18, interpolation: .075 };
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const clamp = (v, lo=0, hi=1) => Math.min(hi,Math.max(lo,v));
  const smooth = v => { v=clamp(v); return v*v*(3-2*v); };
  const segment = (p,a,b) => smooth((p-a)/(b-a));
  const pieces = [...panel.querySelectorAll('.hero-piece')];
  const offsets = [{start:.04,end:.64,scale:1.2}, {start:.1,end:.74,scale:1},
    ...Array.from({length:5},(_,i)=>({start:.16+i*.04,end:.75+i*.025,scale:1}))];
  let animations=[], introDone=false, frame=0, active=true, geometry;
  let targetX=0,targetY=0,x=0,y=0,glow=0,targetGlow=0;
  let pointerX=0,pointerY=0,lightX=0,lightY=0,lastTime=0;
  const events = new AbortController();

  // 1. Opening timeline: one clock, a real path draw, then staggered editorial text.
  function finishIntro() {
    if (introDone) return;
    introDone=true; hero.classList.remove('hero-intro-running');
    animations.forEach(a=>a.cancel()); animations=[];
    hero.dataset.intro='complete'; request();
  }
  function animateOpening() {
    if (reduced.matches || scrollY>30 || !Element.prototype.animate) { finishIntro(); return; }
    hero.classList.add('hero-intro-running'); hero.dataset.intro='drawing';
    const clock=document.timeline.currentTime;
    function cue(node,keys,duration,delay=0,easing=ease) {
      const a=node.animate(keys,{duration,delay,easing,fill:'both'}); a.startTime=clock; animations.push(a); return a;
    }
    cue(border.querySelector('path'),[{strokeDashoffset:'1'},{strokeDashoffset:'0'}],config.drawMs,0,'cubic-bezier(.65,0,.35,1)');
    cue(darken,[{opacity:.84},{opacity:.12}],2450);
    const revealKeys=[{opacity:0,filter:'blur(8px)',transform:'translate3d(0,16px,0)'},
      {opacity:1,filter:'blur(0px)',transform:'translate3d(0,0,0)'}];
    cue(panel.querySelector('.hero-heading .hero-reveal'),revealKeys,config.revealMs,config.drawMs-70);
    cue(panel.querySelector('.hero-philosophy .hero-reveal'),revealKeys,config.revealMs,config.drawMs+100);
    panel.querySelectorAll('.hero-nav-item .hero-reveal').forEach((node,i)=>cue(node,revealKeys,config.revealMs,config.drawMs+270+i*config.staggerMs));
    const end=cue(hero.querySelector('.hero-author .hero-reveal'),revealKeys,600,config.drawMs+940);
    end.finished.then(finishIntro).catch(()=>{});
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
    photo.style.transform=`translate3d(${x*config.photoPx*movement}px,calc(-50% + ${y*5*movement-p*14}px),0) scale(${1+p*.035})`;
    lightPlane.style.transform=`translate3d(${x*config.lightPx*movement}px,calc(-50% + ${y*10*movement-p*20}px),0) scale(${1+p*.04})`;
    videoPlane.style.transform=`translate3d(${x*config.lightPx*movement}px,${y*10*movement}px,0) scale(${1+p*.035})`;
    cursorLight.style.transform=`translate3d(${lightX-140}px,${lightY-140}px,0)`;
    cursorLight.style.opacity=String(glow*.5*(1-p));
    atmosphere.style.animationPlayState=hero.querySelector('video').paused?'paused':'running';
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
  function cleanUp(event){if(event.persisted)return;active=false;events.abort();observer.disconnect();animations.forEach(a=>a.cancel());cancelAnimationFrame(frame);}
  hero.classList.toggle('has-story',!reduced.matches);
  const options={passive:true,signal:events.signal};
  stage.addEventListener('pointermove',pointerMove,options);
  stage.addEventListener('pointerleave',resetPointer,options);
  addEventListener('scroll',scroll,options);addEventListener('resize',resize,options);
  addEventListener('pagehide',cleanUp,{signal:events.signal});addEventListener('pageshow',resize,{signal:events.signal});
  document.addEventListener('visibilitychange',visibility,{signal:events.signal});
  reduced.addEventListener('change',motionPreference,{signal:events.signal});
  desktop.addEventListener('change',resize,{signal:events.signal});
  hero.querySelector('video').addEventListener('play',request,{signal:events.signal});
  hero.querySelector('video').addEventListener('pause',request,{signal:events.signal});
  const observer=new ResizeObserver(measure);observer.observe(stage);observer.observe(panel);
  measure();animateOpening();
})();
