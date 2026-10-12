/* Project entry pushes up from below; return keeps the existing downward reveal. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const duration=1050,easing='cubic-bezier(.76,0,.24,1)';
  let busy=false,active=null;
  const stripIds=node=>{node.removeAttribute('id');node.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));node.setAttribute('aria-hidden','true');node.inert=true;return node;};
  function detailSnapshot(dialog){
    const copy=stripIds(dialog.cloneNode(true));copy.classList.add('page-transition-old');copy.classList.remove('case-preparing');copy.style.clipPath='none';
    copy.querySelectorAll('[data-case-entry]').forEach(el=>el.style.opacity='1');
    document.body.append(copy);copy.scrollTop=dialog.scrollTop;return copy;
  }
  function homeSnapshot(dialog,position){
    const frame=document.createElement('div');frame.className='page-transition-home';frame.setAttribute('aria-hidden','true');frame.inert=true;
    const scroller=document.createElement('div');scroller.className='page-transition-home-scroll';
    const main=stripIds(document.querySelector('main').cloneNode(true));scroller.style.transform=`translateY(${-position}px)`;scroller.append(main);frame.append(scroller);
    ['.header','.section-rail'].forEach(selector=>{const original=document.querySelector(selector);if(original)frame.append(stripIds(original.cloneNode(true)));});
    dialog.append(frame);return frame;
  }
  async function run(change,{direction='enter',dialog,homeScroll=0,onReady}={}){
    if(busy)return false;
    busy=true;let applied=false,snapshot=null,animation=null;
    const apply=()=>{if(applied)return;applied=true;change();};
    const root=document.documentElement;root.dataset.pageTransition=direction;document.body.classList.add('case-transitioning');
    try{
      if(reduced.matches||!Element.prototype.animate){apply();onReady?.();return true;}
      if(document.startViewTransition){
        active=document.startViewTransition(apply);
        await active.ready.catch(()=>apply());
        onReady?.();
        await active.finished.catch(()=>apply());
      }else if(direction==='return'){
        // The live detail stays on screen while an inert copy of the destination is revealed.
        window.scrollTo({top:homeScroll,behavior:'instant'});window.PortfolioProjectsUI?.revealAt(homeScroll);
        snapshot=homeSnapshot(dialog,homeScroll);
        animation=snapshot.animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],{duration,easing,fill:'both'});
        await animation.finished.catch(()=>{});apply();onReady?.();
      }else{
        if(dialog.open)snapshot=detailSnapshot(dialog);
        apply();onReady?.();
        animation=dialog.animate([{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}],{duration,easing,fill:'both'});
        await animation.finished.catch(()=>{});
      }
      return true;
    }finally{
      apply();animation?.cancel();snapshot?.remove();active=null;busy=false;
      delete root.dataset.pageTransition;document.body.classList.remove('case-transitioning');
    }
  }
  addEventListener('pagehide',()=>active?.skipTransition?.());
  window.PortfolioPageTransition={run,duration,easing,get busy(){return busy;}};
})();
