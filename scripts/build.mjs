import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import postcss from 'postcss';
import {minify} from 'terser';

const cssFiles=['styles','refinement','hero','menu','about-story','about-work','beam-wordmark-footer','what-i-bring','projects','project-navigation','fold-text','swipe-toast','portfolio-interactions'];
const jsFiles=['hero-performance','hero-video','asset-loading','copy-confetti','swipe-toast','fold-text','scroll-reveal','project-data','projects','page-transition','project-atmosphere','project-browser','bring-sparkles','portfolio-interactions','app','hero-intro','about-story','about-hive','hero-motion','footer-optics','beam-wordmark-footer','about-holo','what-i-bring','portfolio-ripple'];
const sources=await Promise.all(jsFiles.map(f=>readFile(`src/${f}.js`,'utf8')));
const html=await readFile('dist/index.html','utf8');
const references=html+'\n'+sources.join('\n');
// These classes belonged to superseded page structures; none is produced or queried.
const legacy=['hero-topline','hero-content','hero-sub','hero-word','hero-index','hero-shade','primary-button','button-dot','work-intro','project-copy','project-meta','case-button','next-project','project-art','nelu-art','art-label','art-hover','about-image','about-copy','about-facts','about-lead','serif-word','text-link','hero-enter'];
const unused=legacy.filter(name=>!references.includes(name));
const styles=await Promise.all(cssFiles.map(f=>readFile(`src/${f}.css`,'utf8')));
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
const js=await minify(sources.join('\n;\n'),{ecma:2020,compress:{passes:2,unsafe:false},mangle:{toplevel:false},format:{comments:false,ascii_only:true}});
if(!js.code)throw Error('Empty JS output');
await mkdir('dist',{recursive:true});
await copyFile('src/_redirects','dist/_redirects');
await writeFile('dist/site.css',css);await writeFile('dist/site.js',js.code+'\n');
const version=createHash('sha256').update(css+js.code).digest('hex').slice(0,12);
const next=html.replace(/href="site\.css\?v=[^"]*"/,'href="site.css?v='+version+'"').replace(/src="site\.js\?v=[^"]*"/,'src="site.js?v='+version+'"');
await writeFile('dist/index.html',next);
console.log(JSON.stringify({cssBytes:Buffer.byteLength(css),jsBytes:Buffer.byteLength(js.code),removedRules,removedDuplicates,unusedClasses:unused,version}));
