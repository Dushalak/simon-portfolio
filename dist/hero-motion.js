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
  const config = { revealMs: 660, staggerMs: 140, tiltDeg: 5.8,
    photoPx: 24, photoY: 14, lightPx: 48, lightY: 28, interpolation: .075,
    scrollThreshold: 90, mobileThreshold: 56, layoutMs: 760 };
  const clamp = (v, lo=0, hi=1) => Math.min(hi,Math.max(lo,v));
  const pieces = [...panel.querySelectorAll('.hero-piece')];
  let layoutTarget=0,layoutFrom=0,layoutValue=0,layoutStart=0;
  let introTimeline, introDone=false, frame=0, active=true, geometry;
  let targetX=0,targetY=0,x=0,y=0,glow=0,targetGlow=0;
  let pointerX=0,pointerY=0,lightX=0,lightY=0,lastTime=0;
  const events = new AbortController();

  // 1. Intro delegates to one master timeline, then hands off to the interactions.
  function finishIntro() {
    if (introDone) return;
    introDone=true; hero.classList.remove('hero-intro-running');
    introTimeline?.finish();
    document.documentElement.classList.remove('intro-pending','intro-running');
    clearTimeout(window.portfolioIntroWatchdog);
    window.portfolioReleaseIntro?.();
    dispatchEvent(new Event('portfolio:intro-complete'));
    hero.dataset.intro='complete'; request();
  }
  function animateOpening() {
    if (reduced.matches || !Element.prototype.animate || !window.PortfolioIntro) { finishIntro(); return; }
    try {
      introTimeline=window.PortfolioIntro.create({hero,onComplete:finishIntro,revealMs:config.revealMs,staggerMs:config.staggerMs});
      introTimeline.play();
    } catch (_) { finishIntro(); }
  }

  // 2. Crossing one threshold starts a timed layout transition. Stopping the
  // wheel cannot leave the text halfway; reversing below the threshold returns it.
  function measure() {
    const w=stage.clientWidth,h=stage.clientHeight;
    const left=panel.offsetLeft-panel.offsetWidth/2;
    const top=panel.offsetTop-panel.offsetHeight/2;
    const margin=w*(desktop.matches ? .044 : .06);
    const mobile=w<=720;
    const titleY=Math.max(135,h-(mobile?389:374));
    const philosophyY=titleY+55;
    const navY=philosophyY+60;
    geometry={w,h,pin:Math.max(1,hero.offsetHeight-stage.offsetHeight),
      threshold:mobile?config.mobileThreshold:config.scrollThreshold,
      slots:pieces.map((node,i)=>({dx:margin-left-node.offsetLeft-(i>=2?parseFloat(getComputedStyle(node).paddingLeft)||0:0),
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
    if(!introDone&&scrollY>0)window.scrollTo({top:0,left:0,behavior:'instant'});
    const scrollDistance=Math.max(0,-rect.top);
    const nextLayout=reduced.matches?0:scrollDistance>=(layoutTarget?geometry.threshold-18:geometry.threshold)?1:0;
    if(nextLayout!==layoutTarget){layoutFrom=layoutValue;layoutTarget=nextLayout;layoutStart=now;}
    const layoutElapsed=clamp((now-layoutStart)/config.layoutMs);
    const layoutEase=1-Math.pow(1-layoutElapsed,4);
    layoutValue=layoutFrom+(layoutTarget-layoutFrom)*layoutEase;
    hero.dataset.layout=layoutTarget?'corner':'center';
    hero.dataset.layoutProgress=layoutValue.toFixed(3);
    const dt=Math.min(40,lastTime?now-lastTime:16.67);lastTime=now;
    const alpha=1-Math.pow(1-config.interpolation,dt/16.67);
    const canTilt=desktop.matches&&!reduced.matches&&introDone&&visible&&!document.querySelector('.case-dialog')?.open;
    if(!canTilt)targetX=targetY=targetGlow=0;
    x+=(targetX-x)*alpha;y+=(targetY-y)*alpha;
    lightX+=(pointerX-lightX)*alpha;lightY+=(pointerY-lightY)*alpha;glow+=(targetGlow-glow)*alpha;
    // Text settles into its reading layout; the background keeps its independent depth.
    const panelMovement=(1-layoutValue)*(canTilt?1:0),sceneMovement=canTilt?1:0;
    panel.style.transform=`translate(-50%,-50%) rotateX(${-y*config.tiltDeg*panelMovement}deg) rotateY(${x*config.tiltDeg*panelMovement}deg)`;
    border.style.opacity=String(.72*(1-layoutValue));
    pieces.forEach((node,i)=>{
      const t=layoutValue,slot=geometry.slots[i],scale=i===0?(geometry.w<=720?1.08:1.2):1;
      node.style.transform=`translate3d(${slot.dx*t}px,${slot.dy*t}px,0) scale(${1+(scale-1)*t})`;
    });
    photo.style.transform=`translate3d(${x*config.photoPx*sceneMovement}px,calc(-50% + ${y*config.photoY*sceneMovement-p*14}px),0) scale(${1+p*.035})`;
    lightPlane.style.transform=`translate3d(${x*config.lightPx*sceneMovement}px,calc(-50% + ${y*config.lightY*sceneMovement-p*20}px),0) scale(${1+p*.04})`;
    videoPlane.style.transform=`translate3d(${x*config.lightPx*sceneMovement}px,${y*config.lightY*sceneMovement}px,0) rotateX(${-y*config.tiltDeg*.42*sceneMovement}deg) rotateY(${x*config.tiltDeg*.42*sceneMovement}deg) scale(${1+p*.035})`;
    cursorLight.style.transform=`translate3d(${lightX-140}px,${lightY-140}px,0)`;
    cursorLight.style.opacity=String(glow*.75*(1-p));
    atmosphere.style.animationPlayState=!introDone||hero.querySelector('video').paused?'paused':'running';
    const unsettled=Math.abs(targetX-x)+Math.abs(targetY-y)>.002 || Math.abs(pointerX-lightX)+Math.abs(pointerY-lightY)>.25 || Math.abs(targetGlow-glow)>.002;
    if(visible&&(unsettled||layoutElapsed<1)&&!reduced.matches)request();
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
  reduced.addEventListener('change',motionPreference,{signal:events.signal});
  desktop.addEventListener('change',resize,{signal:events.signal});
  hero.querySelector('video').addEventListener('play',request,{signal:events.signal});
  hero.querySelector('video').addEventListener('pause',request,{signal:events.signal});
  const observer=new ResizeObserver(measure);observer.observe(stage);observer.observe(panel);
  measure();animateOpening();
})();
