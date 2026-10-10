/* Existing hash routes and case chapter data, with a reversible scroll hero. */
(() => {
  window.PortfolioProjectBrowser={init({dialog,pages,reduced,toast,closeMenu,setCaseMenu,pauseVideo,resumeVideo,updateHome}){
    const projects=window.PortfolioProjects,events=new AbortController();
    const $=selector=>dialog.querySelector(selector),clamp=value=>Math.max(0,Math.min(1,value));
    const preference=matchMedia('(prefers-reduced-motion:reduce)');
    const dataReady=fetch('assets/projects.json').then(response=>{if(!response.ok)throw Error('Case assets unavailable');return response.json();});dataReady.catch(()=>{});
    let currentCase=null,lastTrigger=null,homeScroll=0,homeHash='#nelu',busy=false,queued,frame=0,contentAnimations=[];
    let homeAnchor=null,homeOffset=0,homeWidth=innerWidth,homeHeight=innerHeight;
    const homeRecord=()=>({scroll:homeScroll,hash:homeHash,anchor:homeAnchor,offset:homeOffset,width:homeWidth,height:homeHeight});
    function resizeHomePosition(){
      if(homeWidth===innerWidth&&homeHeight===innerHeight)return;
      const anchor=document.getElementById(homeAnchor);
      if(anchor)homeScroll=Math.max(0,anchor.getBoundingClientRect().top+scrollY-homeOffset);
      homeWidth=innerWidth;homeHeight=innerHeight;
    }
    function restoreHome(){window.PortfolioProjectsUI?.revealAt(homeScroll);window.scrollTo({top:homeScroll,behavior:'instant'});}
    function entrance(){
      contentAnimations.forEach(animation=>animation.cancel());contentAnimations=[];dialog.classList.remove('case-preparing');
      if(preference.matches)return;
      dialog.querySelectorAll('[data-case-entry]').forEach((el,index)=>{
        const animation=el.animate([{opacity:0,transform:'translate3d(0,24px,0)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],
          {duration:760,delay:index*120,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
        contentAnimations.push(animation);
      });
    }
    function updateCase(){
      frame=0;if(!dialog.open)return;
      const travel=Math.max(1,dialog.clientHeight*.86),progress=clamp(dialog.scrollTop/travel);
      const p=preference.matches?0:progress;dialog.dataset.heroProgress=progress.toFixed(4);
      $('.case-scroll-title').style.transform=`translate3d(0,${p*115}px,0) scale(${1-p*.08})`;
      $('.case-scroll-meta').style.transform=`translate3d(0,${p*65}px,0)`;
      dialog.querySelectorAll('.case-scroll-copy').forEach((el,index)=>{el.style.transform=`translate3d(0,${p*(125+index*18)}px,0)`;});
      const image=$('.case-cover img');if(image)image.style.transform=`scale(${1+(1-p)*.025})`;
      let active=0;[...pages.querySelectorAll('.case-group')].forEach((group,index)=>{if(group.getBoundingClientRect().top<=innerHeight*.38)active=index;});
      dialog.querySelectorAll('.chapter-card').forEach((button,index)=>{const selected=index===active;button.classList.toggle('active',selected);button.setAttribute('aria-expanded',String(selected));if(selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
      const start=$('.case-layout').offsetTop,distance=dialog.scrollHeight-dialog.clientHeight-start;
      const percent=Math.round(clamp((dialog.scrollTop-start)/Math.max(1,distance))*100);$('.progress-value').textContent=percent+'%';$('.progress-track i').style.width=percent+'%';
    }
    const request=()=>{if(!frame)frame=requestAnimationFrame(updateCase);};
    dialog.addEventListener('scroll',request,{passive:true,signal:events.signal});addEventListener('resize',request,{passive:true,signal:events.signal});
    function build(key,data){
      const project=projects[key],fragment=document.createDocumentFragment(),navigation=document.createDocumentFragment(),firstImages=[];
      project.groups.forEach((group,i)=>{
        const section=document.createElement('section');section.className='case-group';section.id='chapter-'+key+'-'+i;
        const heading=document.createElement('h3');heading.textContent=group.title;section.append(heading);
        group.indices.forEach(index=>{const page=data[key][index];if(!page)return;
          const figure=document.createElement('figure'),img=document.createElement('img');img.src=page.src;img.alt=page.label;img.width=page.width;img.height=page.height;img.loading=index<2?'eager':'lazy';img.decoding='async';figure.append(img);section.append(figure);if(index<2)firstImages.push(img);
        });fragment.append(section);
        const button=document.createElement('button');button.className='chapter-card';button.setAttribute('aria-controls',section.id);
        const label=document.createElement('span');label.className='chapter-label';label.textContent=String(i+1).padStart(2,'0')+' / '+group.title;
        const summary=document.createElement('div');summary.className='chapter-summary';const title=document.createElement('strong');title.textContent=group.heading;const text=document.createElement('p');text.textContent=group.text;summary.append(title,text);button.append(label,summary);
        button.addEventListener('click',()=>dialog.scrollTo({top:dialog.scrollTop+section.getBoundingClientRect().top-(innerWidth<=720?185:110),behavior:preference.matches?'instant':'smooth'}));navigation.append(button);
      });
      const cover=document.createElement('img');cover.src=project.cover;cover.alt=project.title+' 项目主视觉';cover.width=1600;cover.height=1200;
      return {fragment,navigation,cover,ready:Promise.allSettled([cover,...firstImages].map(img=>img.decode?.()))};
    }
    function flush(){if(queued!==undefined){const key=queued;queued=undefined;if(key&&key!==currentCase)openCase(key,null,false);else if(!key&&dialog.open)dismissCase();}}
    async function openCase(key,trigger,push=true){
      if(!projects[key]||busy||currentCase===key&&dialog.open)return;
      busy=true;trigger?.setAttribute('aria-busy','true');
      try{
        const data=await dataReady,content=build(key,data);await content.ready;
        if(queued!==undefined&&queued!==key)return;
        if(queued===key)queued=undefined;
        const switching=dialog.open;
        if(!switching){
          const saved=history.state?.portfolioHome;
          homeScroll=push?scrollY:(saved?.scroll??Math.max(0,document.getElementById(key).getBoundingClientRect().top+scrollY-95));
          homeHash=push?(location.hash||'#nelu'):(saved?.hash??'#'+key);
          lastTrigger=trigger||document.querySelector('[data-open="'+key+'"]');
          homeAnchor=push?key:(saved?.anchor??key);
          homeOffset=push?document.getElementById(key).getBoundingClientRect().top:(saved?.offset??document.getElementById(homeAnchor).getBoundingClientRect().top+scrollY-homeScroll);
          homeWidth=push?innerWidth:(saved?.width??innerWidth);homeHeight=push?innerHeight:(saved?.height??innerHeight);resizeHomePosition();
        }
        closeMenu();setCaseMenu(false);
        if(push){history.replaceState({...history.state,portfolioHome:homeRecord()},'',location.href);history.pushState({project:key,portfolioHome:homeRecord(),portfolioReturn:true},'','#project/'+key);}
        else if(switching&&location.hash!=='#project/'+key)history.replaceState({...history.state,project:key,portfolioHome:homeRecord()},'','#project/'+key);
        await window.PortfolioPageTransition.run(()=>{
          contentAnimations.forEach(animation=>animation.cancel());dialog.classList.add('case-preparing');
          currentCase=key;$('#case-title').textContent=projects[key].title;$('.case-category').textContent=projects[key].category;
          $('.case-summary').textContent=projects[key].description;$('.case-subtitle').textContent=projects[key].subtitle;
          $('.case-cover').replaceChildren(content.cover);$('.case-cover').classList.remove('is-nelu');pages.replaceChildren(content.fragment);$('.case-navigation').replaceChildren(content.navigation);
          if(!dialog.open)dialog.showModal();dialog.scrollTop=0;pauseVideo();document.title=projects[key].title+' · 金王亮设计作品集';updateCase();
        },{direction:switching?'switch':'enter',dialog,homeScroll});
        entrance();$('.back-home').focus({preventScroll:true});
      }catch(error){dialog.classList.remove('case-preparing');toast('作品暂未加载成功，请稍后重试。');}
      finally{busy=false;trigger?.removeAttribute('aria-busy');flush();}
    }
    async function dismissCase(){
      if(!dialog.open||busy)return;busy=true;
      try{
        if(homeWidth!==innerWidth||homeHeight!==innerHeight)await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        resizeHomePosition();
        await window.PortfolioPageTransition.run(()=>{
          dialog.close();currentCase=null;document.title='金王亮 · UI/UX 设计作品集';restoreHome();
          history.replaceState({...history.state,portfolioHome:homeRecord()},'',location.href);
        },{direction:'return',dialog,homeScroll});
        dialog.classList.remove('case-preparing');lastTrigger?.focus({preventScroll:true});resumeVideo();updateHome();
      }finally{busy=false;flush();}
    }
    function returnHome(){
      if(!dialog.open||busy)return;
      if(history.state?.portfolioReturn)history.back();
      else{history.replaceState({portfolioHome:homeRecord()},'',homeHash);dismissCase();}
    }
    document.querySelectorAll('[data-open]').forEach(link=>link.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();if(!busy)openCase(link.dataset.open,link,true);
    },{signal:events.signal}));
    dialog.querySelectorAll('.case-close').forEach(button=>button.addEventListener('click',returnHome,{signal:events.signal}));
    dialog.addEventListener('cancel',event=>{event.preventDefault();returnHome();},{signal:events.signal});
    dialog.querySelectorAll('[data-case-switch]').forEach(button=>button.addEventListener('click',()=>{if(!busy){history.replaceState({...history.state,project:button.dataset.caseSwitch},'','#project/'+button.dataset.caseSwitch);openCase(button.dataset.caseSwitch,null,false);}},{signal:events.signal}));
    $('.next-case').addEventListener('click',()=>{if(busy)return;const keys=Object.keys(projects),next=keys[(keys.indexOf(currentCase)+1)%keys.length];history.replaceState({...history.state,project:next},'','#project/'+next);openCase(next,null,false);},{signal:events.signal});
    function route(){const match=location.hash.match(/^#project\/(\w+)$/)?.[1],key=projects[match]?match:null;if(busy){queued=key;return;}if(key)openCase(key,null,false);else dismissCase();}
    addEventListener('popstate',route,{signal:events.signal});addEventListener('hashchange',route,{signal:events.signal});
    preference.addEventListener('change',request,{signal:events.signal});
    if(location.hash.startsWith('#project/'))route();
    addEventListener('pagehide',event=>{if(event.persisted)return;events.abort();cancelAnimationFrame(frame);contentAnimations.forEach(animation=>animation.cancel());},{once:true});
  }};
})();
