/* One device budget shared by the intro shader, pointer motion and video loader. */
(() => {
  const mobile=matchMedia('(max-width: 720px), (pointer: coarse)').matches;
  const cores=navigator.hardwareConcurrency||8,memory=navigator.deviceMemory||8;
  const connection=navigator.connection;
  const slow=Boolean(connection?.saveData||/^(slow-2g|2g)$/.test(connection?.effectiveType||''));
  const tier=slow||cores<=4||memory<=2?'low':mobile||memory<=4?'balanced':'high';
  const budgets={
    high:{maxPixels:786432,maxWidth:1280,maxHeight:800,dpr:1,shaderFps:40,motionFps:60,octaves:4,detail:1,maskWidth:512,video:'assets/home-enhanced-desktop.mp4'},
    balanced:{maxPixels:360000,maxWidth:960,maxHeight:640,dpr:1,shaderFps:30,motionFps:45,octaves:3,detail:.8,maskWidth:384,video:'assets/home-enhanced-mobile.mp4'},
    low:{maxPixels:160000,maxWidth:640,maxHeight:480,dpr:.85,shaderFps:24,motionFps:30,octaves:2,detail:.6,maskWidth:256,video:'assets/home-enhanced-low.mp4'}
  };
  const profile=Object.freeze({...budgets[tier],tier});
  function afterPaint(callback){
    let first=0,second=0,cancelled=false;
    first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{if(!cancelled)callback();});});
    return ()=>{cancelled=true;cancelAnimationFrame(first);cancelAnimationFrame(second);};
  }
  function afterLoadIdle(callback){
    let started=false,cancelled=false,deadline=false,idle=0,timer=0,paintCancel;
    const remove=()=>{removeEventListener('load',start);document.removeEventListener('visibilitychange',visible);document.removeEventListener('visibilitychange',run);clearTimeout(timer);};
    const run=()=>{if(cancelled)return;if(document.hidden){document.addEventListener('visibilitychange',run,{once:true});return;}callback();};
    function start(){
      if(started||cancelled||document.hidden)return;
      started=true;remove();paintCancel=afterPaint(()=>{
        if(cancelled)return;
        idle=window.requestIdleCallback?requestIdleCallback(run,{timeout:600}):setTimeout(run,0);
      });
    }
    function visible(){if(!document.hidden&&(deadline||document.readyState==='complete'))start();}
    // A delayed third-party resource must not postpone the effect indefinitely.
    timer=setTimeout(()=>{deadline=true;start();},1200);
    document.addEventListener('visibilitychange',visible);
    if(document.readyState==='complete')start();else addEventListener('load',start,{once:true});
    return ()=>{cancelled=true;remove();paintCancel?.();if(window.cancelIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);};
  }
  window.PortfolioHeroPerformance={profile,afterPaint,afterLoadIdle};
  document.querySelector('.hero')?.setAttribute('data-hero-quality',tier);
})();
