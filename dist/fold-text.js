/* Shared FoldText panels: the same hinge, shading and easing as project titles. */
(() => {
  const motion=matchMedia('(prefers-reduced-motion:reduce)'),pointer=matchMedia('(hover:hover) and (pointer:fine)');
  const events=new AbortController(),controllers=new WeakMap(),all=new Set();
  const node=(cls,text)=>{const el=document.createElement('span');el.className=cls;if(text)el.textContent=text;return el;};
  function create(title,text=title.textContent,options={}){
    if(controllers.has(title))return controllers.get(title);
    title.classList.add('fold-text');
    const visual=node('fold-text-visual');visual.setAttribute('aria-hidden','true');
    let panels=[],animations=[],generation=0;
    const reset=()=>{generation++;animations.forEach(a=>a.cancel());animations=[];title.classList.remove('is-folding');};
    const rebuild=value=>{
      reset();text=value;visual.replaceChildren();
      panels=Array.from(text).map(char=>{
        const segment=node('fold-text-segment'),piece=node('fold-text-piece',char===' '?'\u00a0':char),crease=node('fold-text-crease');
        piece.append(crease);segment.append(piece);visual.append(segment);return {piece,crease};
      });
      title.replaceChildren(node('fold-text-sr-only',text),visual);
    };
    const play=(delay=0)=>{
      reset();if(motion.matches||!pointer.matches||!Element.prototype.animate)return;
      const current=generation;title.classList.add('is-folding');
      panels.forEach(({piece,crease},index)=>{
        const timing={duration:options.duration||550,delay:delay+index*(options.stagger??35),easing:'linear',fill:'both'};
        const frames=Array.from({length:25},(_,step)=>{
          const offset=step/24,progress=1-Math.pow(1-offset,4);
          return {offset,opacity:progress,transform:`rotateX(${-92*(1-progress)}deg)`};
        });
        animations.push(piece.animate(frames,timing),crease.animate(frames.map(f=>({offset:f.offset,opacity:.42*(1-f.opacity)})),timing));
      });
      Promise.allSettled(animations.map(a=>a.finished)).then(()=>{if(current===generation)reset();});
    };
    const controller={play,reset,setText(value){if(value===text)return;const replay=title.classList.contains('is-folding');rebuild(value);if(replay)play();}};
    controllers.set(title,controller);all.add(controller);rebuild(text);return controller;
  }
  function bind(target,nodes,options={}){
    const folds=nodes.filter(Boolean).map(el=>create(el,el.textContent,options));let active=false;
    const enter=()=>{if(active||target.closest('[inert]'))return;active=true;folds.forEach((fold,i)=>fold.play(i*40));};
    const leave=()=>{if(target.matches(':hover')||target.matches(':focus-visible')||target.querySelector(':focus-visible'))return;active=false;};
    target.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')enter();},{signal:events.signal});
    target.addEventListener('pointerleave',leave,{signal:events.signal});
    target.addEventListener('focusin',()=>{if(target.matches(':focus-visible')||target.querySelector(':focus-visible'))enter();},{signal:events.signal});
    target.addEventListener('focusout',leave,{signal:events.signal});
  }
  window.PortfolioFoldText={create,setText(el,text){const fold=controllers.get(el);if(fold)fold.setText(text);else el.textContent=text;}};
  document.querySelectorAll('.bring-card').forEach(card=>bind(card,[card.querySelector('h3')],{stagger:28}));
  document.querySelectorAll('.contact-links > a,.contact-links > button').forEach(link=>bind(link,[link.querySelector('strong')],{stagger:18}));
  document.querySelectorAll('.hero-nav-item').forEach(link=>bind(link,[link.querySelector('.hero-reveal > span:first-child')],{stagger:24}));
  document.querySelectorAll('#mobile-nav > a').forEach(link=>bind(link,[link.querySelector('.menu-cn'),link.querySelector('.menu-en')],{stagger:24}));
  const toggle=document.querySelector('.menu-toggle'),contact=document.querySelector('.header-contact');
  bind(toggle,[toggle.querySelector('.menu-label')],{stagger:18});
  bind(contact,[contact.querySelector('.header-contact-label')],{stagger:24});
  const caseToggle=document.querySelector('.case-menu summary');
  bind(caseToggle,[caseToggle.querySelector('.case-menu-label')],{stagger:18});
  document.querySelectorAll('[data-case-switch]').forEach(button=>bind(button,[button.querySelector('.menu-cn'),button.querySelector('.menu-en')],{stagger:24}));
  const caseClose=document.querySelector('.case-toolbar-close');
  bind(caseClose,[caseClose.querySelector('.case-close-label')],{stagger:24});
  // About headings use the same proximity typography as its left-column text.
  [motion,pointer].forEach(media=>media.addEventListener('change',()=>all.forEach(fold=>fold.reset()),{signal:events.signal}));
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();all.forEach(fold=>fold.reset());all.clear();},{signal:events.signal});
})();
