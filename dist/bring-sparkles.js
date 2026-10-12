/* SparklesText-style stars, scoped to the four advantage card headings. */
(() => {
  const motion=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const events=new AbortController(),cards=[...document.querySelectorAll('.bring-card')];
  const ns='http://www.w3.org/2000/svg';
  cards.forEach(card=>{
    const title=card.querySelector('h3'),wrap=document.createElement('span');
    wrap.className='bring-sparkles-text';wrap.append(...title.childNodes);title.append(wrap);
    const stars=document.createElement('span');stars.className='bring-sparkles';stars.setAttribute('aria-hidden','true');wrap.append(stars);
    for(let i=0;i<6;i++){
      const star=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
      star.setAttribute('viewBox','0 0 21 21');star.setAttribute('focusable','false');
      path.setAttribute('d','M10.5 0 C12 7.8 13.2 9 21 10.5 C13.2 12 12 13.2 10.5 21 C9 13.2 7.8 12 0 10.5 C7.8 9 9 7.8 10.5 0Z');
      star.style.setProperty('--sparkle-color',i%2?'#df9a35':'#a16ce5');star.append(path);stars.append(star);
    }
    const activate=()=>{
      if(motion.matches||!fine.matches||document.hidden)return;
      [...stars.children].forEach((star,i)=>{
        star.style.left=`${8+i*17+Math.random()*7}%`;
        star.style.top=`${i%2?76:-8}%`;
        star.style.setProperty('--sparkle-size',`${16+Math.random()*7}px`);
        star.style.setProperty('--sparkle-delay',`${i*.13}s`);
        star.style.setProperty('--sparkle-duration',`${1.05+Math.random()*.35}s`);
      });
      card.classList.add('has-title-sparkles');
    };
    const deactivate=()=>card.classList.remove('has-title-sparkles');
    card.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')activate();},{signal:events.signal});
    card.addEventListener('pointerleave',()=>{if(!card.querySelector(':focus-visible'))deactivate();},{signal:events.signal});
    card.addEventListener('focusin',()=>{if(card.querySelector(':focus-visible'))activate();},{signal:events.signal});
    card.addEventListener('focusout',()=>{if(!card.matches(':hover'))deactivate();},{signal:events.signal});
  });
  const stop=()=>cards.forEach(card=>card.classList.remove('has-title-sparkles'));
  [motion,fine].forEach(media=>media.addEventListener('change',stop,{signal:events.signal}));
  document.addEventListener('visibilitychange',stop,{signal:events.signal});
  addEventListener('blur',stop,{signal:events.signal});
  addEventListener('pagehide',e=>{if(!e.persisted){stop();events.abort();}},{signal:events.signal});
})();
