const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function eventTarget(target={}){const handlers={};target.addEventListener=(name,fn)=>(handlers[name]??=[]).push(fn);target.emit=(name,value={})=>handlers[name]?.forEach(fn=>fn(value));return target;}
const window=eventTarget({}),document=eventTarget({documentElement:{dataset:{}}}),timers=new Map();let id=0;
vm.runInNewContext(fs.readFileSync('src/scroll-activity.js','utf8'),{window,document,AbortController,addEventListener:window.addEventListener,setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)});
const changes=[],off=window.PortfolioScrollActivity.subscribe(value=>changes.push(value));
for(let i=0;i<100;i++)window.emit('scroll');
assert.equal(timers.size,1,'one quiet timer per scroll burst');assert.deepEqual(changes,[true],'no per-frame notifications');
[...timers.values()][0]();assert.deepEqual(changes,[true,false]);off();window.emit('scroll');assert.deepEqual(changes,[true,false]);window.emit('pagehide',{persisted:false});assert.equal(timers.size,0);

function revealFixture(){
  const frames=new Map(),intersections=[],mutations=[];let id=0,layoutReads=0,styleWrites=0;
  const style={opacity:'',transform:'',filter:'',removeProperty(key){this[key]='';styleWrites++;}};
  const element={style,dataset:{},classList:{toggle(){}},offsetParent:null,get offsetTop(){layoutReads++;return 850;}};
  const root={closest:()=>main.inert?main:null},main={inert:false},dialog={open:false},motion=eventTarget({matches:false});
  const window=eventTarget({}),document=eventTarget({hidden:false,fonts:{ready:{then(){}}},querySelector:s=>s==='main'?main:dialog});
  const sandbox={window,document,AbortController,scrollY:0,innerHeight:1000,matchMedia:()=>motion,addEventListener:window.addEventListener,
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    IntersectionObserver:class{constructor(fn){this.callback=fn;intersections.push(this);}observe(){}disconnect(){this.closed=true;}},
    MutationObserver:class{constructor(fn){this.callback=fn;mutations.push(this);}observe(){}disconnect(){this.closed=true;}},
    ResizeObserver:class{observe(){}disconnect(){}}};
  vm.runInNewContext(fs.readFileSync('src/scroll-reveal.js','utf8'),sandbox);
  const api=window.PortfolioScrollReveal.create([{nodes:[element],y:24,start:1,end:.76,opacity:.35}],{root,simple:true});
  return {api,style,sandbox,window,document,motion,frames,main,dialog,intersections,mutations,reads:()=>layoutReads,writes:()=>styleWrites,flush(){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn());}};
}
const reveal=revealFixture();assert.equal(reveal.frames.size,0,'offscreen section has no scroll work');assert.equal(reveal.style.filter,'','simple entrance has no blur');
reveal.intersections[0].callback([{isIntersecting:true}]);reveal.flush();const reads=reveal.reads(),writes=reveal.writes();
for(let i=0;i<100;i++)reveal.window.emit('scroll');assert.equal(reveal.frames.size,1,'coalesce scroll work into one animation frame');reveal.flush();assert.equal(reveal.reads(),reads,'scroll samples reuse layout offsets');assert.equal(reveal.writes(),writes,'unchanged progress skips writes');
reveal.sandbox.scrollY=900;reveal.window.emit('scroll');reveal.flush();assert.equal(reveal.style.opacity,'1');assert.equal(reveal.style.transform,'','visible content settles completely');
reveal.sandbox.scrollY=0;reveal.window.emit('scroll');reveal.flush();assert.notEqual(reveal.style.opacity,'1','reverse scrolling preserves entrance');assert.equal(reveal.style.filter,'');
reveal.dialog.open=true;reveal.mutations[0].callback();reveal.window.emit('scroll');assert.equal(reveal.frames.size,0,'modal blocks background entrance');
reveal.dialog.open=false;reveal.main.inert=true;reveal.window.emit('scroll');assert.equal(reveal.frames.size,0,'menu blocks entrance');reveal.main.inert=false;
reveal.document.hidden=true;reveal.window.emit('scroll');assert.equal(reveal.frames.size,0,'hidden tab does no scroll work');reveal.document.hidden=false;
reveal.motion.matches=true;reveal.motion.emit('change');assert.equal(reveal.style.opacity,'1');assert.equal(reveal.style.transform,'');reveal.api.dispose();assert(reveal.intersections[0].closed);assert(reveal.mutations[0].closed);

