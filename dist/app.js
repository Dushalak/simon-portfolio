(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,$=s=>document.querySelector(s);
  document.body.classList.add('js-ready');
  const header=$('.header'),menu=$('#mobile-nav'),toggle=$('.menu-toggle'),dialog=$('.case-dialog'),pages=$('.case-pages');
  const projects={
    nelu:{title:'Nelu AI',category:'AI AGENT / MOBILE EXPERIENCE',subtitle:'让陪伴，有了新的形态。',cover:'assets/nelu-hero.webp',groups:[
      {title:'项目概览',heading:'从 AI 对话，到有温度的陪伴',text:'以 AI 小猫为情感入口，连接智能对话、阅读与日常互动，建立产品的核心体验。',indices:[0,1]},
      {title:'研究与策略',heading:'先理解需求，再定义体验',text:'从项目流程与前期调研出发，明确用户场景、体验目标与设计方向。',indices:[2,3]},
      {title:'产品体验',heading:'让角色、界面与交互一起表达',text:'将 IP 视觉、注册登录、昼夜切换、阅读反馈与小猫派遣串联成完整体验。',indices:[4,5,6,7,8,9,10,11,12,13]},
      {title:'复盘与沉淀',heading:'从这一次设计，走向下一次',text:'整理设计过程中的判断与经验，回顾视觉和产品体验的落地。',indices:[14,15]}]},
    yuxu:{title:'予序 · Yuxu',category:'AI SOCIAL / PRODUCT REDESIGN',subtitle:'予奇遇，序写新程。',cover:'assets/yuxu-hero.webp',groups:[
      {title:'项目概览',heading:'围绕 AI 角色，重新组织相遇',text:'通过页面通览与迭代分析，梳理予序的产品场景与体验问题。',indices:[0,1]},
      {title:'设计策略',heading:'让信息结构支撑自然的互动',text:'从设计目标、风格推导到框架与原型，建立一致的体验方向。',indices:[2,3]},
      {title:'界面迭代',heading:'把每一个关键路径设计清楚',text:'逐步呈现首页、列表、对话、个人中心、充值与弹窗的界面迭代。',indices:[4,5,6,7,8,9]},
      {title:'项目复盘',heading:'回看变化背后的设计判断',text:'总结本次项目迭代的思路与经验。',indices:[10]}]},
    qingyu:{title:'晴雨 · Qingyu',category:'E-COMMERCE / ENTERPRISE PLATFORM',subtitle:'让复杂业务，清晰运转。',cover:'assets/qingyu-hero.webp',groups:[
      {title:'项目概览',heading:'连接电商业务与工作效率',text:'理解电商智配中枢的业务背景与设计场景。',indices:[0]},
      {title:'研究与规范',heading:'从用户任务，到一致的设计语言',text:'结合用户调研、设计目标与视觉规范，建立后台界面的设计基础。',indices:[1,2,3]},
      {title:'业务界面',heading:'让数据与操作各就其位',text:'展示首页、报表及各业务页面，梳理信息层级与操作路径。',indices:[4,5,6,7,8]},
      {title:'设计总结',heading:'回归业务中的真实体验',text:'回顾项目设计的完整表达与落地。',indices:[9]}]},
    aigc:{title:'AIGC · Visuals',category:'CREATIVE EXPLORATION / VISUAL DESIGN',subtitle:'把想象力，变成看得见的表达。',cover:'assets/aigc-hero.webp',groups:[
      {title:'前期探索',heading:'从一个想法，展开视觉可能',text:'梳理创作方向与前期准备，探索生成式工具在设计中的应用。',indices:[0]},
      {title:'视觉落地',heading:'把生成结果转译成设计作品',text:'结合创意表达与页面设计，将 AIGC 素材应用到运营视觉。',indices:[1]},
      {title:'设计沉淀',heading:'让创作成为可持续的工作流',text:'整理创作经验与方法，为后续视觉探索积累思路。',indices:[2]}]}
  };
  const dataReady=fetch('assets/projects.json').then(r=>{if(!r.ok)throw Error();return r.json();});dataReady.catch(()=>{});
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');reveal.unobserve(e.target);}}),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(e=>reveal.observe(e));
  const sections=[...document.querySelectorAll('main .section')];let scrollFrame=false;
  function updateHome(){header.classList.toggle('scrolled',scrollY>60);let active=sections[0];sections.forEach(e=>{if(e.getBoundingClientRect().top<innerHeight*.45)active=e;});document.querySelectorAll('.section-rail a,.nav a').forEach(a=>{const match=a.hash==='#'+active.id;a.classList.toggle('active',match);if(match)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});scrollFrame=false;}
  addEventListener('scroll',()=>{if(!scrollFrame){scrollFrame=true;requestAnimationFrame(updateHome);}},{passive:true});updateHome();
  let menuTimer;const menuBackground=$('main'),menuRail=$('.section-rail');
  function setMenu(open){
    clearTimeout(menuTimer);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'关闭菜单':'打开菜单');$('.menu-label').textContent=open?'Close':'Menu';
    menuBackground.inert=open;if(menuRail)menuRail.inert=open;
    if(open){menu.hidden=false;menu.inert=false;void menu.offsetWidth;document.body.classList.add('menu-open');}
    else{document.body.classList.remove('menu-open');if(menu.contains(document.activeElement))toggle.focus({preventScroll:true});menu.inert=true;menuTimer=setTimeout(()=>{menu.hidden=true;},reduced?0:660);}
  }
  function closeMenu(){setMenu(false);}
  toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
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
  let currentCase=null,lastTrigger=null,homeScroll=0,homeHash='#nelu',caseRequest=0,caseFrame=false;
  let activeTransition;
  async function transition(change,direction='enter',origin=null){
    if(activeTransition)await activeTransition;
    document.documentElement.dataset.transition=direction;
    const artwork=origin?.closest('.project')?.querySelector('.project-art')||origin;
    const image=direction==='switch'?null:artwork?.querySelector('img');
    const cover=$('.case-cover');
    if(image&&!dialog.open)image.style.viewTransitionName='project-cover';
    if(dialog.open)cover.style.viewTransitionName='project-cover';
    let applied=false;const apply=()=>{if(!applied){applied=true;if(image)image.style.viewTransitionName='';cover.style.viewTransitionName='';change();if(dialog.open)cover.style.viewTransitionName='project-cover';else if(image)image.style.viewTransitionName='project-cover';}};
    const run=async()=>{
      try{if(!reduced&&document.startViewTransition){const t=document.startViewTransition(apply);await t.finished.catch(()=>apply());}
      else{apply();if(!reduced){const target=dialog.open?dialog:document.querySelector('main');await target.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:600,easing:'cubic-bezier(.22,1,.36,1)'}).finished;}}}
      finally{if(image)image.style.viewTransitionName='';$('.case-cover').style.viewTransitionName='';delete document.documentElement.dataset.transition;}
    };activeTransition=run();await activeTransition;activeTransition=null;
  }
  function updateCase(){
    if(!dialog.open){caseFrame=false;return;}const groups=[...pages.querySelectorAll('.case-group')];let active=0;
    groups.forEach((g,i)=>{if(g.getBoundingClientRect().top<=innerHeight*.38)active=i;});
    document.querySelectorAll('.chapter-card').forEach((b,i)=>{const selected=i===active;b.classList.toggle('active',selected);b.setAttribute('aria-expanded',String(selected));if(selected)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    const start=$('.case-layout').offsetTop,distance=dialog.scrollHeight-dialog.clientHeight-start;
    const percent=Math.round(Math.max(0,Math.min(1,(dialog.scrollTop-start)/Math.max(1,distance)))*100);$('.progress-value').textContent=percent+'%';$('.progress-track i').style.width=percent+'%';caseFrame=false;
  }
  dialog.addEventListener('scroll',()=>{if(!caseFrame){caseFrame=true;requestAnimationFrame(updateCase);}},{passive:true});
  async function openCase(key,trigger,push=true){
    if(!projects[key])return;const request=++caseRequest;let data;try{data=await dataReady;}catch{toast('作品暂未加载成功，请稍后重试。');return;}if(request!==caseRequest)return;
    if(!dialog.open){homeScroll=location.hash.startsWith('#project/')?Math.max(0,$('#'+key).offsetTop-86):scrollY;homeHash=location.hash.startsWith('#project/')?'#'+key:(location.hash||'#nelu');lastTrigger=trigger||document.querySelector('[data-open="'+key+'"]');}
    const project=projects[key],fragment=document.createDocumentFragment(),navigation=document.createDocumentFragment();
    project.groups.forEach((group,i)=>{
      const section=document.createElement('section');section.className='case-group';section.id='chapter-'+key+'-'+i;const heading=document.createElement('h3');heading.textContent=group.title;section.append(heading);
      group.indices.forEach(index=>{const page=data[key][index];if(!page)return;const figure=document.createElement('figure'),img=document.createElement('img');img.src=page.src;img.alt=page.label;img.width=page.width;img.height=page.height;img.loading=index<2?'eager':'lazy';figure.append(img);section.append(figure);});fragment.append(section);
      const button=document.createElement('button');button.className='chapter-card';button.setAttribute('aria-controls',section.id);const label=document.createElement('span');label.className='chapter-label';label.textContent=String(i+1).padStart(2,'0')+' / '+group.title;
      const summary=document.createElement('div');summary.className='chapter-summary';const title=document.createElement('strong');title.textContent=group.heading;const text=document.createElement('p');text.textContent=group.text;summary.append(title,text);button.append(label,summary);
      button.addEventListener('click',()=>dialog.scrollTo({top:dialog.scrollTop+section.getBoundingClientRect().top-(innerWidth<=720?185:110),behavior:reduced?'instant':'smooth'}));navigation.append(button);
    });closeMenu();setCaseMenu(false);if(push)history.pushState({project:key},'','#project/'+key);
    await transition(()=>{currentCase=key;$('#case-title').textContent=project.title;$('.case-category').textContent=project.category;$('.case-subtitle').textContent=project.subtitle;const cover=document.createElement('img');cover.src=project.cover;cover.alt=project.title+' 项目展示';$('.case-cover').replaceChildren(cover);$('.case-cover').classList.toggle('is-nelu',key==='nelu');pages.replaceChildren(fragment);$('.case-navigation').replaceChildren(navigation);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;pauseVideo();document.title=project.title+' · 金王亮设计作品集';updateCase();},dialog.open?'switch':'enter',lastTrigger);
  }
  async function dismissCase(){if(!dialog.open)return;caseRequest++;await transition(()=>{dialog.close();currentCase=null;document.title='金王亮 · UI/UX 设计作品集';window.scrollTo({top:homeScroll,behavior:'instant'});},'return',lastTrigger);lastTrigger?.focus({preventScroll:true});if(!paused)playVideo();updateHome();}
  function returnHome(){if(!dialog.open)return;if(history.state?.project)history.back();else{history.replaceState(null,'',homeHash);dismissCase();}}
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openCase(b.dataset.open,b)));document.querySelectorAll('.case-close').forEach(b=>b.addEventListener('click',returnHome));dialog.addEventListener('cancel',e=>{e.preventDefault();returnHome();});
  document.querySelectorAll('[data-case-switch]').forEach(b=>b.addEventListener('click',()=>{history.replaceState({project:b.dataset.caseSwitch},'','#project/'+b.dataset.caseSwitch);openCase(b.dataset.caseSwitch,null,false);}));
  $('.next-case').addEventListener('click',()=>{const keys=Object.keys(projects),next=keys[(keys.indexOf(currentCase)+1)%keys.length];history.replaceState({project:next},'','#project/'+next);openCase(next,null,false);});
  function route(){const key=location.hash.match(/^#project\/(\w+)$/)?.[1];if(projects[key])openCase(key,null,false);else dismissCase();}addEventListener('popstate',route);addEventListener('hashchange',()=>{const key=location.hash.match(/^#project\/(\w+)$/)?.[1];if(projects[key]&&!dialog.open)openCase(key,null,false);});if(location.hash.startsWith('#project/'))route();
})();


