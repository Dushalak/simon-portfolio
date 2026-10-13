const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function target(object={}){const handlers={};object.addEventListener=(name,fn)=>(handlers[name]??=[]).push(fn);object.emit=(name,arg={})=>handlers[name]?.forEach(fn=>fn(arg));return object;}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function resourceFixture({direct=false,reject=false}={}){
  const preview={dataset:{}},portrait={dataset:{}},reveal={dataset:{}},images=[];let finishDecode;
  const gate=new Promise((resolve,rejectPromise)=>{finishDecode=reject?()=>rejectPromise(Error('candidate changed')):resolve;});
  for(const kind of ['preview','portrait'])images.push(target({dataset:{src:'image.webp'},complete:false,naturalWidth:0,decode:()=>gate,closest:selector=>selector==='.about-hive-preview'&&kind==='preview'?preview:selector==='.about-portrait'&&kind==='portrait'?portrait:null}));
  const section={dataset:{},querySelectorAll:()=>images,querySelector:()=>reveal},hero={dataset:{intro:'complete'}},activity={scrolling:false,subscribe(fn){this.fn=fn;return ()=>this.fn=null;}};
  const window=target({portfolioDirectProject:direct,PortfolioScrollActivity:activity}),readyEvents=[],fonts=[],loadCalls=[];let idle,cancelled=false,prepares=0;
  window.PortfolioHeroPerformance={afterLoadIdle(fn){idle=fn;return ()=>cancelled=true;}};
  window.PortfolioAssets={load(image){loadCalls.push(image);delete image.dataset.src;}};
  window.PortfolioAboutHive={prepare(){prepares++;}};
  const document=target({hidden:false,querySelector:s=>s==='#about'?section:hero,querySelectorAll:()=>[],fonts:{load(font){fonts.push(font);return Promise.resolve([]);}}});
  class Texture{decode(){return Promise.resolve();}}
  vm.runInNewContext(fs.readFileSync('src/about-resources.js','utf8'),{window,document,Image:Texture,Event,Promise,AbortController,addEventListener:window.addEventListener,dispatchEvent:event=>readyEvents.push(event.type)});
  return {window,document,section,preview,portrait,reveal,images,activity,loadCalls,fonts,readyEvents,idle:()=>idle?.(),finishDecode,prepares:()=>prepares,cancelled:()=>cancelled};
}
(async()=>{
  const f=resourceFixture();assert.equal(f.loadCalls.length,0,'core paint comes before next-chapter requests');f.idle();
  const p=f.window.PortfolioAboutResources.warm();assert.equal(p,f.window.PortfolioAboutResources.warm(),'one shared preload promise');assert.equal(f.loadCalls.length,2);assert.equal(f.fonts.length,5);
  assert(f.images.every(image=>image.fetchPriority==='low'&&image.loading==='eager'));
  f.window.emit('portfolio:intro-complete');assert.equal(f.prepares(),1,'background preparation does not wait for a pending portrait/font job');
  f.activity.scrolling=true;f.finishDecode();await p;assert.equal(f.preview.dataset.ready,'true');assert.equal(f.portrait.dataset.portraitReady,'true');assert.equal(f.readyEvents.length,0,'resource completion cannot force a layout refresh during scroll');
  f.activity.scrolling=false;f.activity.fn(false);assert.deepEqual(f.readyEvents,['portfolio:about-ready']);assert.equal(f.section.dataset.aboutAssets,'ready');
  const direct=resourceFixture({direct:true});direct.idle();direct.window.emit('portfolio:intro-complete');assert.equal(direct.loadCalls.length,0,'direct case entry keeps home assets deferred');
  const disposed=resourceFixture();disposed.idle();disposed.window.emit('pagehide',{persisted:false});disposed.finishDecode();await settle();assert(disposed.cancelled());assert.equal(disposed.preview.dataset.ready,undefined);assert.equal(disposed.readyEvents.length,0);
  const hidden=resourceFixture();hidden.idle();hidden.document.hidden=true;hidden.finishDecode();await hidden.window.PortfolioAboutResources.warm();assert.equal(hidden.readyEvents.length,0,'a background tab does not remeasure layout');hidden.document.hidden=false;hidden.document.emit('visibilitychange');assert.equal(hidden.readyEvents.length,1);
  const changed=resourceFixture({reject:true});changed.idle();changed.finishDecode();await changed.window.PortfolioAboutResources.warm();assert.equal(changed.section.dataset.aboutAssets,'partial','failed resources never hang navigation');changed.images[1].naturalWidth=640;changed.images[1].emit('load');await settle();assert.equal(changed.portrait.dataset.portraitReady,'true','a later responsive candidate remains displayable after decode rejects');

  // The native picture candidates are selected before the PNG fallback is assigned.
  const order=[],source={dataset:{srcset:'portrait-640.webp 640w'},set srcset(value){order.push('source');}},image={dataset:{src:'fallback.png'},closest:()=>({querySelectorAll:()=>[source]}),set src(value){order.push('img');}};
  const loaderWindow={};vm.runInNewContext(fs.readFileSync('src/asset-loading.js','utf8'),{window:loaderWindow,document:{querySelectorAll:()=>[]},IntersectionObserver:class{observe(){}unobserve(){}disconnect(){}},addEventListener(){}});
  loaderWindow.PortfolioAssets.load(image);loaderWindow.PortfolioAssets.load(image);assert.deepEqual(order,['source','img'],'responsive loading is idempotent and avoids selecting the fallback first');

  const node=dataset=>({dataset,style:{setProperty(){},removeProperty(key){delete this[key];}},setAttribute(){},removeAttribute(){}});
  const groups=['title','greeting','portrait','biography','work','experience-one','experience-two'].map(key=>node({aboutGroup:key}));
  const about=node({}),reveal=node({}),board=node({}),scene=node({});
  const title={offsetWidth:322,offsetHeight:77,style:{setProperty(){}},querySelectorAll:()=>[]};
  about.querySelector=s=>s==='.about-reveal'?reveal:s==='.about-board'?board:title;about.querySelectorAll=()=>groups;about.getBoundingClientRect=()=>({top:1000});
  const hero={querySelector:()=>scene},window={PortfolioHeroPerformance:{profile:{tier:'high'}}};
  const document={querySelector:()=>about,querySelectorAll:()=>[],documentElement:{style:{setProperty(){}},classList:{toggle(){},remove(){}}}};
  vm.runInNewContext(fs.readFileSync('src/about-story.js','utf8'),{window,document,AbortController,matchMedia:()=>({matches:true})});
  const story=window.PortfolioAbout.create({hero,stage:{clientWidth:1280,clientHeight:842},reduced:{matches:false}});
  const output=story.render(.3/.84,true);assert.equal(scene.style.opacity,'1');assert(Number(reveal.style.opacity)>0&&Number(reveal.style.opacity)<1);
  assert.equal(output,story.render(.4/.84,true),'scroll state object is reused');assert.equal(scene.style.opacity,'1','the outgoing backdrop stays painted below the incoming fade');
  story.render(.5/.84,true);assert.equal(reveal.style.opacity,'1');assert.equal(scene.style.opacity,'0','video backdrop retires only after the next backdrop is opaque');
  story.render(.99,true);assert.equal(about.dataset.storyMode,'transition');assert(Number(groups.at(-1).style.opacity)<1,'the pin does not keep holding after the last text finishes');
  story.render(1,true);assert.equal(about.dataset.storyMode,'settled');assert.equal(groups.at(-1).style.opacity,'1');assert.equal(groups[0].style.opacity,'1');assert.equal(groups[2].style.opacity,'1');story.render(0,true);assert.equal(scene.style.opacity,'1','reverse browsing restores the homepage');story.dispose();
  console.log('PASS: deferred/shared next-chapter preload, independent GPU preparation, responsive candidate selection, decode recovery, scroll-safe readiness, disposal and continuous/reversible crossfade.');
})().catch(error=>{console.error(error);process.exitCode=1;});
