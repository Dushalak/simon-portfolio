(() => {
  const section=document.querySelector('#what-i-bring');
  if(!section)return;
  const tools=[
    ['Figma','figma.svg','#222',false],
    ['ProtoPie','protopie.webp','#fff',false],
    ['Cinema 4D','cinema4d.svg','#fff',false],
    ['OpenAI','openai.svg','#fff',false],
    ['Claude','claude.svg','#faf3e8',false],
    ['Google AI Studio','google-ai-studio.webp','#fff',false],
    ['Adobe Photoshop','photoshop.svg','#001e36',true],
    ['Adobe Premiere Pro','premierepro.svg','#00005b',true],
    ['Adobe After Effects','aftereffects.svg','#00005b',true],
    ['Adobe Illustrator','illustrator.svg','#330000',true]
  ].map(([name,file,bg,full])=>({name,src:'assets/icons/tools/'+file,bg,full,tip:name}));
  const list=section.querySelector('.bring-tools');
  const fragment=document.createDocumentFragment();
  tools.forEach(tool=>{
    const item=document.createElement('li');item.className='bring-tool-item';item.dataset.bringEnter='tool';
    const icon=document.createElement('span');icon.className='bring-tool-link';icon.style.setProperty('--tool-bg',tool.bg);
    const img=new Image();img.dataset.src=tool.src;img.alt=tool.name;img.width=60;img.height=60;img.loading='lazy';img.decoding='async';if(tool.full)img.className='tool-full';
    window.PortfolioAssets.observe(img,section);
    const tip=document.createElement('span');tip.className='bring-tool-tip';tip.textContent=tool.tip;tip.setAttribute('aria-hidden','true');
    icon.append(img,tip);item.append(icon);fragment.append(item);
  });
  list.append(fragment);
  const events=new AbortController(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const cards=[...section.querySelectorAll('.bring-card-stage')],items=[...list.children];
  const mobile=matchMedia('(max-width:720px), (pointer:coarse)').matches;
  const quality=mobile?'mobile':window.PortfolioHeroPerformance.profile.tier;
  const distance=quality==='high'?24:quality==='mobile'||quality==='low'?10:16;
  section.dataset.bringQuality=quality;
  // Cache stationary anchors once; scroll frames only sample opacity and transform.
  cards.forEach(card=>{const shell=document.createElement('div');shell.className='bring-card-anchor';shell.style.setProperty('--bring-order',card.style.getPropertyValue('--bring-order'));card.before(shell);shell.append(card);});
  section.classList.add('bring-ready');
  const entrance=window.PortfolioScrollReveal.create([
    {nodes:[section.querySelector('.bring-title-primary')],y:distance,start:1,end:.76,opacity:.35},
    {nodes:items,anchor:list,stagger:quality==='high'?20:0,y:distance*.5,start:1,end:.76,opacity:.35},
    {nodes:[section.querySelector('.bring-title-secondary')],y:distance,start:1,end:.76,opacity:.35},
    {nodes:[section.querySelector('.bring-statement')],y:distance*.5,start:1,end:.8,opacity:.55},
    {nodes:[section.querySelector('.bring-description')],y:distance*.5,start:1,end:.8,opacity:.55},
    {nodes:[section.querySelector('.bring-action')],y:distance*.5,start:1,end:.8,opacity:.55},
    ...cards.map(card=>({nodes:[card],anchor:card.parentElement,y:distance*1.25,start:1,end:.66,opacity:.35}))
  ],{root:section,simple:true});
  function neighbors(index){items.forEach((item,i)=>item.classList.toggle('is-neighbor',index>=0&&Math.abs(index-i)===1));}
  items.forEach((item,i)=>{item.addEventListener('pointerenter',()=>neighbors(i),{signal:events.signal});item.addEventListener('pointerleave',()=>neighbors(-1),{signal:events.signal});item.addEventListener('focusin',()=>neighbors(i),{signal:events.signal});item.addEventListener('focusout',()=>neighbors(-1),{signal:events.signal});});
  section.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.getElementById(link.hash.slice(1));if(!target)return;
    event.preventDefault();history.pushState(null,'',link.hash);target.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
  },{signal:events.signal}));
  addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();entrance.dispose();},{signal:events.signal});
})();
