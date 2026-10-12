const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const queue=new Map(),listeners={},io=[],ro=[],mo=[];let id=0,reads=0,fontReady;
function node(){const style={values:new Map(),writes:0,setProperty(k,v){this.values.set(k,v);this.writes++;}};return {style,dataset:{},handlers:{},addEventListener(k,f){this.handlers[k]=f;},classList:{add(){},remove(){}}};}
const root=node(),inner=node(),box=node(),beam=node(),glow=node(),main={inert:false},dialog={open:false};
root.clientWidth=1000;let top=5000;root.getBoundingClientRect=()=>{reads++;return {width:1000,height:780,left:0,top};};root.closest=()=>main.inert?main:null;
inner.parentElement={clientWidth:1000};inner.offsetWidth=300;
const letters=Array.from({length:5},(_,i)=>Object.assign(node(),{offsetLeft:50+i*170,offsetTop:450,offsetParent:root}));
inner.querySelectorAll=()=>letters;root.querySelector=s=>s==='.bwf-word'?box:s==='.bwf-word-in'?inner:s==='.bwf-beam'?beam:glow;
const optics={resizeCount:0,disposed:false,resize(){this.resizeCount++;root.dataset.optics='cached';},update(){},dispose(){this.disposed=true;}};
const media={matches:false,addEventListener(k,f){this.change=f;},removeEventListener(){}};
const document={hidden:false,fonts:{ready:{then(f){fontReady=f;}}},querySelector:s=>s==='#contact.bwf'?root:s==='.case-dialog'?dialog:main,
  createElement:()=>({getContext:()=>({measureText:()=>({fontBoundingBoxAscent:75,fontBoundingBoxDescent:20})})}),addEventListener:(k,f)=>listeners[k]=f};
const sandbox={document,window:{matchMedia:()=>media,PortfolioFooterOptics:{create:()=>optics},addEventListener:(k,f)=>listeners[k]=f},
  addEventListener:(k,f)=>listeners[k]=f,performance:{now:()=>1000},AbortController,
  requestAnimationFrame:f=>{queue.set(++id,f);return id;},cancelAnimationFrame:i=>queue.delete(i),
  getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0',fontFamily:'DM Sans'}),
  IntersectionObserver:class{constructor(f){this.callback=f;io.push(this);}observe(){}unobserve(){}disconnect(){this.stopped=true;}},
  ResizeObserver:class{constructor(f){this.callback=f;ro.push(this);}observe(){}disconnect(){this.stopped=true;}},
  MutationObserver:class{constructor(f){this.callback=f;mo.push(this);}observe(){}disconnect(){this.stopped=true;}}};
vm.runInNewContext(fs.readFileSync('src/beam-wordmark-footer.js','utf8'),sandbox);
assert.equal(queue.size,0,'offscreen footer does not animate');
io[0].callback([{target:root,isIntersecting:true}]);assert.equal(optics.resizeCount,1,'textures prepare near contact');
top=0;listeners.scroll();io[1].callback([{target:root,isIntersecting:true}]);assert.equal(root.dataset.running,'true');assert.equal(queue.size,1);
root.handlers.pointermove({clientX:400,clientY:300,type:'pointermove'});const previousReads=reads;
for(let i=0;i<50;i++)root.handlers.pointermove({clientX:400+i,clientY:300,type:'pointermove'});
assert.equal(reads,previousReads,'pointer movements reuse bounds');assert(!root.style.values.has('--bwf-b'),'dynamic colors no longer invalidate the whole footer');
listeners.scroll();root.handlers.pointermove({clientX:400,clientY:300,type:'pointermove'});assert.equal(reads,previousReads+1,'scroll refreshes pointer bounds');
dialog.open=true;mo[0].callback();assert.equal(queue.size,0,'a project dialog pauses footer rendering');
dialog.open=false;mo[0].callback();assert.equal(queue.size,1);
document.hidden=true;listeners.visibilitychange();assert.equal(queue.size,0,'hidden tab pauses');
document.hidden=false;listeners.visibilitychange();assert.equal(queue.size,1);
main.inert=true;mo[0].callback();assert.equal(queue.size,0,'menu overlay pauses');main.inert=false;mo[0].callback();assert.equal(queue.size,1);
media.matches=true;media.change();assert.equal(queue.size,0,'reduced motion is event-driven');
fontReady();assert.equal(queue.size,1,'font readiness schedules measurement');
listeners.pagehide({persisted:false});assert.equal(queue.size,0);assert(optics.disposed);assert(io.every(o=>o.stopped));assert(ro[0].stopped);assert(mo[0].stopped);
console.log('PASS: offscreen/modal/menu/tab suspension, reduced motion, pointer bounds cache, scoped styles, font refresh, texture/observer cleanup.');
