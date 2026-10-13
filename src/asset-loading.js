/* Start offscreen image requests shortly before their section is needed. */
(() => {
  const pending=new Map();
  const load=image=>{if(image?.dataset.src){
    image.closest('picture')?.querySelectorAll('source[data-srcset]').forEach(source=>{source.srcset=source.dataset.srcset;delete source.dataset.srcset;});
    if(image.dataset.srcset){image.srcset=image.dataset.srcset;delete image.dataset.srcset;}
    image.src=image.dataset.src;delete image.dataset.src;
  }};
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    pending.get(entry.target)?.forEach(load);pending.delete(entry.target);observer.unobserve(entry.target);
  }),{rootMargin:'600px'});
  function observe(image,anchor=image){
    if(!pending.has(anchor)){pending.set(anchor,[]);observer.observe(anchor);}
    pending.get(anchor).push(image);
  }
  document.querySelectorAll('img[data-src]').forEach(image=>observe(image,image.closest('section')||image));
  function responsive(image,srcset,deferred=true){
    const picture=document.createElement('picture'),source=document.createElement('source');
    source.media='(max-width:720px)';source.type='image/webp';
    if(deferred)source.dataset.srcset=srcset.split(',')[0].trim();else source.srcset=srcset.split(',')[0].trim();
    picture.append(source,image);return picture;
  }
  window.PortfolioAssets={load,observe,responsive};
  addEventListener('pagehide',event=>{if(!event.persisted){observer.disconnect();pending.clear();}},{once:true});
})();
