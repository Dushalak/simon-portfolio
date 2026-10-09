(() => {
  const clamp=v=>Math.max(0,Math.min(1,v));
  const phase=(p,a,b)=>clamp((p-a)/(b-a));
  const smooth=t=>t*t*(3-2*t);
  const NS='http://www.w3.org/2000/svg';
  // Every value below is sampled from scroll progress, never from elapsed time.
  const timing={lights:[.20,.45],backdrop:[.24,.65],heroExit:[.16,.46],
    portrait:[.55,.85],title:[.60,.77],greeting:[.65,.82],biography:[.70,.88],
    work:[.76,.91],'experience-one':[.81,.96],'experience-two':[.86,1]};
  const seeds=[{x:.68,y:.43,a:1,b:.8,delay:0},{x:.31,y:.58,a:.82,b:1.06,delay:.05},
    {x:.51,y:.25,a:1.07,b:.76,delay:.085},{x:.84,y:.72,a:.86,b:1.08,delay:.11},
    {x:.16,y:.23,a:1.12,b:.77,delay:.135}];
  window.PortfolioAbout={timing,create({hero,stage,reduced}){
    const about=document.querySelector('#about'),viewport=about?.querySelector('.about-viewport');
    if(!about)return null;
    const reveal=about.querySelector('.about-reveal'),board=about.querySelector('.about-board');
    const canvas=about.querySelector('.about-optics');
    const groups=[...about.querySelectorAll('[data-about-group]')];
    const wide=matchMedia('(min-width:1000px)'),events=new AbortController();
    let enabled=false,w=1,h=1,previous=-1,lastMode='',lastAccess='',destroyed=false,optics=null,fieldReady=false;
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('aria-hidden','true');
    svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.cssText='position:absolute;pointer-events:none';
    svg.innerHTML='<defs><radialGradient id="about-scroll-soft"><stop offset="0" stop-color="white"/><stop offset=".43" stop-color="white"/><stop offset=".72" stop-color="white" stop-opacity=".86"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><filter id="about-scroll-grain" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="13 17" numOctaves="2" seed="19" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".055" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".012"/></filter><filter id="about-scroll-field" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width="1" height="1"><feComponentTransfer><feFuncR type="linear" slope="-45.4545" intercept="0"/><feFuncG type="linear" slope="-45.4545" intercept="0"/><feFuncB type="linear" slope="-45.4545" intercept="0"/></feComponentTransfer></filter><mask id="about-scroll-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style="mask-type:luminance"><g filter="url(#about-scroll-grain)"></g><image x="0" y="0" width="1" height="1" preserveAspectRatio="none" filter="url(#about-scroll-field)"/></mask></defs>';
    document.body.append(svg);
    const maskGroup=svg.querySelector('g');
    const fieldImage=svg.querySelector('image'),thresholdChannels=[...svg.querySelectorAll('#about-scroll-field feComponentTransfer > *')];
    const ellipses=seeds.map(seed=>{const el=document.createElementNS(NS,'ellipse');el.setAttribute('cx',seed.x);el.setAttribute('cy',seed.y);el.setAttribute('rx','0');el.setAttribute('ry','0');el.setAttribute('fill','url(#about-scroll-soft)');maskGroup.append(el);return el;});
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
      if(enabled){
        optics ||= window.PortfolioIntro.createOpticalField(viewport,{canvas,overlay:true});
        const image=optics.maskImage();fieldReady=Boolean(image);
        if(fieldReady)fieldImage.setAttribute('href',image);
        fieldImage.style.display=fieldReady?'':'none';maskGroup.style.display=fieldReady?'none':'';
        about.dataset.opticsRenderer=optics.renderer;
      }
      previous=-1;lastMode='';lastAccess='';
      if(!enabled){about.removeAttribute('data-story-mode');about.removeAttribute('data-story-visible');
        about.inert=false;about.removeAttribute('aria-hidden');groups.forEach(node=>{node.style.removeProperty('transform');node.style.removeProperty('opacity');node.style.removeProperty('filter');});
        reveal.style.removeProperty('transform');hero.querySelector('.hero-scene').style.removeProperty('opacity');}
    }
    function drawLight(p,progress){
      const precursor=smooth(phase(p,.20,.26))*(1-smooth(phase(p,.26,.39)));
      optics?.draw(progress,precursor);
      canvas.style.transform=reveal.style.transform;
    }
    function render(p,introDone){
      if(!enabled)return {exit:0,advance:p*.035};
      const exit=smooth(phase(p,...timing.heroExit));
      if(previous===p)return {exit,advance:smooth(phase(p,0,.25))*.045};
      previous=p;about.dataset.storyProgress=p.toFixed(4);
      const settled=p>=1,mode=settled?'settled':'transition';
      if(mode!==lastMode){about.dataset.storyMode=mode;lastMode=mode;}
      about.dataset.storyVisible=String(p>.20);
      const access=String(p>=.85);
      if(access!==lastAccess){about.inert=access==='false';about.setAttribute('aria-hidden',String(access==='false'));lastAccess=access;}
      const revealProgress=smooth(phase(p,...timing.backdrop));
      reveal.style.transform=`scale(${1+(1-revealProgress)*.025})`;
      reveal.dataset.opticsComplete=String(revealProgress>=1);
      if(fieldReady){
        const threshold=.25+.70*revealProgress;
        thresholdChannels.forEach(channel=>channel.setAttribute('intercept',String((threshold+.014)/.022)));
        fieldImage.setAttribute('opacity',String(smooth(phase(revealProgress,.001,.05))));
      }else seeds.forEach((s,i)=>{
        const t=smooth(phase(p,.235+s.delay*.62,.65));
        const radius=t*(1.4+Math.sin(p*8+i)*.035);
        ellipses[i].setAttribute('rx',String(radius*s.a));ellipses[i].setAttribute('ry',String(radius*s.b));
      });
      groups.forEach(node=>{
        const key=node.dataset.aboutGroup,t=smooth(phase(p,...timing[key]));
        const end=1-t,isPortrait=key==='portrait',big=key==='title';
        node.style.transform=isPortrait?`translate3d(${60*end}px,${35*end}px,0) scale(${1+.12*end})`:
          `translate3d(${(big?-28:-9)*end}px,${(big?55:25)*end}px,0)`;
        node.style.opacity=String(t*(key==='biography'?.76:1));
        node.style.filter=t===1?'none':`blur(${end*(isPortrait?8:big?5:3)}px)`;
      });
      if(introDone){hero.querySelector('.hero-scene').style.opacity=String(1-smooth(phase(p,.45,.69)));}
      drawLight(p,revealProgress);
      return {exit,advance:smooth(phase(p,0,.25))*.045};
    }
    document.querySelectorAll('a[href="#about"],a[href="#home"]').forEach(link=>link.addEventListener('click',event=>{
      if(window.portfolioIntroLocked||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();history.pushState(null,'',link.hash);
      const target=link.hash==='#home'?hero:about;
      window.scrollTo({top:scrollY+target.getBoundingClientRect().top,behavior:reduced.matches?'instant':'smooth'});
    },{signal:events.signal}));
    // Decode assets and resolve fonts before they are needed, without blocking intro.
    about.querySelectorAll('img').forEach(img=>img.decode?.().catch(()=>{}));
    Promise.allSettled(['14px "About Alibaba"','64px "About Erya"','32px "About Script"'].map(font=>document.fonts.load(font))).then(()=>dispatchEvent(new Event('portfolio:about-ready')));
    measure();
    return {measure,render,dispose(){destroyed=true;events.abort();svg.remove();optics?.dispose();canvas.width=canvas.height=0;document.documentElement.classList.remove('about-story-enabled');}};
  }};
})();
