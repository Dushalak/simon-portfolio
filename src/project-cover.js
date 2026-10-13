/* A visible cover never waits for a network request or high-resolution decode. */
(() => {
  window.PortfolioProjectCover={create(key,project){
    const media=window.PortfolioProjectMedia.detailCovers[key];
    const element=document.createElement('div');element.className='case-cover-media';
    element.style.backgroundImage=`url("${media.preview}")`;
    const low=document.createElement('img'),high=document.createElement('img');
    low.alt='';high.alt=project.title+' 项目主视觉';
    for(const image of [low,high]){image.width=media.coverWidth;image.height=media.coverHeight;image.decoding='async';image.loading='eager';}
    const cached=document.querySelector('[data-open="'+key+'"] .project-image');
    const lowURL=cached?.complete&&cached.naturalWidth?cached.currentSrc:project.coverSrcset.split(',')[0].trim().split(' ')[0];
    low.fetchPriority='high';low.dataset.src=lowURL;
    high.fetchPriority='auto';high.sizes='(max-width:720px) 92vw, (max-width:1000px) 90vw, (max-width:1650px) calc(100vw - 200px), 1450px';
    high.dataset.src=media.cover;high.dataset.srcset=media.coverSrcset;
    const picture=window.PortfolioAssets.responsive(high,media.coverSrcset,true);
    picture.className='case-cover-sharp';element.append(low,picture);
    const events=new AbortController();let disposed=false,started=false,cancel;
    async function reveal(){
      if(disposed||!high.naturalWidth)return;
      try{await high.decode?.();}catch{return;}
      if(!disposed&&high.naturalWidth){picture.classList.add('is-ready');element.dataset.coverReady='true';}
    }
    high.addEventListener('load',reveal,{signal:events.signal});
    return {element,start(){
      if(started||disposed)return;started=true;
      window.PortfolioAssets.load(low);
      cancel=window.PortfolioHeroPerformance.afterPaint(()=>{
        if(disposed)return;window.PortfolioAssets.load(high);if(high.complete)reveal();
      });
    },dispose(){disposed=true;cancel?.();events.abort();}};
  }};
})();
