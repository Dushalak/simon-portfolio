const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const eventTarget=(object={})=>{const listeners={};object.addEventListener=(name,fn)=>(listeners[name]??=[]).push(fn);object.removeEventListener=(name,fn)=>listeners[name]=(listeners[name]||[]).filter(listener=>listener!==fn);object.emit=(name,arg={})=>listeners[name]?.forEach(fn=>fn(arg));return object;};
const document=eventTarget({hidden:false}),root={open:true};let callback,disconnected=0;
const window={};
vm.runInNewContext(fs.readFileSync('src/case-images.js','utf8'),{window,document,IntersectionObserver:class{constructor(fn,options){callback=fn;assert.equal(options.root,root);assert.equal(options.rootMargin,'450px 0px');}observe(){}unobserve(){}disconnect(){disconnected++;}}});
const order=[],images=Array.from({length:16},(_,i)=>({dataset:{src:'page-'+i+'.webp',srcset:'mobile-'+i+'.webp 768w, page-'+i+'.webp 1280w'},set srcset(value){order.push('candidate-'+i);},set src(value){order.push('request-'+i);}}));
const loader=window.PortfolioCaseImages.create(root);loader.observe(images);assert.equal(order.length,0,'building a long case creates no eager image requests');
callback([{target:images[0],isIntersecting:true},{target:images[1],isIntersecting:false}]);assert.deepEqual(order,['candidate-0','request-0'],'load only the approached page, selecting responsive candidates first');
callback([{target:images[0],isIntersecting:true}]);assert.equal(order.length,2,'an image is assigned once');
document.hidden=true;callback([{target:images[1],isIntersecting:true}]);assert.equal(order.length,2,'background tabs do not start new page requests');document.hidden=false;document.emit('visibilitychange');
root.open=false;callback([{target:images[1],isIntersecting:true}]);assert.equal(order.length,2,'closed dialogs cannot request offscreen pages');root.open=true;
callback([{target:images[1],isIntersecting:true}]);assert.equal(order.length,4);loader.clear();callback([{target:images[2],isIntersecting:true}]);assert.equal(order.length,4,'old cases stop requesting after close or switch');loader.dispose();loader.observe(images);callback([{target:images[3],isIntersecting:true}]);assert.equal(order.length,4);assert(disconnected>=3);
const switched=window.PortfolioCaseImages.create(root);switched.observe([images[2]]);switched.observe([images[3]]);callback([{target:images[2],isIntersecting:true}]);assert.equal(order.length,4,'queued intersections from the previous case are ignored');switched.dispose();

const pictureWindow={},pictureDocument={querySelectorAll:()=>[],createElement:tag=>({tag,dataset:{},children:[],append(...children){this.children.push(...children);}})};
vm.runInNewContext(fs.readFileSync('src/asset-loading.js','utf8'),{window:pictureWindow,document:pictureDocument,IntersectionObserver:class{observe(){}disconnect(){}},addEventListener(){}});
const candidates='mobile.webp 1152w, desktop.webp 1920w',detailImage={dataset:{src:'desktop.webp'}};
const detailPicture=pictureWindow.PortfolioAssets.responsive(detailImage,candidates,true,true);
assert.equal(detailPicture.children[0].dataset.srcset,'mobile.webp 1152w');assert.equal(detailPicture.children[1].dataset.srcset,'desktop.webp 1920w','desktop details always select the sharper variant');assert.equal(detailPicture.children[1].media,'(min-width:721px)');assert.equal(detailImage.src,undefined,'picture creation preserves deferred requests');
assert.equal(pictureWindow.PortfolioAssets.responsive({},candidates).children.length,2,'gallery source selection is unchanged');
const coverPicture=pictureWindow.PortfolioAssets.responsive({},'mobile.webp 1536w, desktop.webp 2560w',false,true);assert.equal(coverPicture.children[0].srcset,'mobile.webp 1536w');assert.equal(coverPicture.children[1].srcset,'desktop.webp 2560w');

const lazyWindow=eventTarget({portfolioDirectProject:false}),idle=[],scripts=[],nodes={about:{id:'about'},contact:{id:'contact'}};let intersect;
lazyWindow.PortfolioHeroPerformance={afterLoadIdle(fn){const job={fn,cancelled:false};idle.push(job);return ()=>job.cancelled=true;}};
const lazyDocument={getElementById:id=>nodes[id],querySelectorAll:()=>[],createElement:()=>({remove(){this.removed=true;}}),head:{append(script){scripts.push(script);}}};
vm.runInNewContext(fs.readFileSync('src/deferred-effects.js','utf8'),{window:lazyWindow,document:lazyDocument,AbortController,Promise,addEventListener:lazyWindow.addEventListener,IntersectionObserver:class{constructor(fn){intersect=fn;}observe(){}unobserve(){}disconnect(){}}});
assert.equal(scripts.length,0,'decorative chunks are absent from startup');intersect([{target:nodes.about,isIntersecting:true}]);assert.equal(scripts.length,0,'approaching effects still follow paint/idle');idle[0].fn();assert.equal(scripts.length,1);
const api=lazyWindow.PortfolioDeferredEffects,promise=api.warm('about');assert.equal(promise,api.warm('about'),'one shared chunk request');assert.equal(scripts.length,1);assert.equal(scripts[0].fetchPriority,'low');scripts[0].onload();
api.warm('footer');assert.equal(scripts.length,2);scripts[1].onerror();api.warm('footer');assert.equal(scripts.length,3,'failed optional chunks can retry without breaking content');
intersect([{target:nodes.contact,isIntersecting:true}]);lazyWindow.emit('pagehide',{persisted:false});assert(idle.every(job=>job.cancelled));idle.at(-1).fn();api.warm('footer');assert.equal(scripts.length,3,'unload cancels delayed initialization');

const browser=fs.readFileSync('src/project-browser.js','utf8');assert(!browser.includes('await content.ready'),'navigation must not wait for image decode');
const media=JSON.parse(fs.readFileSync('src/project-media.js','utf8').split('window.PortfolioProjectMedia = ')[1].trim().replace(/;$/,''));
const data=JSON.parse(fs.readFileSync('dist/'+media.dataURL,'utf8'));assert.deepEqual(Object.fromEntries(Object.entries(data).map(([key,pages])=>[key,pages.length])),{nelu:16,yuxu:11,qingyu:10,aigc:3});
for(const pages of Object.values(data))for(const page of pages){assert(page.src.endsWith('.webp'));assert.equal(page.width,1920);for(const candidate of page.srcset.split(',')){assert(fs.statSync('dist/'+candidate.trim().split(' ')[0]).size<2000000);}}
for(const cover of Object.values(media.detailCovers)){assert.equal(cover.coverWidth,2560);assert.equal(cover.coverSrcset.split(',')[0].trim().split(' ')[1],'1536w');assert(fs.statSync('dist/'+cover.cover).size<2000000);}
const html=fs.readFileSync('dist/index.html','utf8');assert(!html.includes('html.intro-pending .hero-reveal{opacity:0}'),'slow JS cannot hide the initial Hero title');
assert(!/http[s]?:\/\/fonts\.(googleapis|gstatic)\.com/.test(html),'no external font blocking dependency');
console.log('PASS: strict dialog lazy loading, responsive source order, hidden/closed/disposed lifecycle, deferred chunk deduplication/retry/cleanup, nonblocking navigation, image budgets and immediate core copy.');