function hiveFixture(tier,{offscreen=false}={}){
  const frames=new Map(),intersections=[];let id=0,draws=0,setups=0,deferred,scheduled=0;
  const window=eventTarget({PortfolioHeroPerformance:{profile:{tier,maxPixels:786432,shaderFps:40},afterLoadIdle(fn){scheduled++;deferred=fn;return ()=>deferred=null;}}});
  const activity={scrolling:true,subscribe(fn){this.update=fn;return ()=>{};}};window.PortfolioScrollActivity=activity;
  const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),getUniformLocation:()=>({}),drawArrays(){draws++;}}, {get(target,key){return key in target?target[key]:()=>{};}});
  const section={dataset:{storyVisible:'true'},closest:()=>main.inert?main:null},main={inert:false},dialog={open:false},canvas=eventTarget({dataset:{},width:0,height:0,closest:()=>section,getBoundingClientRect:()=>({top:0,bottom:1000,width:2000,height:1000}),getContext(){setups++;return gl;}});
  const document=eventTarget({hidden:false,querySelector:s=>s==='#about .about-hive'?canvas:s==='.case-dialog'?dialog:main});
  const mutations=[],motion=eventTarget({matches:false});
  vm.runInNewContext(fs.readFileSync('src/about-hive.js','utf8'),{window,document,innerHeight:1000,devicePixelRatio:2,AbortController,matchMedia:()=>motion,addEventListener:window.addEventListener,
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    IntersectionObserver:class{constructor(fn){this.callback=fn;intersections.push(this);}observe(){this.callback([{isIntersecting:!offscreen,intersectionRatio:offscreen?0:1}]);}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{constructor(fn){mutations.push(fn);}observe(){}disconnect(){}}});
  return {window,activity,canvas,dialog,motion,document,frames,setups:()=>setups,draws:()=>draws,scheduled:()=>scheduled,idle(){const fn=deferred;deferred=null;fn?.();},enter(){intersections[0].callback([{isIntersecting:true,intersectionRatio:1}]);},start(){activity.scrolling=false;activity.update();assert.equal(setups,0,'GL compile waits for idle');this.idle();},tick(now){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(now));},mutate:()=>mutations[0]()};
}
const prepared=hiveFixture('high',{offscreen:true});prepared.activity.scrolling=false;
for(let i=0;i<100;i++)prepared.window.PortfolioAboutHive.prepare();assert.equal(prepared.scheduled(),1,'one idle compilation is shared by all preload callers');prepared.idle();assert.equal(prepared.setups(),1);assert.equal(prepared.canvas.dataset.hiveState,'ready');assert.equal(prepared.frames.size,0,'offscreen warmup paints one static frame, with no animation loop');
prepared.window.PortfolioAboutHive.prepare();prepared.enter();assert.equal(prepared.setups(),1,'entering uses the prepared instance');assert.equal(prepared.frames.size,1);
for(const [tier,budget,fps] of [['high',150000,15],['balanced',80000,12],['low',40000,8]]){
  const f=hiveFixture(tier);assert.equal(f.setups(),0,'scrolling never initializes WebGL');assert.equal(f.frames.size,0);f.start();assert(f.canvas.width*f.canvas.height<budget*1.01,'resolution has a fixed device budget');
  const before=f.draws();for(let i=1;i<=60;i++)f.tick(i*1000/60);assert(f.draws()-before<=fps,'background draw rate is capped independently of scrolling');
  f.activity.scrolling=true;f.activity.update();assert.equal(f.frames.size,0,'scroll immediately pauses shader');f.activity.scrolling=false;f.activity.update();assert.equal(f.frames.size,1,'idle restores existing shader');assert.equal(f.setups(),1);
  f.dialog.open=true;f.mutate();assert.equal(f.frames.size,0,'modal pauses shader');f.dialog.open=false;f.mutate();f.motion.matches=true;f.motion.emit('change');assert.equal(f.frames.size,0,'reduced motion keeps a static frame');
}
assert(!/createOpticalField|feTurbulence|style\.filter=/.test(fs.readFileSync('src/about-story.js','utf8')),'scroll transition has no full-screen shader, noise mask or animated blur');
console.log('PASS: scroll coalescing, cached geometry, reversible lightweight entrance, offscreen/menu/modal/tab suspension, reduced motion, deferred WebGL, device raster/frame budgets.');
