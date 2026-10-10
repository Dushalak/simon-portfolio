/* Native lifecycle adapter for the supplied React Bits SwipeToast.
 * Keeps its fuse, hover/focus pause, rubberband, flick and downward dismissal. */
(() => {
  const root=document.querySelector('.swipe-toast'),card=root.querySelector('.swipe-toast__card'),fuse=root.querySelector('.swipe-toast__fuse');
  const title=root.querySelector('.swipe-toast__title'),description=root.querySelector('.swipe-toast__desc');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
  const duration=3200,slideMs=400,swipeDistance=40,FLICK=.11,DEAD_ZONE=3,RESIST_PX=24;
  const flags={hover:false,interacting:false,focus:false,hidden:document.hidden};
  let burn,move,exitTimer,enterFrame,drag,y=0,pendingClose,restoreFocus,returnFocus=false;
  const isOpen=()=>root.dataset.phase==='open';
  function syncFuse(){
    if(!burn||!isOpen())return;
    if(Object.values(flags).some(Boolean))burn.pause();
    else if(burn.playState==='paused')burn.play();
  }
  function resetCard(){move?.cancel();move=null;y=0;card.style.transform='translateY(0px)';card.style.opacity='1';delete card.dataset.swiping;}
  function finish(){
    root.dataset.phase='gone';root.inert=true;burn?.cancel();burn=null;resetCard();
    if(returnFocus&&restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});returnFocus=false;
  }
  function close(reason='timeout'){
    if(!isOpen())return;
    if(drag){pendingClose=reason;return;}
    returnFocus=card.contains(document.activeElement);burn?.pause();root.dataset.phase='closing';root.inert=true;clearTimeout(exitTimer);
    if(reason==='escape'){root.dataset.instant='';finish();}
    else exitTimer=setTimeout(finish,reduce.matches?200:slideMs*.7+60);
  }
  function show(value,trigger){
    clearTimeout(exitTimer);cancelAnimationFrame(enterFrame);burn?.cancel();pendingClose=null;
    if(drag){try{card.releasePointerCapture(drag.id);}catch{}drag=null;}
    flags.interacting=false;flags.focus=card.contains(document.activeElement);flags.hover=card.matches(':hover');flags.hidden=document.hidden;
    restoreFocus=trigger;returnFocus=false;resetCard();delete root.dataset.instant;
    const entering=root.dataset.phase==='gone';root.inert=false;
    root.dataset.mounted=entering?'false':'true';root.dataset.phase='open';
    title.textContent=(trigger?.dataset.copyLabel||'内容')+'已复制';description.textContent=value;
    if(entering){void card.offsetHeight;enterFrame=requestAnimationFrame(()=>root.dataset.mounted='true');}
    burn=fuse.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration,easing:'linear',fill:'forwards'});
    burn.onfinish=()=>close('timeout');syncFuse();
  }
  function settle(){
    const current=y;resetCard();
    move=card.animate(reduce.matches?[{transform:`translateY(${current}px)`},{transform:'translateY(0px)'}]:[{transform:`translateY(${current}px)`},{transform:`translateY(${-current*.12}px)`,offset:.72},{transform:'translateY(0px)'}],{duration:reduce.matches?200:500,easing:'cubic-bezier(.23,1,.32,1)'});
  }
  card.addEventListener('pointerdown',e=>{
    if(e.button!==0||!isOpen()||drag)return;
    move?.cancel();move=null;try{card.setPointerCapture(e.pointerId);}catch{}
    drag={id:e.pointerId,startY:e.clientY,grab:null,hist:[[performance.now(),y]]};flags.interacting=true;syncFuse();
  },{signal:events.signal});
  card.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    if(drag.grab===null){if(Math.abs(e.clientY-drag.startY)<DEAD_ZONE)return;drag.grab=e.clientY-y;card.dataset.swiping='';}
    const raw=e.clientY-drag.grab;
    y=raw>=0?raw:(raw*RESIST_PX*.55)/(RESIST_PX+.55*Math.abs(raw));
    card.style.transform=`translateY(${y}px)`;drag.hist.push([performance.now(),y]);if(drag.hist.length>4)drag.hist.shift();
  },{signal:events.signal});
  function release(e){
    if(!drag||drag.id!==e.pointerId)return;
    const history=drag.hist,first=history[0],last=history[history.length-1];
    const velocity=history.length<2||performance.now()-last[0]>100?0:(last[1]-first[1])/Math.max(1,last[0]-first[0]);
    drag=null;delete card.dataset.swiping;try{card.releasePointerCapture(e.pointerId);}catch{}flags.interacting=false;
    if(e.type!=='pointercancel'&&y>0&&(velocity>FLICK||y>=swipeDistance&&velocity>=0)){
      const current=y;returnFocus=card.contains(document.activeElement);burn?.pause();pendingClose=null;root.dataset.phase='swiping';root.inert=true;
      move=card.animate([{transform:`translateY(${current}px)`,opacity:1},{transform:`translateY(${current+card.offsetHeight}px)`,opacity:0}],{duration:reduce.matches?200:300,easing:'cubic-bezier(.23,1,.32,1)'});
      clearTimeout(exitTimer);exitTimer=setTimeout(finish,reduce.matches?200:300);return;
    }
    if(y)settle();const queued=pendingClose;pendingClose=null;if(queued)close(queued);else syncFuse();
  }
  card.addEventListener('pointerup',release,{signal:events.signal});card.addEventListener('pointercancel',release,{signal:events.signal});
  card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){flags.hover=true;syncFuse();}},{signal:events.signal});
  card.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){flags.hover=false;syncFuse();}},{signal:events.signal});
  card.addEventListener('focusin',()=>{flags.focus=true;syncFuse();},{signal:events.signal});
  card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget)){flags.focus=false;syncFuse();}},{signal:events.signal});
  card.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close('escape');}},{signal:events.signal});
  document.addEventListener('visibilitychange',()=>{flags.hidden=document.hidden;syncFuse();},{signal:events.signal});
  addEventListener('pagehide',e=>{if(e.persisted)return;events.abort();clearTimeout(exitTimer);cancelAnimationFrame(enterFrame);burn?.cancel();move?.cancel();},{signal:events.signal});
  window.PortfolioSwipeToast={show};
})();
