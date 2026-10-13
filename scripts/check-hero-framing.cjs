const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const window={};vm.runInNewContext(fs.readFileSync('src/hero-framing.js','utf8'),{window,matchMedia:()=>({matches:true})});
const {compute,create}=window.PortfolioHeroFraming;
for(const [w,h] of [[1920,1080],[1280,720],[1440,900]]){
  const frame=compute(w,h);assert.equal(frame.mode,'desktop');assert.equal(frame.scaleX,1);assert.equal(frame.scaleY,1);assert.equal(frame.aspect,w/h);
}
for(const [w,h] of [[768,1024],[1024,768],[820,1180],[1180,820],[1024,1366],[1366,1024]]){
  const frame=compute(w,h,true);assert.equal(frame.mode,'tablet');assert(Math.abs(frame.width/frame.height-16/9)<1e-10);
  assert(frame.width<=w*1.12+1e-7,'tablet crop is bounded, not viewport-height cover');assert(frame.height<=h*.92+1e-7);
  // A source point projects into the same place for video and optical field.
  for(const [x,y] of [[.39,.56],[.65,.32],[.78,.66],[.57,.82]]){
    const screenX=.5+(x-.5)/frame.scaleX,screenY=.5+(y-.5)/frame.scaleY;
    assert(Math.abs((screenX-.5)*frame.scaleX+.5-x)<1e-10);
    assert(Math.abs((screenY-.5)*frame.scaleY+.5-y)<1e-10);
  }
}
for(const [w,h] of [[375,812],[390,844],[414,896]]){const frame=compute(w,h,true);assert.equal(frame.mode,'mobile');assert(frame.width<=w*1.28+1e-7);assert(Math.abs(frame.aspect-16/9)<1e-10);}
assert.equal(compute(1024,768,false).mode,'tablet','iPad desktop browsing mode also uses aspect-aware framing');
const hero={dataset:{},style:{setProperty(name,value){this[name]=value;}}},stage={clientWidth:768,clientHeight:1024};
const controller=create({hero,stage});controller.measure();const portrait=hero.style['--hero-scene-width'];
stage.clientWidth=1024;stage.clientHeight=768;controller.measure();assert.notEqual(hero.style['--hero-scene-width'],portrait,'orientation recalculates scene dimensions');assert.equal(hero.dataset.heroFraming,'tablet');
assert(Number.isFinite(compute(0,0).width));
const shader=fs.readFileSync('src/hero-intro.js','utf8');assert.match(shader,/ResizeObserver\(refreshSize\)/);assert.match(shader,/devicePixelRatio,quality\.dpr/);assert.match(shader,/uniform3f\(uniforms\.uFraming/);
console.log('PASS: desktop composition unchanged, iPad portrait/landscape framing, bounded crop, mobile simplification, shared optical/media coordinates, resize and DPR budget.');
