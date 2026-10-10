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
  heading.classList.add('projects-heading-ready');gallery.classList.add('projects-ready');
  const entrance=window.PortfolioScrollReveal.create([
    {nodes:headingWords,anchor:headingTitle,duration:680,stagger:70,opacity:.001,y:10,blur:4,visibleClass:'is-heading-word-visible'},
    {nodes:[headingBody],duration:750,y:35,visibleClass:'is-heading-body-visible'},
    ...cards.map(card=>({nodes:[card.querySelector('.project-stage')],anchor:card,duration:950,y:70,scale:.98,blur:8,start:.95,end:.48}))
  ]);
  function revealAt(position){
    entrance.measure();entrance.renderAt(position);
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)folds.forEach(fold=>fold.reset());},{signal:events.signal});
  fine.addEventListener('change',()=>{if(!fine.matches){folds.forEach(fold=>fold.reset());cards.forEach(card=>card.classList.remove('is-selected'));}},{signal:events.signal});
  window.PortfolioProjectsUI={revealAt};
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();folds.forEach(fold=>fold.reset());entrance.dispose();},{once:true});
})();
