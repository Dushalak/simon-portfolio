const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function events(target={}){
  const handlers=new Map();target.addEventListener=(name,callback,options={})=>{const list=handlers.get(name)||[];list.push({callback,once:options.once});handlers.set(name,list);};
  target.removeEventListener=(name,callback)=>handlers.set(name,(handlers.get(name)||[]).filter(h=>h.callback!==callback));
  target.emit=(name,value={})=>{for(const h of [...(handlers.get(name)||[])]){if(h.once)target.removeEventListener(name,h.callback);h.callback(value);}};return target;
}
function policyFixture({mobile=false,cores=8,memory=8,connection,hidden=false,readyState='loading'}={}){
  const window=events({}),document=events({hidden,readyState,querySelector:()=>({setAttribute(){}})}),frames=new Map(),timers=new Map(),idles=new Map();let id=0;
  const sandbox={window,document,navigator:{hardwareConcurrency:cores,deviceMemory:memory,connection},matchMedia:()=>({matches:mobile}),
    addEventListener:window.addEventListener,removeEventListener:window.removeEventListener,
    requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:i=>frames.delete(i),
    setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:i=>timers.delete(i)};
  sandbox.requestIdleCallback=window.requestIdleCallback=f=>{idles.set(++id,f);return id;};sandbox.cancelIdleCallback=window.cancelIdleCallback=i=>idles.delete(i);
  vm.runInNewContext(fs.readFileSync('src/hero-performance.js','utf8'),sandbox);
  const flush=q=>{const work=[...q.values()];q.clear();work.forEach(f=>f(16));};
  return {policy:window.PortfolioHeroPerformance,window,document,frame:()=>flush(frames),idle:()=>flush(idles),timeout:()=>flush(timers)};
}
assert.equal(policyFixture().policy.profile.tier,'high');
assert.equal(policyFixture({mobile:true}).policy.profile.tier,'balanced');
for(const input of [{cores:4},{memory:2},{connection:{saveData:true}},{connection:{effectiveType:'2g'}}])assert.equal(policyFixture(input).policy.profile.tier,'low');
const deferred=policyFixture();let work=0;deferred.policy.afterLoadIdle(()=>work++);assert.equal(work,0);
deferred.window.emit('load');assert.equal(work,0);deferred.frame();assert.equal(work,0);deferred.frame();assert.equal(work,0);deferred.idle();assert.equal(work,1,'heavy work follows load, paint and idle');
const cancelled=policyFixture();cancelled.policy.afterLoadIdle(()=>work++)();cancelled.window.emit('load');cancelled.frame();cancelled.frame();cancelled.idle();assert.equal(work,1,'cancelled work never starts');
const hidden=policyFixture({hidden:true});hidden.policy.afterLoadIdle(()=>work++);hidden.timeout();hidden.frame();assert.equal(work,1);hidden.document.hidden=false;hidden.document.emit('visibilitychange');hidden.frame();hidden.frame();hidden.idle();assert.equal(work,2,'hidden tabs wait for visibility');

