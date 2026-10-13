/* Keep the source's 16:9 composition independent of raster/DPR budgets. */
(() => {
  function compute(width,height,coarse=false){
    const w=Math.max(1,width),h=Math.max(1,height),aspect=16/9;
    const mobile=w<=720||(coarse&&h<=540);
    const tablet=!mobile&&w<=1366&&(coarse||w/h<=1.5);
    const mode=mobile?'mobile':tablet?'tablet':'desktop';
    if(mode==='desktop')return {mode,width:w,height:h,scaleX:1,scaleY:1,aspect:w/h};
    // Bounded overscan retains the subject without enlarging a landscape source
    // to the full height of a portrait screen. Dark surroundings blend naturally.
    const frameWidth=Math.min(w*(tablet?1.12:1.28),h*aspect*.92);
    const frameHeight=frameWidth/aspect;
    return {mode,width:frameWidth,height:frameHeight,scaleX:w/frameWidth,scaleY:h/frameHeight,aspect};
  }
  function create({hero,stage}){
    const coarse=matchMedia('(pointer:coarse)');
    return {measure(){
      const frame=compute(stage.clientWidth,stage.clientHeight,coarse.matches);
      hero.dataset.heroFraming=frame.mode;
      hero.style.setProperty('--hero-scene-width',frame.width+'px');
      hero.style.setProperty('--hero-scene-height',frame.height+'px');
      return frame;
    }};
  }
  window.PortfolioHeroFraming={compute,create};
})();
