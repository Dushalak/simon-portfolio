/* The canvas-confetti engine used by Magic UI Confetti, fired only after a successful copy. */
(() => {
  const reduce=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
  let canvas,instance,generation=0,lastFire=-Infinity,cleanupTimer;
  function stop(){
    generation++;clearTimeout(cleanupTimer);instance?.reset();if(canvas)canvas.hidden=true;
  }
  function fire(){
    if(reduce.matches||document.hidden||typeof window.confetti!=='function')return;
    const now=performance.now();if(now-lastFire<450)return;lastFire=now;
    try{
      if(!canvas){
        canvas=document.createElement('canvas');canvas.className='copy-confetti';canvas.setAttribute('aria-hidden','true');
        document.body.append(canvas);instance=window.confetti.create(canvas,{resize:true,useWorker:true});
      }
      const current=++generation;clearTimeout(cleanupTimer);canvas.hidden=false;
      const mobile=innerWidth<=720;
      const options={particleCount:mobile?28:52,spread:52,startVelocity:mobile?34:46,gravity:1.1,decay:.93,ticks:180,scalar:mobile?.72:.86,shapes:['square'],colors:['#d9be88','#f2ebe0','#b7c8be','#a9bbc9','#c4b4cf'],disableForReducedMotion:true};
      const bursts=[instance({...options,angle:60,drift:.2,origin:{x:.015,y:1}}),instance({...options,angle:120,drift:-.2,origin:{x:.985,y:1}})];
      const finish=()=>{if(generation===current){clearTimeout(cleanupTimer);canvas.hidden=true;}};
      Promise.all(bursts).then(finish,finish);cleanupTimer=setTimeout(()=>{if(generation===current)stop();},4500);
    }catch{stop();}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{signal:events.signal});
  reduce.addEventListener('change',()=>{if(reduce.matches)stop();},{signal:events.signal});
  addEventListener('pagehide',()=>{stop();events.abort();canvas?.remove();},{signal:events.signal});
  window.PortfolioCopyConfetti={fire};
})();
