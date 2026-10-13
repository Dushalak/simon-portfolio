(() => {
  const clamp=v=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const smooth=t=>t*t*(3-2*t);
  // Reserve the final 16% of the existing pin for reading the finished About.
  // The section height and the next section's physical spacing stay unchanged.
  const completionAt=.84;
  // Every value below is sampled from scroll progress, never from elapsed time.
  const timing={backdrop:[.16,.46],heroExit:[.16,.40],
    portrait:[.38,.70],title:[.34,.56],greeting:[.40,.62],biography:[.44,.68],
    work:[.50,.72],'experience-one':[.56,.78],'experience-two':[.62,.84]};
  window.PortfolioAbout={timing,create({hero,stage,reduced}){
    const about=document.querySelector('#about');
    if(!about)return null;
    const reveal=about.querySelector('.about-reveal'),board=about.querySelector('.about-board');
    const scene=hero.querySelector('.hero-scene');
    const tier=window.PortfolioHeroPerformance.profile.tier;
    const distance=tier==='high'?24:tier==='balanced'?14:8;
    about.dataset.opticsRenderer='compositor';
    const groups=[...about.querySelectorAll('[data-about-group]')];
    const tracks=groups.map(node=>({node,key:node.dataset.aboutGroup,last:-1}));
    const wide=matchMedia('(min-width:1000px)'),events=new AbortController();
    let enabled=false,w=1,h=1,previous=-1,lastMode='',lastAccess='',destroyed=false,lastReveal=-1,lastScene=-1;
    const output={exit:0,advance:0};const result=(exit,advance)=>{output.exit=exit;output.advance=advance;return output;};
    // CSS sticky remains the only pin. The real About section overlaps its final
    // viewport and switches from fixed to normal flow at that exact same position.
    function measure(){
      if(destroyed)return;
      enabled=wide.matches&&!reduced.matches;
      document.documentElement.classList.toggle('about-story-enabled',enabled);
      w=stage.clientWidth;h=stage.clientHeight;
      document.documentElement.style.setProperty('--about-stage-height',h+'px');
      const scale=Math.min(w/1280,h/842);
      board.style.setProperty('--about-board-scale',String(scale));
      const title=about.querySelector('#about-title');
      title.style.setProperty('--about-fill-width',title.offsetWidth+'px');
      title.style.setProperty('--about-fill-height',title.offsetHeight+'px');
      title.querySelectorAll('.fold-text-piece').forEach(piece=>{
        piece.style.setProperty('--about-fill-x',-piece.parentElement.offsetLeft+'px');
        piece.style.setProperty('--about-fill-y',-piece.parentElement.offsetTop+'px');
      });
      previous=-1;lastMode='';lastAccess='';
      lastReveal=lastScene=-1;tracks.forEach(track=>track.last=-1);
      if(!enabled){about.removeAttribute('data-story-mode');about.removeAttribute('data-story-visible');about.removeAttribute('data-story-holding');
        about.inert=false;about.removeAttribute('aria-hidden');groups.forEach(node=>{node.style.removeProperty('transform');node.style.removeProperty('opacity');node.style.removeProperty('filter');});
        reveal.style.removeProperty('transform');reveal.style.removeProperty('opacity');scene.style.removeProperty('opacity');}
    }
    function render(scrollProgress,introDone){
      if(!enabled)return result(0,scrollProgress*.035);
      const p=clamp(scrollProgress/completionAt);
      const exit=smooth(phase(p,...timing.heroExit));
      if(previous===scrollProgress)return result(exit,smooth(phase(p,0,.25))*.045);
      previous=scrollProgress;about.dataset.storyProgress=p.toFixed(4);
      const settled=scrollProgress>=1,mode=settled?'settled':'transition';
      const holding=String(p>=1&&!settled);if(about.dataset.storyHolding!==holding)about.dataset.storyHolding=holding;
      if(mode!==lastMode){about.dataset.storyMode=mode;lastMode=mode;}
      const visible=String(p>.16);if(about.dataset.storyVisible!==visible)about.dataset.storyVisible=visible;
      const access=String(p>=.68);
      if(access!==lastAccess){about.inert=access==='false';about.setAttribute('aria-hidden',String(access==='false'));lastAccess=access;}
      const revealProgress=smooth(phase(p,...timing.backdrop));
      if(revealProgress!==lastReveal){lastReveal=revealProgress;reveal.style.opacity=String(revealProgress);
        reveal.style.transform=`translate3d(0,${((1-revealProgress)*distance).toFixed(2)}px,0)`;}
      tracks.forEach(track=>{
        const {node,key}=track,t=smooth(phase(p,...timing[key]));
        if(t===track.last)return;track.last=t;
        const end=1-t,isPortrait=key==='portrait',big=key==='title';
        node.style.transform=`translate3d(0,${(end*(isPortrait?distance:big?distance*.8:distance*.5)).toFixed(2)}px,0)`;
        node.style.opacity=String(t*(key==='biography'?.76:1));
      });
      // The old background remains painted below the fade until the next one is
      // opaque. Two backgrounds fading out together would create a dark dip.
      const sceneOpacity=revealProgress<1?1:0;
      if(introDone&&sceneOpacity!==lastScene){lastScene=sceneOpacity;scene.style.opacity=String(sceneOpacity);}
      return result(exit,smooth(phase(p,0,.25))*.045);
    }
    document.querySelectorAll('a[href="#about"],a[href="#home"]').forEach(link=>link.addEventListener('click',event=>{
      if(window.portfolioIntroLocked||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();history.pushState(null,'',link.hash);
      if(link.hash==='#about')window.PortfolioAboutResources?.warm();
      const target=link.hash==='#home'?hero:about;
      window.scrollTo({top:scrollY+target.getBoundingClientRect().top,behavior:reduced.matches?'instant':'smooth'});
    },{signal:events.signal}));
    measure();
    return {measure,render,dispose(){destroyed=true;events.abort();document.documentElement.classList.remove('about-story-enabled');}};
  }};
})();
