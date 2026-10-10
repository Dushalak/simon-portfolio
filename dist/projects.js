/* The gallery and detail hero share project-data.js. Native anchors stay intact. */
(() => {
  const gallery=document.querySelector('.projects-gallery');
  const projects=Object.values(window.PortfolioProjects||{});
  if(!gallery)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(min-width:721px) and (hover:hover) and (pointer:fine)');
  const events=new AbortController();
  const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;};
  const folds=[];
  // FoldText's character panels, top hinge and crease shading, adapted to this
  // buildless site's native animation system. The title itself never moves.
  function foldTitle(title,text){
    const visual=node('span','project-fold-visual');visual.setAttribute('aria-hidden','true');
    title.replaceChildren(node('span','project-fold-sr-only',text),visual);
    const panels=Array.from(text).map(char=>{
      const segment=node('span','project-fold-segment');
      const piece=node('span','project-fold-piece',char===' '?'\u00a0':char);
      const crease=node('span','project-fold-crease');
      piece.append(crease);segment.append(piece);visual.append(segment);
      return {piece,crease};
    });
    let animations=[],generation=0;
    const reset=()=>{
      generation++;animations.forEach(animation=>animation.cancel());animations=[];
      title.classList.remove('is-folding');
    };
    const play=()=>{
      reset();if(reduced.matches||!fine.matches||!Element.prototype.animate)return;
      const current=generation;title.classList.add('is-folding');
      panels.forEach(({piece,crease},index)=>{
        const timing={duration:550,delay:index*35,easing:'linear',fill:'both'};
        // Sample the supplied power3.out easing (quartic ease-out). No RAF loop.
        const frames=Array.from({length:25},(_,step)=>{
          const offset=step/24,progress=1-Math.pow(1-offset,4);
          return {offset,opacity:progress,transform:`rotateX(${-92*(1-progress)}deg)`};
        });
        const shade=frames.map(frame=>({offset:frame.offset,opacity:.42*(1-frame.opacity)}));
        animations.push(piece.animate(frames,timing),crease.animate(shade,timing));
      });
      Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{
        if(current===generation)reset();
      });
    };
    return {play,reset};
  }
  projects.forEach((project,index)=>{
    if(index%2===0)gallery.append(node('div','projects-row'));
    const section=node('article','project section');section.id=project.key;section.dataset.project=project.key;
    const stage=node('div','project-stage'),link=node('a','project-card');
    link.href=project.href;link.dataset.open=project.key;link.setAttribute('aria-label','查看 '+project.title+' 完整案例');
    const image=node('img','project-image');image.src=project.cover;image.alt=project.title+' 项目封面';image.loading='lazy';image.decoding='async';image.width=1600;image.height=1200;
    const tags=node('div','project-tags');project.tags.forEach(tag=>tags.append(node('span','',tag)));
    const title=node('h3','project-title',project.displayTitle),category=node('p','project-card-category',project.category);
    const fold=foldTitle(title,project.displayTitle);folds.push(fold);
    const plus=node('span','project-card-plus','+');plus.setAttribute('aria-hidden','true');
    link.append(image,node('span','project-shade'),tags,title,category,plus);stage.append(link);section.append(stage);gallery.lastElementChild.append(section);
    const select=active=>{
      if(!fine.matches)return;
      const entering=active&&!section.classList.contains('is-selected');
      section.classList.toggle('is-selected',active);
      if(entering)fold.play();
    };
    link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')select(true);},{signal:events.signal});
    link.addEventListener('pointerleave',()=>select(link.matches(':focus-visible')),{signal:events.signal});
    link.addEventListener('focus',()=>select(link.matches(':focus-visible')),{signal:events.signal});
    link.addEventListener('blur',()=>select(link.matches(':hover')),{signal:events.signal});
    link.addEventListener('pointerdown',()=>link.classList.add('is-pressed'),{signal:events.signal});
    ['pointerup','pointercancel','pointerleave'].forEach(event=>link.addEventListener(event,()=>link.classList.remove('is-pressed'),{signal:events.signal}));
  });
  const cards=[...gallery.querySelectorAll('.project')];
  const heading=document.querySelector('.projects-heading');
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
  }),{threshold:.10,rootMargin:'0px 0px -24px 0px'});
  if(!reduced.matches){gallery.classList.add('projects-ready');heading.classList.add('projects-ready');[heading,...cards].forEach(el=>reveal.observe(el));}
  function revealAt(position){
    cards.forEach(card=>{const top=card.getBoundingClientRect().top+scrollY-position;
      if(top<innerHeight&&top+card.offsetHeight>0){card.classList.add('is-visible','is-restored');reveal.unobserve(card);}
    });
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){folds.forEach(fold=>fold.reset());gallery.classList.remove('projects-ready');heading.classList.remove('projects-ready');cards.forEach(card=>card.classList.add('is-visible'));}},{signal:events.signal});
  fine.addEventListener('change',()=>{if(!fine.matches){folds.forEach(fold=>fold.reset());cards.forEach(card=>card.classList.remove('is-selected'));}},{signal:events.signal});
  window.PortfolioProjectsUI={revealAt};
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();folds.forEach(fold=>fold.reset());reveal.disconnect();},{once:true});
})();
