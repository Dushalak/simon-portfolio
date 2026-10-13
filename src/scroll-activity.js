/* Give scrolling priority over optional background rendering. No frame loop. */
(() => {
  const subscribers=new Set(),events=new AbortController();
  let scrolling=false,timer=0;
  function notify(value){
    if(scrolling===value)return;
    scrolling=value;document.documentElement.dataset.motionScrolling=String(value);
    subscribers.forEach(callback=>callback(value));
  }
  addEventListener('scroll',()=>{
    notify(true);clearTimeout(timer);timer=setTimeout(()=>notify(false),160);
  },{passive:true,capture:true,signal:events.signal});
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);notify(false);},{signal:events.signal});
  window.PortfolioScrollActivity={get scrolling(){return scrolling;},subscribe(callback){subscribers.add(callback);return ()=>subscribers.delete(callback);}};
  addEventListener('pagehide',event=>{if(event.persisted)return;clearTimeout(timer);events.abort();subscribers.clear();},{signal:events.signal});
})();
