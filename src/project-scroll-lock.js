/* Keep the underlying page stationary while a touch-device modal takes focus. */
(() => {
  window.PortfolioProjectScrollLock={create(){
    const compact=matchMedia('(max-width:1024px), (pointer:coarse)');
    const body=document.body,root=document.documentElement;
    let saved=null,position=0;
    const names=['position','top','left','right','width'];
    return {
      get compact(){return compact.matches;},
      get scrollY(){return saved?position:window.scrollY;},
      lock(y){
        if(saved||!compact.matches)return;
        position=y;
        saved={body:names.map(name=>[name,body.style.getPropertyValue(name),body.style.getPropertyPriority(name)]),overflow:root.style.getPropertyValue('overflow'),priority:root.style.getPropertyPriority('overflow')};
        body.style.setProperty('position','fixed');body.style.setProperty('top',-y+'px');
        body.style.setProperty('left','0');body.style.setProperty('right','0');body.style.setProperty('width','100%');
        root.style.setProperty('overflow','hidden');
      },
      unlock(y=position){
        if(!saved)return;
        for(const [name,value,priority] of saved.body){if(value)body.style.setProperty(name,value,priority);else body.style.removeProperty(name);}
        if(saved.overflow)root.style.setProperty('overflow',saved.overflow,saved.priority);else root.style.removeProperty('overflow');
        saved=null;window.scrollTo({top:y,behavior:'instant'});
      }
    };
  }};
})();
