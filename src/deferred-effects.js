/* Optional decoration never gates Hero copy, About navigation, or contact actions. */
(() => {
  const urls={about:'__ABOUT_EFFECTS_URL__',footer:'__FOOTER_EFFECTS_URL__'};
  const pending=new Map(),events=new AbortController(),cancellations=[];let alive=true;
  function warm(name){
    if(pending.has(name))return pending.get(name);
    if(!alive||!urls[name])return Promise.resolve();
    const task=new Promise(resolve=>{
      const script=document.createElement('script');script.async=true;script.fetchPriority='low';script.src=urls[name];
      script.onload=()=>resolve(true);script.onerror=()=>{pending.delete(name);script.remove();resolve(false);};
      document.head.append(script);
    });pending.set(name,task);return task;
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);
      cancellations.push(window.PortfolioHeroPerformance.afterLoadIdle(()=>warm(entry.target.id==='about'?'about':'footer')));
    }
  },{rootMargin:'700px'});
  const observeHome=()=>['about','contact'].forEach(id=>{const node=document.getElementById(id);if(node)observer.observe(node);});
  if(!window.portfolioDirectProject)observeHome();
  addEventListener('portfolio:home-restored',observeHome,{signal:events.signal});
  window.PortfolioDeferredEffects={warm};
  addEventListener('portfolio:intro-complete',()=>{
    if(!window.portfolioDirectProject)cancellations.push(window.PortfolioHeroPerformance.afterLoadIdle(()=>warm('about')));
  },{signal:events.signal});
  ['about','contact'].forEach(id=>document.querySelectorAll('a[href="#'+id+'"]').forEach(link=>['pointerenter','focus','pointerdown'].forEach(name=>link.addEventListener(name,()=>warm(id==='about'?'about':'footer'),{signal:events.signal}))));
  addEventListener('pagehide',event=>{if(event.persisted)return;alive=false;observer.disconnect();cancellations.forEach(cancel=>cancel());events.abort();},{signal:events.signal});
})();
