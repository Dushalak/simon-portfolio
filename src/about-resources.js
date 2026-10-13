/* Prepare the next chapter after the first paint; navigation never awaits this. */
(() => {
  const section=document.querySelector('#about');
  if(!section||window.PortfolioAboutResources)return;
  const events=new AbortController(),policy=window.PortfolioHeroPerformance;
  const activity=window.PortfolioScrollActivity;
  let pending=null,alive=true,cancelWarm,notifyPending=false;
  const fonts=['400 14px "About Alibaba"','500 14px "About Alibaba"','700 14px "About Alibaba"','400 64px "About Erya"','400 32px "About Script"'];
  const textures=['assets/about/imgHi.webp','assets/about/imgUiUxAiAgent01CBaigc.webp'];
  const retained=[];
  function notifyReady(){
    if(activity.scrolling||document.hidden){notifyPending=true;return;}
    notifyPending=false;dispatchEvent(new Event('portfolio:about-ready'));
  }
  const unsubscribe=activity.subscribe(scrolling=>{if(!scrolling&&notifyPending&&alive)notifyReady();});
  document.addEventListener('visibilitychange',()=>{if(alive&&!document.hidden&&notifyPending)notifyReady();},{signal:events.signal});
  function decode(image){
    if(image.decode)return image.decode();
    if(image.complete&&image.naturalWidth)return Promise.resolve();
    return new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true,signal:events.signal});image.addEventListener('error',reject,{once:true,signal:events.signal});});
  }
  function decoded(image){
    if(!alive)return;
    const preview=image.closest('.about-hive-preview');
    if(preview&&preview.dataset.ready!=='true'){preview.dataset.ready='true';section.querySelector('.about-reveal').dataset.previewReady='true';}
    const portrait=image.closest('.about-portrait');if(portrait&&portrait.dataset.portraitReady!=='true')portrait.dataset.portraitReady='true';
  }
  function warm(){
    if(pending)return pending;
    if(!alive)return Promise.resolve();
    section.dataset.aboutAssets='loading';
    const jobs=[...section.querySelectorAll('img')].map(image=>{
      const fallback=image.dataset.src;
      image.addEventListener('error',()=>{
        if(!alive||image.dataset.pngRetried==='true'||!fallback?.endsWith('.png')||!image.closest('.about-portrait'))return;
        image.dataset.pngRetried='true';image.closest('picture')?.querySelectorAll('source').forEach(source=>source.removeAttribute('srcset'));image.src=fallback;
      },{signal:events.signal});
      // Responsive candidates may change during rotation before decode resolves.
      image.addEventListener('load',()=>{decode(image).then(()=>decoded(image)).catch(()=>{if(image.naturalWidth)decoded(image);});},{signal:events.signal});
      image.fetchPriority='low';image.loading='eager';window.PortfolioAssets.load(image);
      return decode(image).then(()=>decoded(image));
    });
    textures.forEach(src=>{const image=new Image();image.fetchPriority='low';image.decoding='async';image.src=src;retained.push(image);jobs.push(decode(image));});
    fonts.forEach(font=>jobs.push(document.fonts.load(font)));
    pending=Promise.allSettled(jobs).then(results=>{
      if(!alive)return;
      section.dataset.aboutAssets=results.every(result=>result.status==='fulfilled')?'ready':'partial';
      notifyReady();
      if(document.querySelector('.hero')?.dataset.intro==='complete')window.PortfolioAboutHive?.prepare();
    });
    return pending;
  }
  window.PortfolioAboutResources={warm};
  // A direct case visit keeps its existing policy of not preloading home media.
  if(!window.portfolioDirectProject)cancelWarm=policy.afterLoadIdle(warm);
  addEventListener('portfolio:intro-complete',()=>{if(!window.portfolioDirectProject){warm();window.PortfolioAboutHive?.prepare();}},{signal:events.signal});
  document.querySelectorAll('a[href="#about"]').forEach(link=>{
    ['pointerenter','focus','pointerdown','click'].forEach(name=>link.addEventListener(name,warm,{passive:true,signal:events.signal}));
  });
  addEventListener('pagehide',event=>{if(event.persisted)return;alive=false;cancelWarm?.();unsubscribe();events.abort();retained.length=0;},{signal:events.signal});
})();