function videoFixture({reduced=false,intro=false,direct=false,reject=false,rejectOnce=false}={}){
  const root=events({dataset:{},querySelector:()=>({})}),source={},main={inert:false},dialog={open:false};
  const video=events({paused:true,loadCalls:0,playCalls:0,pauseCalls:0,querySelector:()=>source,closest:()=>root,classList:{add(){},remove(){}},
    load(){this.loadCalls++;},pause(){this.paused=true;this.pauseCalls++;},play(){this.playCalls++;if(reject||(rejectOnce&&this.playCalls===1))return Promise.reject(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve();}});
  const motion=events({setAttribute(){},contains(target){return target===this;}}),preference=events({matches:reduced}),document=events({hidden:false,querySelector:()=>main}),window=events({portfolioIntroLocked:intro,portfolioDirectProject:direct});
  const observers=[],mutations=[];let loadReady,cancelled=false;
  window.PortfolioHeroPerformance={profile:{tier:'low',video:'assets/home-enhanced-low.mp4'},afterLoadIdle:f=>{loadReady=f;return ()=>cancelled=true;}};
  vm.runInNewContext(fs.readFileSync('src/hero-video.js','utf8'),{window,document,matchMedia:()=>preference,AbortController,Promise,
    addEventListener:window.addEventListener,
    IntersectionObserver:class{constructor(f){this.callback=f;observers.push(this);}observe(){}disconnect(){this.closed=true;}},
    MutationObserver:class{constructor(f){this.callback=f;mutations.push(this);}observe(){}disconnect(){this.closed=true;}}});
  const api=window.PortfolioHeroVideo.create({video,motion,dialog});
  return {root,source,main,dialog,video,motion,preference,document,window,api,loadReady:()=>loadReady(),enter:()=>observers[0].callback([{isIntersecting:true}]),leave:()=>observers[0].callback([{isIntersecting:false}]),mutate:()=>mutations[0].callback(),closed:()=>cancelled&&observers[0].closed&&mutations[0].closed};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const f=videoFixture({intro:true});assert.equal(f.video.loadCalls,0,'no eager media request');f.loadReady();assert.equal(f.video.playCalls,0);
  f.window.emit('portfolio:light-reveal');await settle();assert.equal(f.source.src,'assets/home-enhanced-low.mp4');assert.equal(f.video.loadCalls,1);assert.equal(f.video.paused,false);
  f.leave();assert.equal(f.video.paused,true);f.enter();await settle();assert.equal(f.video.paused,false);assert.equal(f.video.loadCalls,1,'resume reuses existing source');
  f.motion.emit('click');f.leave();f.enter();await settle();assert.equal(f.video.paused,true,'manual pause survives re-entry');f.motion.emit('click');await settle();assert.equal(f.video.paused,false);
  f.document.hidden=true;f.document.emit('visibilitychange');assert.equal(f.video.paused,true);f.document.hidden=false;f.document.emit('visibilitychange');await settle();assert.equal(f.video.paused,false);
  for(const block of ['dialog','menu','scene']){
    if(block==='dialog')f.dialog.open=true;if(block==='menu')f.main.inert=true;if(block==='scene')f.root.dataset.sceneVisible='false';f.mutate();assert.equal(f.video.paused,true,block);
    f.dialog.open=false;f.main.inert=false;f.root.dataset.sceneVisible='true';f.mutate();await settle();assert.equal(f.video.paused,false);
  }
  f.window.emit('pagehide',{persisted:false});assert(f.closed(),'cancel pending work and observers on unload');
  const reduced=videoFixture({reduced:true});reduced.loadReady();await settle();assert.equal(reduced.video.loadCalls,1,'requested default background playback also applies with reduced motion');
  assert.equal(reduced.video.paused,false);assert.equal(reduced.video.defaultMuted,true);assert.equal(reduced.video.muted,true);assert.equal(reduced.video.playsInline,true,'Safari playback is muted and inline');assert.equal(reduced.root.dataset.videoMotion,'enabled');
  reduced.motion.emit('click');reduced.document.emit('touchend');await settle();assert.equal(reduced.video.paused,true,'gestures never undo a manual pause');reduced.motion.emit('click');await settle();assert.equal(reduced.video.paused,false);
  const direct=videoFixture({direct:true});direct.loadReady();assert.equal(direct.video.loadCalls,0,'direct project entry skips Hero video');direct.dialog.open=true;direct.mutate();direct.leave();direct.dialog.open=false;direct.mutate();assert.equal(direct.video.loadCalls,0);direct.enter();await settle();assert.equal(direct.video.loadCalls,1);
  const rejected=videoFixture({reject:true});rejected.loadReady();await settle();rejected.leave();rejected.enter();await settle();assert.equal(rejected.video.playCalls,1,'autoplay rejection does not loop or become a manual pause');assert.match(rejected.motion.innerHTML,/暂停动画/);
  for(const gesture of ['pointerdown','touchend','keydown']){
    const retry=videoFixture({rejectOnce:true});retry.loadReady();await settle();retry.document.emit(gesture);await settle();assert.equal(retry.video.paused,false,gesture+' retries blocked autoplay');assert.equal(retry.video.loadCalls,1,'gesture retry reuses the loaded source');
  }
  const buttonRetry=videoFixture({rejectOnce:true});buttonRetry.loadReady();await settle();buttonRetry.document.emit('pointerdown',{target:buttonRetry.motion});assert.equal(buttonRetry.video.playCalls,1,'toggle gesture must not cause a play/pause double action');buttonRetry.motion.emit('click');await settle();assert.equal(buttonRetry.video.paused,false,'toggle can explicitly retry blocked playback');
  assert.match(fs.readFileSync('src/hero.css','utf8'),/data-video-motion=enabled\] \.bg-video\{display:block\}/,'enabled Hero video remains visible under reduced motion');
  const failed=videoFixture();failed.loadReady();await settle();failed.video.emit('error');assert.equal(failed.video.paused,true);assert.equal(failed.root.dataset.videoState,'poster');failed.leave();failed.enter();await settle();assert.equal(failed.video.playCalls,1,'a media error does not trigger repeated downloads');failed.motion.emit('click');await settle();assert.equal(failed.video.playCalls,2,'manual retry stays available');

  const intro=fs.readFileSync('src/hero-intro.js','utf8');
  assert.match(intro,/premultipliedAlpha: true/,'WebGL output must match the canvas compositor alpha convention');
  assert.match(intro,/gl_FragColor=vec4\(min\(silver,vec3\(alpha\)\),alpha\)/,'transparent edge pixels must not carry full white RGB');
  assert(!intro.includes('silver/max(alpha'),'avoid amplifying low-alpha RGB before accelerated compositing');
  const prefix=intro.slice(intro.indexOf('  const labels'),intro.indexOf('  function construction'));
  let frameCount=0,completed=0;const clock={document:{hidden:false},window:{PortfolioHeroPerformance:{profile:{motionFps:30}}},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
  vm.runInNewContext(prefix+'\nthis.Timeline=MasterTimeline;',clock);
  const timeline=new clock.Timeline(()=>frameCount++,()=>completed++);timeline.duration=1000;timeline.assetsReady=true;
  const updates=[],animation={pause(){},cancel(){},set currentTime(t){updates.push(t);}};
  timeline.add({animate:()=>animation},[],100,0);for(let i=0;i<110&&!completed;i++)timeline.tick(i*1000/60);
  assert.equal(completed,1);assert(frameCount<50,'timeline calculations are capped');assert.equal(updates.at(-1),100);assert.equal(updates.filter(t=>t===100).length,1,'completed tweens stop receiving writes');
  timeline.finish();assert(timeline.done);
  const opening=fs.readFileSync('src/hero-motion.js','utf8').match(/  function animateOpening\(\) \{[\s\S]*?\n  \}/)[0];
  let starts=0;const startup={introDone:true,active:true,window:{PortfolioIntro:{create(){starts++;return {play(){}};}}},reduced:{matches:false},Element:{prototype:{animate(){}}},hero:{},config:{},finishIntro(){}};
  vm.runInNewContext(opening+'\nanimateOpening();',startup);assert.equal(starts,0,'a gesture that skips before the scheduled opening prevents late restart');
  startup.introDone=false;startup.active=false;vm.runInNewContext(opening+'\nanimateOpening();',startup);assert.equal(starts,0,'unloaded pages cannot initialize a delayed intro');
  console.log('PASS: device tiers, deferred/cancelled/hidden initialization, video budgets and all pause/resume paths, reduced motion, project entry, autoplay rejection, bounded master timeline.');
})().catch(error=>{console.error(error);process.exitCode=1;});
