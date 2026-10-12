/* RippleButton-style click feedback on the requested contact and case actions. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController();
  const buttons=[...document.querySelectorAll('.header-contact,.case-toolbar-close,.case-end button')];
  const active=new Set();
  function ripple(button,event){
    if(reduced.matches)return;
    const rect=button.getBoundingClientRect();
    const keyboard=event.type==='click',x=keyboard?button.offsetWidth/2:(event.clientX-rect.left)/rect.width*button.offsetWidth;
    const y=keyboard?button.offsetHeight/2:(event.clientY-rect.top)/rect.height*button.offsetHeight;
    const size=Math.hypot(button.offsetWidth,button.offsetHeight)*2;
    const wave=document.createElement('span');wave.className='button-ripple-wave';
    Object.assign(wave.style,{width:size+'px',height:size+'px',left:(x-size/2)+'px',top:(y-size/2)+'px'});
    button.querySelector('.button-ripple-surface').append(wave);
    const animation=wave.animate([{transform:'scale(0)',opacity:0.38},{transform:'scale(.65)',opacity:.24,offset:.5},{transform:'scale(1)',opacity:0}],{duration:600,easing:'cubic-bezier(.2,.65,.3,1)'});
    active.add(animation);const clean=()=>{active.delete(animation);wave.remove();};animation.onfinish=animation.oncancel=clean;
  }
  buttons.forEach(button=>{
    button.classList.add('button-ripple-host');
    if(button.matches('.case-end .case-close'))button.classList.add('button-ripple-dark');
    const label=document.createElement('span');label.className='button-ripple-label';label.append(...button.childNodes);
    const surface=document.createElement('span');surface.className='button-ripple-surface';surface.setAttribute('aria-hidden','true');
    button.append(surface,label);
    button.addEventListener('pointerdown',event=>{if(event.button===0)ripple(button,event);},{signal:events.signal});
    button.addEventListener('click',event=>{if(event.detail===0)ripple(button,event);},{signal:events.signal});
  });
  const cancel=()=>[...active].forEach(animation=>animation.cancel());
  reduced.addEventListener('change',cancel,{signal:events.signal});
  addEventListener('pagehide',event=>{if(!event.persisted){cancel();events.abort();}},{signal:events.signal});
})();
