/* Strict viewport loading: native lazy loading alone can fetch several long pages ahead. */
(() => {
  window.PortfolioCaseImages={create(root){
    const pending=new Set();let active=false,destroyed=false;
    const load=image=>{
      if(!image.dataset.src)return;
      image.closest?.('picture')?.querySelectorAll('source[data-srcset]').forEach(source=>{source.srcset=source.dataset.srcset;delete source.dataset.srcset;});
      if(image.dataset.srcset){image.srcset=image.dataset.srcset;delete image.dataset.srcset;}
      image.loading='eager';image.src=image.dataset.src;delete image.dataset.src;
    };
    const observer=new IntersectionObserver(entries=>{
      if(!active||destroyed||!root.open||document.hidden)return;
      for(const entry of entries){if(!entry.isIntersecting||!pending.has(entry.target))continue;load(entry.target);pending.delete(entry.target);observer.unobserve(entry.target);}
    },{root,rootMargin:'450px 0px',threshold:0});
    function clear(){active=false;observer.disconnect();pending.clear();}
    function observe(images){clear();if(destroyed)return;active=true;for(const image of images){if(!image.dataset.src)continue;pending.add(image);observer.observe(image);}}
    function resume(){if(!active||document.hidden||!root.open)return;for(const image of pending){observer.unobserve(image);observer.observe(image);}}
    document.addEventListener('visibilitychange',resume);
    return {observe,clear,dispose(){clear();destroyed=true;document.removeEventListener('visibilitychange',resume);}};
  }};
})();
