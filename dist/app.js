(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,$=s=>document.querySelector(s);
  document.body.classList.add('js-ready');
  const header=$('.header'),menu=$('#mobile-nav'),toggle=$('.menu-toggle'),dialog=$('.case-dialog'),pages=$('.case-pages');
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');reveal.unobserve(e.target);}}),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(e=>reveal.observe(e));
  const sections=[...document.querySelectorAll('main .section')];let scrollFrame=false;
  function updateHome(){header.classList.toggle('scrolled',scrollY>60);let active=sections[0];sections.forEach(e=>{if(e.getBoundingClientRect().top<innerHeight*.45)active=e;});document.querySelectorAll('.section-rail a,.nav a').forEach(a=>{const match=a.hash==='#'+active.id;a.classList.toggle('active',match);if(match)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scrollFrame=false;}
  addEventListener('scroll',()=>{if(!scrollFrame){scrollFrame=true;requestAnimationFrame(updateHome);}},{passive:true});updateHome();
  let menuTimer,menuHoverTimer;const menuBackground=$('main'),menuRail=$('.section-rail');
  const menuHover=matchMedia('(min-width: 721px) and (hover: hover) and (pointer: fine)');
  function setMenu(open){
    clearTimeout(menuTimer);clearTimeout(menuHoverTimer);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'关闭菜单':'打开菜单');$('.menu-label').textContent=open?'Close':'Menu';
    menuBackground.inert=open;if(menuRail)menuRail.inert=open;
    if(open){menu.hidden=false;menu.inert=false;void menu.offsetWidth;document.body.classList.add('menu-open');}
    else{document.body.classList.remove('menu-open');if(menu.contains(document.activeElement))toggle.focus({preventScroll:true});menu.inert=true;menuTimer=setTimeout(()=>{menu.hidden=true;},reduced?0:660);}
  }
  function closeMenu(){setMenu(false);}
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
  function hoverMenu(event){
    if(!menuHover.matches||event.pointerType==='touch'||window.portfolioIntroLocked||dialog.open)return;
    clearTimeout(menuHoverTimer);if(toggle.getAttribute('aria-expanded')!=='true')setMenu(true);
  }
  function leaveMenu(event){
    if(!menuHover.matches||event.pointerType==='touch')return;
    if(event.relatedTarget&&(toggle.contains(event.relatedTarget)||menu.contains(event.relatedTarget)))return;
    // A small grace period lets the pointer cross into the expanding surface.
    clearTimeout(menuHoverTimer);menuHoverTimer=setTimeout(()=>{
      if(!toggle.matches(':hover')&&!menu.matches(':hover')&&!menu.contains(document.activeElement))closeMenu();
    },220);
  }
  [toggle,menu].forEach(node=>{node.addEventListener('mouseenter',hoverMenu);node.addEventListener('mouseleave',leaveMenu);});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('click',e=>{if(toggle.getAttribute('aria-expanded')==='true'&&!menu.contains(e.target)&&!toggle.contains(e.target))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();setCaseMenu(false);}});
  const caseMenu=$('.case-menu'),caseSummary=caseMenu.querySelector('summary');let caseMenuTimer;
  function setCaseMenu(open){clearTimeout(caseMenuTimer);caseSummary.setAttribute('aria-expanded',String(open));caseMenu.querySelector('div').inert=!open;
    if(open){caseMenu.open=true;requestAnimationFrame(()=>caseMenu.classList.add('menu-expanded'));}
    else{caseMenu.classList.remove('menu-expanded');caseMenuTimer=setTimeout(()=>caseMenu.open=false,reduced?0:450);}}
  caseSummary.setAttribute('aria-expanded','false');caseSummary.addEventListener('click',e=>{e.preventDefault();setCaseMenu(caseSummary.getAttribute('aria-expanded')!=='true');});
  dialog.addEventListener('click',e=>{if(!caseMenu.contains(e.target))setCaseMenu(false);});
  // Native looping keeps playback reliable when switching tabs or opening a case.
  const video=$('.bg-video');let paused=reduced;
  let introVideoWaiting=!!window.portfolioIntroLocked;
  const motion=$('.motion-toggle');
  function motionLabel(){motion.innerHTML=paused?'播放动画 <span>▶</span>':'暂停动画 <span>Ⅱ</span>';motion.setAttribute('aria-label',paused?'播放背景动画':'暂停背景动画');}
  function pauseVideo(){video.pause();}
  async function playVideo(){try{await video.play();paused=false;motionLabel();}catch(error){if(error.name!=='AbortError'){paused=true;motionLabel();}}}
  video.muted=true;video.loop=true;video.addEventListener('playing',()=>video.classList.add('video-ready'));
  function startIntroVideo(){if(!introVideoWaiting)return;introVideoWaiting=false;
    if(video.currentTime>.01)video.currentTime=0;if(!paused&&!dialog.open)playVideo();}
  addEventListener('portfolio:light-reveal',startIntroVideo);
  addEventListener('portfolio:intro-complete',startIntroVideo);
  addEventListener('portfolio:intro-timeout',startIntroVideo);
  if(reduced||introVideoWaiting)pauseVideo();else playVideo();motionLabel();
  motion.addEventListener('click',()=>{if(paused)playVideo();else{paused=true;pauseVideo();motionLabel();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseVideo();else if(!introVideoWaiting&&!paused&&!dialog.open)playVideo();});
  let toastTimer;function toast(text){const e=$('.toast');e.textContent=text;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),3000);}
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('微信号已复制：'+b.dataset.copy);}catch{toast('微信号：'+b.dataset.copy+'，请长按复制');}}));
  window.PortfolioProjectBrowser.init({dialog,pages,reduced,toast,closeMenu,setCaseMenu,pauseVideo,
    resumeVideo(){if(!paused)playVideo();},updateHome});
})();
