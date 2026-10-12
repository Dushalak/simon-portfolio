/* Sample the existing entrance keyframes from document scroll, in both directions. */
(() => {
  const clamp=value=>Math.max(0,Math.min(1,value));
  const layoutTop=element=>{let top=0;for(let node=element;node;node=node.offsetParent)top+=node.offsetTop;return top;};
  // Invert cubic-bezier(.22,1,.36,1) so the scroll version keeps the same easing.
  function ease(p){
    if(p===0||p===1)return p;
    let t=p,lo=0,hi=1;
    for(let i=0;i<10;i++){const x=3*(1-t)*(1-t)*t*.22+3*(1-t)*t*t*.36+t*t*t;if(x<p)lo=t;else hi=t;t=(lo+hi)/2;}
    return 1-Math.pow(1-t,3);
  }
  window.PortfolioScrollReveal={create(groups){
    const motion=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
    let frame=0,destroyed=false;
    const tracks=groups.map(group=>({...group,top:0,entries:group.nodes.map((element,index)=>({element,delay:(group.delay||0)+index*(group.stagger||0),last:-1}))}));
    function renderAt(position=scrollY){
      if(destroyed)return;
      const height=innerHeight;
      tracks.forEach(track=>{
        const duration=track.duration||750,total=duration+Math.max(...track.entries.map(entry=>entry.delay));
        const progress=motion.matches?1:clamp((height*(track.start??.92)-(track.top-position))/(height*((track.start??.92)-(track.end??.32))));
        track.entries.forEach(entry=>{
          const p=clamp((progress*total-entry.delay)/duration),element=entry.element;
          if(p===entry.last)return;entry.last=p;
          element.dataset.scrollRevealProgress=p.toFixed(4);
          if(track.visibleClass)element.classList.toggle(track.visibleClass,p===1);
          if(p===1){
            element.style.opacity='1';element.style.removeProperty('transform');element.style.removeProperty('filter');
          }else{
            const value=ease(p),remaining=1-value;
            element.style.opacity=String((track.opacity??0)+value*(1-(track.opacity??0)));
            element.style.transform=`translate3d(0,${((track.y||0)*remaining).toFixed(3)}px,0) scale(${(1-remaining*(1-(track.scale??1))).toFixed(5)})`;
            element.style.filter=`blur(${((track.blur||0)*remaining).toFixed(3)}px)`;
          }
        });
      });
    }
    function request(){if(!frame&&!destroyed&&!document.hidden)frame=requestAnimationFrame(()=>{frame=0;renderAt();});}
    function measure(){tracks.forEach(track=>track.top=layoutTop(track.anchor||track.nodes[0]));renderAt();}
    addEventListener('scroll',request,{passive:true,signal:events.signal});
    addEventListener('resize',measure,{passive:true,signal:events.signal});
    addEventListener('pageshow',measure,{signal:events.signal});
    document.addEventListener('visibilitychange',request,{signal:events.signal});
    motion.addEventListener('change',()=>{tracks.forEach(track=>track.entries.forEach(entry=>entry.last=-1));renderAt();},{signal:events.signal});
    const resize=new ResizeObserver(measure);resize.observe(document.querySelector('main'));
    document.fonts.ready.then(()=>{if(!destroyed)measure();});
    measure();
    return {renderAt,measure,dispose(){destroyed=true;events.abort();resize.disconnect();cancelAnimationFrame(frame);}};
  }};
})();
