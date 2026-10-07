(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('js-ready');
  const header = document.querySelector('.header');
  const video = document.querySelector('.bg-video');
  const motion = document.querySelector('.motion-toggle');
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  const dialog = document.querySelector('.case-dialog');
  const pages = document.querySelector('.case-pages');
  const titles = {nelu:'Nelu AI · 0—1 体验视觉设计',yuxu:'予序 · AI 社交体验迭代',qingyu:'晴雨 · 电商智配中枢',aigc:'AIGC · 运营视觉探索'};
  let projectData;
  let lastTrigger;
  let toastTimer;
  const dataReady = fetch('assets/projects.json').then(r => {if (!r.ok) throw new Error('资源暂不可用'); return r.json();}).then(data => projectData = data);
  // Keep rejected fetches handled until an actual case is requested.
  dataReady.catch(() => {});
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {if(e.isIntersecting){e.target.classList.add('is-visible');reveal.unobserve(e.target);}}), {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));
  const links = [...document.querySelectorAll('.section-rail a')];
  const sections = [...document.querySelectorAll('main .section')];
  let scheduled = false;
  const updateScroll = () => {
    header.classList.toggle('scrolled',scrollY>60);
    const middle = innerHeight*.45;
    let active = sections[0];
    for (const section of sections) if(section.getBoundingClientRect().top<=middle) active=section;
    links.forEach(link=>{const current=link.hash==='#'+active.id;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    const navId=['nelu','yuxu','qingyu','aigc'].includes(active.id)?'nelu':active.id;
    document.querySelectorAll('.nav a').forEach(link=>{const current=link.hash==='#'+navId;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    scheduled=false;
  };
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateScroll);}}, {passive:true});
  updateScroll();
  const updateClock=()=>document.querySelector('#local-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  updateClock();setInterval(updateClock,30000);
  function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','打开导航');}
  toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'关闭导航':'打开导航');});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))closeMenu();});
  addEventListener('resize',()=>{if(innerWidth>720)closeMenu();});
  let paused=reduced;
  function motionLabel(){motion.innerHTML=paused?'播放动画 <span>▶</span>':'暂停动画 <span>Ⅱ</span>';motion.setAttribute('aria-label',paused?'播放背景动画':'暂停背景动画');}
  if(reduced)video.pause();
  motionLabel();
  motion.addEventListener('click',async()=>{if(paused){video.style.display='block';try{await video.play();paused=false;}catch{showToast('背景视频暂不可用，仍可浏览作品');}}else{video.pause();paused=true;}motionLabel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!paused)video.play().catch(()=>{});});
  video.addEventListener('error',()=>{video.style.opacity='0';paused=true;motionLabel();});
  function showToast(text){const el=document.querySelector('.toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000);}
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);showToast('微信号已复制：'+button.dataset.copy);}catch{showToast('微信号：'+button.dataset.copy+'，请长按复制');}}));
  async function openCase(key,trigger){
    lastTrigger=trigger;
    document.querySelector('#case-title').textContent=titles[key];
    pages.replaceChildren();
    const loading=document.createElement('p');loading.style.cssText='padding:50px;text-align:center;color:#a3a6ad';loading.textContent='正在打开作品…';pages.append(loading);
    const nav=document.querySelector('.case-navigation');nav.replaceChildren();
    dialog.showModal();dialog.scrollTop=0;
    try{
      await dataReady;
      if(!dialog.open)return;
      const fragment=document.createDocumentFragment();
      projectData[key].forEach((page,i)=>{
        const figure=document.createElement('figure');figure.id='case-page-'+i;
        const img=document.createElement('img');img.src=page.src;img.alt=page.label;img.width=page.width;img.height=page.height;img.loading=i<2?'eager':'lazy';figure.append(img);fragment.append(figure);
        const button=document.createElement('button');button.textContent=page.label.replace(/^(AIGC)?\d+/,'');button.addEventListener('click',()=>figure.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'}));nav.append(button);
      });pages.replaceChildren(fragment);
    }catch{loading.textContent='作品暂未加载成功，请关闭后重试。';}
  }
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openCase(button.dataset.open,button)));
  document.querySelectorAll('.case-close').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('close',()=>lastTrigger?.focus({preventScroll:true}));
})();
