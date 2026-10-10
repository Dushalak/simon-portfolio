/* The gallery and detail hero share project-data.js. Native anchors stay intact. */
(() => {
  const gallery=document.querySelector('.projects-gallery');
  const projects=Object.values(window.PortfolioProjects||{});
  if(!gallery)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(min-width:721px) and (hover:hover) and (pointer:fine)');
  const events=new AbortController();
  const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;};
  const folds=[];
  projects.forEach((project,index)=>{
    if(index%2===0)gallery.append(node('div','projects-row'));
    const section=node('article','project section');section.id=project.key;section.dataset.project=project.key;
    const stage=node('div','project-stage'),link=node('a','project-card');
    link.href=project.href;link.dataset.open=project.key;link.setAttribute('aria-label','查看 '+project.title+' 完整案例');
    const image=node('img','project-image');image.src=project.cover;image.alt=project.title+' 项目封面';image.loading='lazy';image.decoding='async';image.width=1600;image.height=1200;
    const tags=node('div','project-tags');project.tags.forEach(tag=>tags.append(node('span','',tag)));
    const title=node('h3','project-title',project.displayTitle),category=node('p','project-card-category',project.category);
    const fold=window.PortfolioFoldText.create(title,project.displayTitle);folds.push(fold);
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
  const headingTitle=heading.querySelector('h2'),headingBody=heading.querySelector('.projects-heading-body');
  const headingCount=heading.querySelector('[data-project-count]');
  headingCount.textContent=String(projects.length).padStart(2,'0');headingCount.setAttribute('aria-label',projects.length+' 个精选项目');
  const headingWords=[];
  heading.querySelectorAll('[data-heading-words]').forEach(line=>{
    const words=line.dataset.headingWords.split('|').map(text=>node('span','projects-heading-word',text));
    line.replaceChildren(...words);headingWords.push(...words);
  });
  const headingAnimations=new Set();
  function animateHeading(element,frames,timing,visibleClass){
    const animation=element.animate(frames,{...timing,fill:'both'});headingAnimations.add(animation);
    animation.finished.then(()=>{element.classList.add(visibleClass);animation.cancel();headingAnimations.delete(animation);},()=>headingAnimations.delete(animation));
  }
  function revealHeading(target,instant=false){
    if(target===headingTitle){
      headingTitle.dataset.revealed='true';
      headingWords.forEach((word,index)=>{
        if(instant){word.classList.add('is-heading-word-visible');return;}
        // The original initial values are opacity .001, blur 4px and Y 10px.
        // Duration/easing/stagger are tuned approximations of the observed reveal.
        animateHeading(word,[{opacity:.001,filter:'blur(4px)',transform:'translate3d(0,10px,0)'},{opacity:1,filter:'blur(0px)',transform:'none'}],
          {duration:680,delay:index*70,easing:'cubic-bezier(.22,1,.36,1)'},'is-heading-word-visible');
      });
    }else{
      headingBody.dataset.revealed='true';
      if(instant){headingBody.classList.add('is-heading-body-visible');return;}
      animateHeading(headingBody,[{opacity:0,transform:'translate3d(0,35px,0)'},{opacity:1,transform:'none'}],
        {duration:750,easing:'cubic-bezier(.22,1,.36,1)'},'is-heading-body-visible');
    }
  }
  const headingReveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){headingReveal.unobserve(entry.target);revealHeading(entry.target,reduced.matches);}
  }),{threshold:.12,rootMargin:'0px 0px -35px 0px'});
  if(!reduced.matches&&Element.prototype.animate){heading.classList.add('projects-heading-ready');headingReveal.observe(headingTitle);headingReveal.observe(headingBody);}
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
  }),{threshold:.10,rootMargin:'0px 0px -24px 0px'});
  if(!reduced.matches){gallery.classList.add('projects-ready');cards.forEach(el=>reveal.observe(el));}
  function revealAt(position){
    [headingTitle,headingBody].forEach(part=>{const top=part.getBoundingClientRect().top+scrollY-position;
      if(top<innerHeight&&top+part.offsetHeight>0&&!part.dataset.revealed){headingReveal.unobserve(part);revealHeading(part,true);}
    });
    cards.forEach(card=>{const top=card.getBoundingClientRect().top+scrollY-position;
      if(top<innerHeight&&top+card.offsetHeight>0){card.classList.add('is-visible','is-restored');reveal.unobserve(card);}
    });
  }
  reduced.addEventListener('change',()=>{if(reduced.matches){folds.forEach(fold=>fold.reset());headingAnimations.forEach(animation=>animation.cancel());headingAnimations.clear();headingReveal.disconnect();gallery.classList.remove('projects-ready');heading.classList.remove('projects-heading-ready');cards.forEach(card=>card.classList.add('is-visible'));}},{signal:events.signal});
  fine.addEventListener('change',()=>{if(!fine.matches){folds.forEach(fold=>fold.reset());cards.forEach(card=>card.classList.remove('is-selected'));}},{signal:events.signal});
  window.PortfolioProjectsUI={revealAt};
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();folds.forEach(fold=>fold.reset());headingAnimations.forEach(animation=>animation.cancel());headingAnimations.clear();headingReveal.disconnect();reveal.disconnect();},{once:true});
})();
