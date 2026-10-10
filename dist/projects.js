/* The gallery and detail hero share project-data.js. Native anchors stay intact. */
(() => {
  const gallery=document.querySelector('.projects-gallery');
  const projects=Object.values(window.PortfolioProjects||{});
  if(!gallery)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(min-width:721px) and (hover:hover) and (pointer:fine)');
  const events=new AbortController();
  const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;};
  projects.forEach((project,index)=>{
    if(index%2===0)gallery.append(node('div','projects-row'));
    const section=node('article','project section');section.id=project.key;section.dataset.project=project.key;
    const stage=node('div','project-stage'),link=node('a','project-card');
    link.href=project.href;link.dataset.open=project.key;link.setAttribute('aria-label','查看 '+project.title+' 完整案例');
    const image=node('img','project-image');image.src=project.cover;image.alt=project.title+' 项目封面';image.loading='lazy';image.decoding='async';image.width=1600;image.height=1200;
    const tags=node('div','project-tags');project.tags.forEach(tag=>tags.append(node('span','',tag)));
    const title=node('h3','project-title',project.displayTitle),category=node('p','project-card-category',project.category);
    const plus=node('span','project-card-plus','+');plus.setAttribute('aria-hidden','true');
    link.append(image,node('span','project-shade'),tags,title,category,plus);stage.append(link);section.append(stage);gallery.lastElementChild.append(section);
    const select=active=>{if(!fine.matches)return;section.classList.toggle('is-selected',active);};
    link.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')select(true);},{signal:events.signal});
    link.addEventListener('pointerleave',()=>select(link.matches(':focus-visible')),{signal:events.signal});
    link.addEventListener('focus',()=>select(link.matches(':focus-visible')),{signal:events.signal});
    link.addEventListener('blur',()=>select(link.matches(':hover')),{signal:events.signal});
    link.addEventListener('pointerdown',()=>link.classList.add('is-pressed'),{signal:events.signal});
    ['pointerup','pointercancel','pointerleave'].forEach(event=>link.addEventListener(event,()=>link.classList.remove('is-pressed'),{signal:events.signal}));
  });
  const cards=[...gallery.querySelectorAll('.project')];
  const heading=document.querySelector('.projects-heading');
  function titleSizes(){cards.forEach(card=>{const title=card.querySelector('.project-title');card.style.setProperty('--title-width',title.offsetWidth+'px');});}
  const sizes=new ResizeObserver(titleSizes);gallery.querySelectorAll('.projects-row').forEach(row=>sizes.observe(row));
  document.fonts.ready.then(titleSizes);titleSizes();
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
  }),{threshold:.10,rootMargin:'0px 0px -24px 0px'});
  if(!reduced.matches){gallery.classList.add('projects-ready');heading.classList.add('projects-ready');[heading,...cards].forEach(el=>reveal.observe(el));}
  function revealAt(position){
    cards.forEach(card=>{const top=card.getBoundingClientRect().top+scrollY-position;
      if(top<innerHeight&&top+card.offsetHeight>0){card.classList.add('is-visible','is-restored');reveal.unobserve(card);}
    });
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){gallery.classList.remove('projects-ready');heading.classList.remove('projects-ready');cards.forEach(card=>card.classList.add('is-visible'));}},{signal:events.signal});
  fine.addEventListener('change',()=>{if(!fine.matches)cards.forEach(card=>card.classList.remove('is-selected'));},{signal:events.signal});
  window.PortfolioProjectsUI={revealAt};
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();sizes.disconnect();reveal.disconnect();},{once:true});
})();
