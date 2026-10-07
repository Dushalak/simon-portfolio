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
  function clock(){$('#local-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}clock();setInterval(clock,30000);
  function closeMenu(){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','打开菜单');$('.menu-label').textContent='菜单';}
  toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'关闭菜单':'打开菜单');$('.menu-label').textContent=open?'关闭':'菜单';});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!toggle.contains(e.target))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  // Cross-fade two video layers around the loop boundary instead of making a hard cut.
  const videos=[...document.querySelectorAll('.bg-video')];let currentVideo=0,paused=reduced,fading=false;
  const motion=$('.motion-toggle');
  function motionLabel(){motion.innerHTML=paused?'播放动画 <span>▶</span>':'暂停动画 <span>Ⅱ</span>';motion.setAttribute('aria-label',paused?'播放背景动画':'暂停背景动画');}
  function pauseVideo(){videos.forEach(v=>v.pause());}
  async function playVideo(){try{await videos[currentVideo].play();paused=false;motionLabel();}catch{paused=true;motionLabel();}}
  videos.forEach((v,i)=>{v.muted=true;v.addEventListener('playing',()=>v.classList.add('video-ready'));v.addEventListener('timeupdate',async()=>{
    if(i!==currentVideo||paused||fading||document.hidden||dialog.open||!Number.isFinite(v.duration)||v.duration-v.currentTime>Math.min(.9,v.duration*.15))return;
    fading=true;const next=videos[1-i];next.currentTime=0;
    try{await next.play();next.classList.add('scene-active');v.classList.remove('scene-active');currentVideo=1-i;setTimeout(()=>{v.pause();fading=false;},1000);}catch{fading=false;}
  });v.addEventListener('ended',()=>{if(i===currentVideo&&!paused&&!fading){v.currentTime=0;v.play().catch(()=>{});}});});
  if(reduced)pauseVideo();else playVideo();motionLabel();
  motion.addEventListener('click',()=>{if(paused){videos.forEach(v=>v.style.display='block');playVideo();}else{paused=true;pauseVideo();motionLabel();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseVideo();else if(!paused&&!dialog.open)playVideo();});
  let toastTimer;function toast(text){const e=$('.toast');e.textContent=text;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),3000);}
  document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('微信号已复制：'+b.dataset.copy);}catch{toast('微信号：'+b.dataset.copy+'，请长按复制');}}));
  let currentCase=null,lastTrigger=null,homeScroll=0,homeHash='#nelu',caseRequest=0,caseFrame=false;
  function transition(change){if(!reduced&&document.startViewTransition)return document.startViewTransition(change).finished.catch(()=>{});change();return Promise.resolve();}
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
    });closeMenu();$('.case-menu').open=false;if(push)history.pushState({project:key},'','#project/'+key);
    await transition(()=>{currentCase=key;$('#case-title').textContent=project.title;$('.case-category').textContent=project.category;$('.case-subtitle').textContent=project.subtitle;const cover=document.createElement('img');cover.src=project.cover;cover.alt=project.title+' 项目展示';$('.case-cover').replaceChildren(cover);$('.case-cover').classList.toggle('is-nelu',key==='nelu');pages.replaceChildren(fragment);$('.case-navigation').replaceChildren(navigation);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;pauseVideo();document.title=project.title+' · 金王亮设计作品集';updateCase();});
  }
  async function dismissCase(){if(!dialog.open)return;caseRequest++;await transition(()=>{dialog.close();currentCase=null;document.title='金王亮 · UI/UX 设计作品集';window.scrollTo({top:homeScroll,behavior:'instant'});});lastTrigger?.focus({preventScroll:true});if(!paused)playVideo();updateHome();}
  function returnHome(){if(!dialog.open)return;if(history.state?.project)history.back();else{history.replaceState(null,'',homeHash);dismissCase();}}
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openCase(b.dataset.open,b)));document.querySelectorAll('.case-close').forEach(b=>b.addEventListener('click',returnHome));dialog.addEventListener('cancel',e=>{e.preventDefault();returnHome();});
  document.querySelectorAll('[data-case-switch]').forEach(b=>b.addEventListener('click',()=>{history.replaceState({project:b.dataset.caseSwitch},'','#project/'+b.dataset.caseSwitch);openCase(b.dataset.caseSwitch,null,false);}));
  $('.next-case').addEventListener('click',()=>{const keys=Object.keys(projects),next=keys[(keys.indexOf(currentCase)+1)%keys.length];history.replaceState({project:next},'','#project/'+next);openCase(next,null,false);});
  function route(){const key=location.hash.match(/^#project\/(\w+)$/)?.[1];if(projects[key])openCase(key,null,false);else dismissCase();}addEventListener('popstate',route);addEventListener('hashchange',()=>{const key=location.hash.match(/^#project\/(\w+)$/)?.[1];if(projects[key]&&!dialog.open)openCase(key,null,false);});if(location.hash.startsWith('#project/'))route();
})();

