(() => {
  const clamp=v=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const smooth=t=>t*t*(3-2*t);
  // Reserve the final 16% of the existing pin for reading the finished About.
  // The section height and the next section's physical spacing stay unchanged.
  const completionAt=.84;
  // Every value below is sampled from scroll progress, never from elapsed time.
  const timing={backdrop:[.24,.65],heroExit:[.16,.46],
    portrait:[.55,.85],title:[.60,.77],greeting:[.65,.82],biography:[.70,.88],
    work:[.76,.91],'experience-one':[.81,.96],'experience-two':[.86,1]};
  window.PortfolioAbout={timing,create({hero,stage,reduced}){
    const about=document.querySelector('#about');
    if(!about)return null;
    const reveal=about.querySelector('.about-reveal'),board=about.querySelector('.about-board');
    const scene=hero.querySelector('.hero-scene');
    const tier=window.PortfolioHeroPerformance.profile.tier;
    const distance=tier==='high'?24:tier==='balanced'?14:8;
    about.dataset.opticsRenderer='compositor';
    const groups=[...about.querySelectorAll('[data-about-group]')];
    const wide=matchMedia('(min-width:1000px)'),events=new AbortController();
    let enabled=false,w=1,h=1,previous=-1,lastMode='',lastAccess='',destroyed=false;
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
      if(!enabled){about.removeAttribute('data-story-mode');about.removeAttribute('data-story-visible');about.removeAttribute('data-story-holding');
        about.inert=false;about.removeAttribute('aria-hidden');groups.forEach(node=>{node.style.removeProperty('transform');node.style.removeProperty('opacity');node.style.removeProperty('filter');});
        reveal.style.removeProperty('transform');reveal.style.removeProperty('opacity');scene.style.removeProperty('opacity');}
    }
    function render(scrollProgress,introDone){
      if(!enabled)return result(0,scrollProgress*.035);
      const p=clamp(scrollProgress/completionAt);
      if(p>0)warmAssets();
      const exit=smooth(phase(p,...timing.heroExit));
      if(previous===scrollProgress)return result(exit,smooth(phase(p,0,.25))*.045);
      previous=scrollProgress;about.dataset.storyProgress=p.toFixed(4);
      const settled=scrollProgress>=1,mode=settled?'settled':'transition';
      about.dataset.storyHolding=String(p>=1&&!settled);
      if(mode!==lastMode){about.dataset.storyMode=mode;lastMode=mode;}
      about.dataset.storyVisible=String(p>.20);
      const access=String(p>=.85);
      if(access!==lastAccess){about.inert=access==='false';about.setAttribute('aria-hidden',String(access==='false'));lastAccess=access;}
      const revealProgress=smooth(phase(p,...timing.backdrop));
      reveal.style.opacity=String(revealProgress);
      reveal.style.transform=`translate3d(0,${((1-revealProgress)*distance).toFixed(2)}px,0)`;
      groups.forEach(node=>{
        const key=node.dataset.aboutGroup,t=smooth(phase(p,...timing[key]));
        const end=1-t,isPortrait=key==='portrait',big=key==='title';
        node.style.transform=`translate3d(0,${(end*(isPortrait?distance:big?distance*.8:distance*.5)).toFixed(2)}px,0)`;
        node.style.opacity=String(t*(key==='biography'?.76:1));
      });
      if(introDone){scene.style.opacity=String(1-smooth(phase(p,.45,.69)));}
      return result(exit,smooth(phase(p,0,.25))*.045);
    }
    document.querySelectorAll('a[href="#about"],a[href="#home"]').forEach(link=>link.addEventListener('click',event=>{
      if(window.portfolioIntroLocked||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();history.pushState(null,'',link.hash);
      const target=link.hash==='#home'?hero:about;
      window.scrollTo({top:scrollY+target.getBoundingClientRect().top,behavior:reduced.matches?'instant':'smooth'});
    },{signal:events.signal}));
    let assetsWarmed=false;
    function warmAssets(){
      if(assetsWarmed)return;assetsWarmed=true;
      about.querySelectorAll('img').forEach(img=>{window.PortfolioAssets.load(img);img.decode?.().catch(()=>{});});
      Promise.allSettled(['14px "About Alibaba"','64px "About Erya"','32px "About Script"'].map(font=>document.fonts.load(font))).then(()=>dispatchEvent(new Event('portfolio:about-ready')));
    }
    measure();
    return {measure,render,dispose(){destroyed=true;events.abort();document.documentElement.classList.remove('about-story-enabled');}};
  }};
})();
