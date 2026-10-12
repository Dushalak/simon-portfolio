(() => {
  const section=document.querySelector('#what-i-bring');
  if(!section)return;
  const tools=[
    ['Figma','figma.svg','https://www.figma.com/','#222',false],
    ['ProtoPie','protopie.webp','https://www.protopie.io/','#fff',false],
    ['Cinema 4D','cinema4d.svg','https://www.maxon.net/en/cinema-4d','#fff',false],
    ['OpenAI','openai.svg','https://openai.com/','#fff',false],
    ['Claude','claude.svg','https://claude.ai/','#faf3e8',false],
    ['Google AI Studio','google-ai-studio.webp','https://aistudio.google.com/','#fff',false],
    ['Adobe Photoshop','photoshop.svg','https://www.adobe.com/products/photoshop.html','#001e36',true],
    ['Adobe Premiere Pro','premierepro.svg','https://www.adobe.com/products/premiere.html','#00005b',true],
    ['Adobe After Effects','aftereffects.svg','https://www.adobe.com/products/aftereffects.html','#00005b',true],
    ['Adobe Illustrator','illustrator.svg','https://www.adobe.com/products/illustrator.html','#330000',true]
  ].map(([name,file,url,bg,full])=>({name,src:'assets/icons/tools/'+file,url,bg,full,tip:name}));
  const list=section.querySelector('.bring-tools');
  const fragment=document.createDocumentFragment();
  tools.forEach(tool=>{
    const item=document.createElement('li');item.className='bring-tool-item';item.dataset.bringEnter='tool';
    const link=document.createElement('a');link.className='bring-tool-link';link.href=tool.url;
    link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',tool.name+' · 打开官网');link.style.setProperty('--tool-bg',tool.bg);
    const img=new Image();img.dataset.src=tool.src;img.alt=tool.name;img.width=60;img.height=60;img.loading='lazy';img.decoding='async';if(tool.full)img.className='tool-full';
    window.PortfolioAssets.observe(img,section);
    const tip=document.createElement('span');tip.className='bring-tool-tip';tip.textContent=tool.tip;tip.setAttribute('aria-hidden','true');
    link.append(img,tip);item.append(link);fragment.append(item);
  });
  list.append(fragment);
  const events=new AbortController(),motion=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width:721px)');
  const cards=[...section.querySelectorAll('.bring-card-stage')],items=[...list.children];
  let visible=false,frame=0,destroyed=false;
  const clamp=v=>Math.max(0,Math.min(1,v));
  // Preserve the entrance keyframes and tool stagger, with a reversible scroll playhead.
  section.classList.add('bring-ready');
  const entrance=window.PortfolioScrollReveal.create([
    {nodes:[section.querySelector('.bring-title-primary')],duration:850,y:54,blur:4},
    {nodes:items,anchor:list,stagger:55,duration:650,y:28,blur:0},
    {nodes:[section.querySelector('.bring-title-secondary')],duration:900,y:54,blur:4},
    {nodes:[section.querySelector('.bring-statement')],duration:700,y:20,blur:3},
    {nodes:[section.querySelector('.bring-description')],duration:700,delay:100,y:18,blur:3},
    {nodes:[section.querySelector('.bring-action')],duration:650,delay:240,y:14,blur:0}
  ]);
  // Use a stationary outer wrapper for progress to keep forward and reverse sampling identical.
  cards.forEach(card=>{const shell=document.createElement('div');shell.className='bring-card-anchor';shell.style.setProperty('--bring-order',card.style.getPropertyValue('--bring-order'));card.before(shell);shell.append(card);});
  function render(){
    frame=0;if(destroyed)return;
    const height=innerHeight,rects=cards.map(card=>card.parentElement.getBoundingClientRect());
    cards.forEach((card,i)=>{
      if(motion.matches){card.style.opacity='1';card.style.transform='none';card.style.filter='none';return;}
      const top=rects[i].top,p=clamp((height*.93-top)/(height*(wide.matches ? .55 : .46))),eased=1-Math.pow(1-p,3);
      const drift=wide.matches?clamp((height*.38-top)/height)*(i<2?7:11):0;
      card.style.opacity=String(clamp(p*2.2));card.style.transform=`translate3d(0,${((1-eased)*70-drift).toFixed(2)}px,0) scale(${(.97+.03*eased).toFixed(4)})`;
      card.style.filter=p>=1?'none':`blur(${((1-eased)*8).toFixed(2)}px)`;
    });
  }
  function request(){if(!frame&&!destroyed)frame=requestAnimationFrame(render);}
  function neighbors(index){items.forEach((item,i)=>item.classList.toggle('is-neighbor',index>=0&&Math.abs(index-i)===1));}
  items.forEach((item,i)=>{item.addEventListener('pointerenter',()=>neighbors(i),{signal:events.signal});item.addEventListener('pointerleave',()=>neighbors(-1),{signal:events.signal});item.addEventListener('focusin',()=>neighbors(i),{signal:events.signal});item.addEventListener('focusout',()=>neighbors(-1),{signal:events.signal});});
  section.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.getElementById(link.hash.slice(1));if(!target)return;
    event.preventDefault();history.pushState(null,'',link.hash);target.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
  },{signal:events.signal}));
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{visible=entry.isIntersecting;request();});},{rootMargin:'0px 0px -12% 0px'});
  observer.observe(section);render();
  addEventListener('scroll',()=>{if(visible)request();},{passive:true,signal:events.signal});
  addEventListener('resize',request,{passive:true,signal:events.signal});
  motion.addEventListener('change',request,{signal:events.signal});
  addEventListener('pageshow',request,{signal:events.signal});
  addEventListener('pagehide',event=>{if(event.persisted)return;destroyed=true;events.abort();observer.disconnect();entrance.dispose();cancelAnimationFrame(frame);},{signal:events.signal});
})();
