const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const style=()=>{const values=new Map();return {getPropertyValue:k=>values.get(k)?.[0]||'',getPropertyPriority:k=>values.get(k)?.[1]||'',setProperty(k,v,p=''){values.set(k,[v,p]);},removeProperty(k){values.delete(k);}};};
for(const compact of [true,false]){
  const body={style:style()},root={style:style()},calls=[];
  body.style.setProperty('position','relative');body.style.setProperty('width','95%','important');
  const window={scrollY:4200,scrollTo(options){calls.push(options.top);this.scrollY=options.top;}};
  vm.runInNewContext(fs.readFileSync('src/project-scroll-lock.js','utf8'),{window,document:{body,documentElement:root},matchMedia:()=>({matches:compact})});
  const lock=window.PortfolioProjectScrollLock.create();lock.lock(4200);lock.lock(99);
  if(compact){
    assert.equal(body.style.getPropertyValue('top'),'-4200px');window.scrollY=0;
    assert.equal(lock.scrollY,4200,'modal focus/overflow changes cannot lose the background position');
    lock.unlock(4300);assert.equal(window.scrollY,4300);assert.equal(body.style.getPropertyValue('position'),'relative');assert.equal(body.style.getPropertyValue('width'),'95%');assert.equal(body.style.getPropertyPriority('width'),'important');assert.equal(root.style.getPropertyValue('overflow'),'');lock.unlock(99);assert.deepEqual(calls,[4300],'unlock is idempotent');
  }else{assert.equal(body.style.getPropertyValue('position'),'relative');lock.unlock();assert.equal(calls.length,0,'desktop page flow is untouched');}
}
async function transition(compact,reduced=false,nativeSupported=true){
  let native=0,changes=0,ready=0,frames=null,options=null;
  const window={},root={dataset:{}},body={classList:{add(){},remove(){}}};
  const document={body,documentElement:root,startViewTransition(fn){native++;fn();return {ready:Promise.resolve(),finished:Promise.resolve()};}};
  if(!nativeSupported)delete document.startViewTransition;
  const dialog={open:false,animate(keyframes,settings){frames=keyframes;options=settings;return {finished:Promise.resolve(),cancel(){}};}};
  vm.runInNewContext(fs.readFileSync('src/page-transition.js','utf8'),{window,document,Element:{prototype:{animate(){}}},matchMedia:q=>({matches:q.includes('reduced')?reduced:compact}),addEventListener(){}});
  await window.PortfolioPageTransition.run(()=>{changes++;dialog.open=true;},{dialog,onReady(){ready++;}});
  assert.equal(changes,1);assert.equal(ready,1);assert.equal(root.dataset.pageTransition,undefined);assert.equal(window.PortfolioPageTransition.busy,false);
  if(reduced){assert.equal(native,0);assert.equal(frames,null);}
  else if(nativeSupported)assert.equal(native,1,'all devices retain the original native upward transition');
  else{assert.equal(native,0);assert.equal(frames[0].transform,'translate3d(0,100%,0)');assert.equal(frames[1].transform,'translate3d(0,0,0)');assert.equal(frames[0].opacity,undefined,'the upward push must not be replaced with a fade');assert.equal(options.duration,650,'fallback preserves its original timing');}
}
(async()=>{await transition(true);await transition(false);await transition(true,false,false);await transition(false,false,false);await transition(true,true);console.log('PASS: touch scroll position survives focus, original styles and return position restore, original upward push on all devices, reduced motion and one transition callback.');})().catch(error=>{console.error(error);process.exitCode=1;});
