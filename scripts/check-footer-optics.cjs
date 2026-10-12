const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

function fixture(){
  const pending=[];
  const node=()=>({children:[],style:{setProperty(k,v){this[k]=v;}},classList:{values:new Set(),add(k){this.values.add(k);},remove(k){this.values.delete(k);}},replaceChildren(...children){this.children=children;}});
  const beam=node(),glow=node(),root={dataset:{},querySelector:s=>s==='.bwf-beam'?beam:glow};
  const palette={ang:'118deg','prism-strength':'.38','glow-strength':'.21',lit:'255,255,255',red:'250,74,92',orange:'247,155,86',yellow:'245,208,113',green:'119,224,176',cyan:'107,219,245',blue:'105,157,241',violet:'182,130,239'};
  const window={};
  vm.runInNewContext(fs.readFileSync('src/footer-optics.js','utf8'),{
    window,Image:class{constructor(){this.style={};}setAttribute(){}decode(){return new Promise((resolve,reject)=>pending.push({resolve,reject}));}},
    getComputedStyle:()=>({getPropertyValue:k=>palette[k.replace('--bwf-','')]||''})
  });
  return {beam,glow,root,pending,optics:window.PortfolioFooterOptics.create(root)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

(async()=>{
  const f=fixture();
  f.optics.resize(1000,780,920);f.optics.update(62,180,240,.7);
  assert.equal(f.beam.children.length,0,'keep CSS while cache decodes');
  f.pending.splice(0).forEach(p=>p.resolve());await settle();
  assert.equal(f.root.dataset.optics,'cached');assert.equal(f.beam.children.length,1);assert.equal(f.glow.children.length,4);
  assert.equal(f.glow.children[0].style.opacity,'0.7','retain pointer state across asynchronous decode');
  f.optics.resize(1100,780,1020);const old=f.pending.splice(0);
  f.optics.resize(1200,780,1120);const latest=f.pending.splice(0);
  latest.forEach(p=>p.resolve());await settle();const image=f.beam.children[0];
  old.forEach(p=>p.resolve());await settle();assert.equal(f.beam.children[0],image,'older resize cannot replace newer cache');
  f.optics.resize(1300,780,1220);f.optics.update(67,320,250,.8);
  f.pending.splice(0).forEach(p=>p.reject(new Error('decode unavailable')));await settle();
  assert.equal(f.root.dataset.optics,'css');assert.equal(f.beam.children.length,0);assert.equal(f.glow.children.length,0);
  assert(!f.beam.classList.values.has('bwf-optics-cached'));assert.equal(f.beam.style['--bwf-b'],'67%');assert.equal(f.glow.style['--bwf-g'],'0.8');
  const disposed=fixture();disposed.optics.resize(1000,780,920);disposed.optics.dispose();
  disposed.pending.splice(0).forEach(p=>p.resolve());await settle();
  assert.equal(disposed.beam.children.length,0,'decode completion cannot restore disposed layers');
  console.log('PASS: asynchronous cache state, resize race, CSS fallback after decode failure, disposal during decode.');
})().catch(error=>{console.error(error);process.exitCode=1;});
