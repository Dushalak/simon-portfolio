import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
import {minify} from 'terser';

const cssFiles=['styles','refinement','hero','menu','about-story','about-work','beam-wordmark-footer','what-i-bring','projects','project-navigation','fold-text','swipe-toast','portfolio-interactions'];
const jsFiles=['hero-performance','hero-framing','scroll-activity','hero-video','asset-loading','deferred-effects','about-resources','copy-confetti','swipe-toast','fold-text','scroll-reveal','project-media','project-data','projects','page-transition','project-atmosphere','case-images','project-browser','bring-sparkles','portfolio-interactions','app','hero-intro','about-story','about-hive','hero-motion','what-i-bring','portfolio-ripple'];
const lazyFiles={about:['about-holo'],footer:['footer-optics','beam-wordmark-footer']};
const minifyOptions={ecma:2020,compress:{passes:2,unsafe:false},mangle:{toplevel:false},format:{comments:false,ascii_only:true}};
await mkdir('dist/effects',{recursive:true});
const lazy=await Promise.all(Object.entries(lazyFiles).map(async([name,files])=>{
  const sources=await Promise.all(files.map(file=>readFile(`src/${file}.js`,'utf8')));
  const result=await minify(sources.join('\n;\n'),minifyOptions);
  const version=createHash('sha256').update(result.code).digest('hex').slice(0,12),url=`effects/${name}.${version}.js`;
  await writeFile('dist/'+url,result.code+'\n');return {name,url,bytes:Buffer.byteLength(result.code),sources};
}));
const sources=await Promise.all(jsFiles.map(f=>readFile(`src/${f}.js`,'utf8').then(source=>lazy.reduce((text,chunk)=>text.replace(`__${chunk.name.toUpperCase()}_EFFECTS_URL__`,chunk.url),source))));
const html=await readFile('dist/index.html','utf8');
const media=JSON.parse((await readFile('src/project-media.js','utf8')).split('window.PortfolioProjectMedia = ')[1].trim().replace(/;$/,''));
const references=html+'\n'+sources.join('\n')+'\n'+lazy.flatMap(chunk=>chunk.sources).join('\n');
// These classes belonged to superseded page structures; none is produced or queried.
const legacy=['hero-topline','hero-content','hero-sub','hero-word','hero-index','hero-shade','primary-button','button-dot','work-intro','project-copy','project-meta','case-button','next-project','project-art','nelu-art','art-label','art-hover','about-image','about-copy','about-facts','about-lead','serif-word','text-link','hero-enter'];
const unused=legacy.filter(name=>!references.includes(name));
const styles=await Promise.all(cssFiles.map(f=>readFile(`src/${f}.css`,'utf8').then(source=>Object.entries(media.aboutTextures||{}).reduce((text,[from,to])=>text.replaceAll(from,to),source))));
if(process.argv.includes('--clean-sources')){
  for(let i=0;i<styles.length;i++){
    const sheet=postcss.parse(styles[i]);
    sheet.walkRules(rule=>{if(rule.selectors.every(selector=>unused.some(name=>new RegExp('\\.'+name+'(?![\\w-])').test(selector))))rule.remove();});
    await writeFile(`src/${cssFiles[i]}.css`,sheet.toString());styles[i]=sheet.toString();
  }
}
const root=postcss.parse(styles.join('\n'));
let removedRules=0,removedDuplicates=0;
root.walkRules(rule=>{
  if(rule.selectors.every(selector=>unused.some(name=>new RegExp('\\.'+name+'(?![\\w-])').test(selector)))){rule.remove();removedRules++;return;}
  const seen=new Set();
  [...rule.nodes].reverse().forEach(node=>{
    if(node.type!=='decl')return;
    const key=node.prop+'\0'+node.value+'\0'+Boolean(node.important);
    if(seen.has(key)){node.remove();removedDuplicates++;}else seen.add(key);
  });
});
root.walkComments(node=>node.remove());
root.walk(node=>{
  node.raws.before='';
  if(node.type==='decl')node.raws.between=':';
  if(node.type==='rule'||node.type==='atrule'){node.raws.after='';node.raws.between='';node.raws.semicolon=false;}
});
const css=root.toString();
// Keep execution order and public window APIs. No unsafe transformations.
const js=await minify(sources.join('\n;\n'),minifyOptions);
if(!js.code)throw Error('Empty JS output');
await mkdir('dist',{recursive:true});
await copyFile('src/_redirects','dist/_redirects');
await copyFile('src/_headers','dist/_headers');
await writeFile('dist/site.css',css);await writeFile('dist/site.js',js.code+'\n');
const version=createHash('sha256').update(css+js.code).digest('hex').slice(0,12);
const next=html.replace(/href="site\.css\?v=[^"]*"/,'href="site.css?v='+version+'"').replace(/src="site\.js\?v=[^"]*"/,'src="site.js?v='+version+'"')
  .replace(/<link rel="preload" as="image"[^>]*>/g,'')
  .replace('<link rel="canonical"',`<link rel="preload" as="image" media="(max-width:720px)" href="${media.hero.srcset.split(',')[0].trim().split(' ')[0]}" fetchpriority="high">\n  <link rel="preload" as="image" media="(min-width:721px)" href="${media.hero.src}" imagesrcset="${media.hero.srcset}" imagesizes="100vw" fetchpriority="high">\n  <link rel="canonical"`)
  .replace(/<picture class="hero-poster-picture">[\s\S]*?<\/picture>|<img class="scene-poster"[^>]*>/,`<picture class="hero-poster-picture"><source media="(max-width:720px)" type="image/webp" srcset="${media.hero.srcset.split(',')[0].trim()}"><img class="scene-poster" src="${media.hero.src}" srcset="${media.hero.srcset}" sizes="100vw" alt="" width="${media.hero.width}" height="${media.hero.height}" fetchpriority="high"></picture>`)
  .replace(/preload="none" poster="[^"]*"/,'preload="none"')
  .replace(/data-fallback-src="[^"]*"/g,`data-fallback-src="${media.heroFallback}"`)
  .replaceAll('https://jin-wangliang-portfolio.yummy-rain-9843.chatgpt.site/','https://simon-portfolio1.netlify.app/')
  .replace(/(<meta property="og:image" content=")[^"]*/,`$1https://simon-portfolio1.netlify.app/${media.covers.nelu.cover}`)
  .replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n');
await writeFile('dist/index.html',next);
console.log(JSON.stringify({cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js.code),deferred:lazy.map(({name,url,bytes})=>({name,url,bytes})),removedRules,removedDuplicates,unusedClasses:unused,version}));
