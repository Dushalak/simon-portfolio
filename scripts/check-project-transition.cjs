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
async function transition(compact,reduced=false){
  let native=0,changes=0,ready=0,frames=null;
  const window={},root={dataset:{}},body={classList:{add(){},remove(){}}};
  const document={body,documentElement:root,startViewTransition(fn){native++;fn();return {ready:Promise.resolve(),finished:Promise.resolve()};}};
  const dialog={open:false,animate(keyframes){frames=keyframes;return {finished:Promise.resolve(),cancel(){}};}};
  vm.runInNewContext(fs.readFileSync('src/page-transition.js','utf8'),{window,document,Element:{prototype:{animate(){}}},matchMedia:q=>({matches:q.includes('reduced')?reduced:compact}),addEventListener(){}});
  await window.PortfolioPageTransition.run(()=>{changes++;dialog.open=true;},{dialog,onReady(){ready++;}});
  assert.equal(changes,1);assert.equal(ready,1);assert.equal(root.dataset.pageTransition,undefined);assert.equal(window.PortfolioPageTransition.busy,false);
  if(reduced){assert.equal(native,0);assert.equal(frames,null);}
  else if(compact){assert.equal(native,0,'touch devices avoid the fullscreen snapshot push');assert.equal(frames[0].opacity,0);assert(!frames[0].transform.includes('100%'),'touch entry does not drag a fullscreen layer up');}
  else assert.equal(native,1,'desktop retains its native transition');
}
(async()=>{await transition(true);await transition(false);await transition(true,true);console.log('PASS: touch scroll position survives focus, original styles and return position restore, desktop unchanged, bounded touch entry, reduced motion and one transition callback.');})().catch(error=>{console.error(error);process.exitCode=1;});
