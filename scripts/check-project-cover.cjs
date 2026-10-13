const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const node=tag=>({tag,dataset:{},style:{},children:[],listeners:{},classes:new Set(),classList:{add(name){this.owner.classes.add(name);}},append(...children){this.children.push(...children);},addEventListener(name,fn,options){this.listeners[name]=()=>{if(!options.signal.aborted)return fn();};}});
function setup(cached){
  const scheduled=[],requests=[],window={PortfolioProjectMedia:{detailCovers:{demo:{preview:'data:image/webp;base64,test',cover:'large.webp',coverSrcset:'small.webp 1536w, large.webp 2560w',coverWidth:2560,coverHeight:1920}}},PortfolioHeroPerformance:{afterPaint(fn){const job={fn,cancelled:false};scheduled.push(job);return ()=>job.cancelled=true;}},PortfolioAssets:{responsive(image,srcset){const picture=node('picture');picture.append(image);picture.deferredSrcset=srcset;return picture;},load(image){requests.push(image.dataset.src);image.src=image.dataset.src;delete image.dataset.src;}}};
  const document={createElement(tag){const element=node(tag);element.classList.owner=element;return element;},querySelector(){return cached;}};
  vm.runInNewContext(fs.readFileSync('src/project-cover.js','utf8'),{window,document,AbortController});
  const cover=window.PortfolioProjectCover.create('demo',{title:'Demo',coverSrcset:'gallery-small.webp 768w, gallery.webp 1280w'});
  const [low,picture]=cover.element.children,high=picture.children[0];picture.classList.owner=picture;
  return {cover,low,high,picture,requests,scheduled};
}
(async()=>{
  const test=setup({complete:true,naturalWidth:768,currentSrc:'cached.webp'});
  assert(test.cover.element.style.backgroundImage.includes('data:image/webp'),'preview is available without any image request');
  assert.equal(test.requests.length,0,'building does not race modal insertion');test.cover.start();test.cover.start();
  assert.deepEqual(test.requests,['cached.webp'],'reuse the actual cached gallery candidate');assert.equal(test.scheduled.length,1);
  assert.equal(test.picture.classes.size,0,'high resolution cannot cover the preview before decode');
  test.scheduled[0].fn();assert.deepEqual(test.requests,['cached.webp','large.webp']);
  let resolve;test.high.naturalWidth=2560;test.high.decode=()=>new Promise(done=>resolve=done);
  const loading=test.high.listeners.load();assert.equal(test.picture.classes.size,0);resolve();await loading;
  assert(test.picture.classes.has('is-ready'));assert.equal(test.cover.element.dataset.coverReady,'true');
  const failed=setup();failed.cover.start();failed.scheduled[0].fn();failed.high.naturalWidth=0;await failed.high.listeners.load();
  assert(!failed.picture.classes.has('is-ready'),'failed high image leaves the fallback visible');
  failed.high.naturalWidth=2560;failed.high.decode=()=>Promise.reject(Error('decode failed'));await failed.high.listeners.load();assert.equal(failed.picture.classes.size,0);
  const disposed=setup();disposed.cover.start();disposed.cover.dispose();assert(disposed.scheduled[0].cancelled);disposed.scheduled[0].fn();assert.deepEqual(disposed.requests,['gallery-small.webp']);
  const race=setup();race.cover.start();race.scheduled[0].fn();race.high.naturalWidth=2560;race.high.decode=()=>new Promise(done=>resolve=done);
  const pending=race.high.listeners.load();race.cover.dispose();resolve();await pending;assert.equal(race.picture.classes.size,0,'late decode cannot update a closed/switched cover');
  const source=fs.readFileSync('dist/site.js','utf8');
  assert(source.includes('window.PortfolioProjectMedia.pages='),'built application embeds chapter metadata');
  console.log('PASS: request-free cover preview, cached image reuse, after-paint high resolution, load/decode/error handling, cancelled/late lifecycle and bundled case metadata.');
})().catch(error=>{console.error(error);process.exitCode=1;});
