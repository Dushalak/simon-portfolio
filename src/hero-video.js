/* The poster paints first. Native video decode is deferred and visibility-driven. */
(() => {
  window.PortfolioHeroVideo={create({video,motion,dialog}){
    const root=video.closest('.hero'),main=document.querySelector('main');
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const events=new AbortController(),options={signal:events.signal};
    const performancePolicy=window.PortfolioHeroPerformance;
    let visible=true,canLoad=false,loaded=false,failed=false,playing=false,alive=true;
    let manualPaused=false,userMotion=false,lastLabel;
    let introWaiting=Boolean(window.portfolioIntroLocked),directSuppressed=Boolean(window.portfolioDirectProject),hadDialog=dialog.open;
    const wanted=()=>!manualPaused&&(!preference.matches||userMotion);
    const blocked=()=>document.hidden||!visible||dialog.open||main.inert||root.dataset.sceneVisible==='false'||directSuppressed;
    function label(){
      const paused=!wanted()||failed;
      if(paused===lastLabel)return;lastLabel=paused;
      motion.innerHTML=paused?'播放动画 <span>▶</span>':'暂停动画 <span>Ⅱ</span>';
      motion.setAttribute('aria-label',paused?'播放背景动画':'暂停背景动画');
    }
    function load(){
      if(loaded)return;loaded=true;
      const source=video.querySelector('source');source.src=performancePolicy.profile.video;
      video.preload='auto';video.load();root.dataset.videoQuality=performancePolicy.profile.tier;
    }
    function pauseVideo(){video.pause();}
    function syncVideo(){
      if(!alive||blocked()||!wanted()||introWaiting||failed){pauseVideo();return;}
      if(!canLoad)return;load();
      if(playing||!video.paused)return;
      playing=true;
      Promise.resolve(video.play()).catch(error=>{
        if(error.name!=='AbortError'){manualPaused=true;label();}
      }).finally(()=>{playing=false;if(alive&&!blocked()&&wanted()&&!introWaiting&&!failed&&video.paused)syncVideo();});
    }
    const cancelLoad=performancePolicy.afterLoadIdle(()=>{canLoad=true;syncVideo();});
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncVideo();});observer.observe(root.querySelector('.hero-stage'));
    const obscured=new MutationObserver(()=>{
      if(dialog.open)hadDialog=true;
      if(hadDialog&&!dialog.open)directSuppressed=false;
      syncVideo();
    });
    obscured.observe(dialog,{attributes:true,attributeFilter:['open']});
    obscured.observe(main,{attributes:true,attributeFilter:['inert']});
    obscured.observe(root,{attributes:true,attributeFilter:['data-scene-visible']});
    function startIntroVideo(){introWaiting=false;syncVideo();}
    ['portfolio:light-reveal','portfolio:intro-complete','portfolio:intro-timeout'].forEach(name=>addEventListener(name,startIntroVideo,options));
    video.muted=true;video.loop=true;
    video.addEventListener('playing',()=>{video.classList.add('video-ready');root.dataset.videoState='playing';},options);
    video.addEventListener('error',()=>{failed=true;pauseVideo();video.classList.remove('video-ready');root.dataset.videoState='poster';label();},options);
    motion.addEventListener('click',()=>{
      if(!wanted()||failed){manualPaused=false;userMotion=true;failed=false;canLoad=true;directSuppressed=false;
        root.dataset.videoMotion='user';if(loaded)video.load();syncVideo();
      }else{manualPaused=true;pauseVideo();}
      label();
    },options);
    preference.addEventListener('change',()=>{userMotion=false;delete root.dataset.videoMotion;label();syncVideo();},options);
    document.addEventListener('visibilitychange',syncVideo,options);
    addEventListener('pageshow',syncVideo,options);
    addEventListener('pagehide',event=>{pauseVideo();if(event.persisted)return;
      alive=false;cancelLoad();observer.disconnect();obscured.disconnect();events.abort();
    },options);
    label();pauseVideo();
    return {pauseVideo,syncVideo};
  }};
})();
