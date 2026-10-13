import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {Script} from 'node:vm';
import assert from 'node:assert/strict';
import postcss from 'postcss';

const html=await readFile('dist/index.html','utf8'),css=await readFile('dist/site.css','utf8');
const js=await readFile('dist/site.js','utf8');new Script(js,{filename:'site.js'});postcss.parse(css);
for(const file of await readdir('src'))if(file.endsWith('.js'))new Script(await readFile(join('src',file),'utf8'),{filename:file});
const paths=new Set();
for(const text of [html,css,js,...await Promise.all((await readdir('src')).map(f=>readFile(join('src',f),'utf8')))])
  for(const m of text.matchAll(/(?:assets\/[\w./-]+\.(?:webp|png|jpg|svg|woff2|mp4|json|js))/g))paths.add(m[0]);
for(const m of html.replace(/<base\b[^>]*>/g,'').matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^(?:https?:|data:)/.test(m[1]))paths.add(m[1].split('?')[0]);
const media=JSON.parse((await readFile('src/project-media.js','utf8')).split('window.PortfolioProjectMedia = ')[1].trim().replace(/;$/,''));
const data=JSON.parse(await readFile('dist/'+media.dataURL,'utf8'));
for(const match of js.matchAll(/effects\/[\w.-]+\.js/g))paths.add(match[0]);
for(const file of await readdir('dist/effects'))if(file.endsWith('.js'))new Script(await readFile('dist/effects/'+file,'utf8'),{filename:file});
const toolsSource=await readFile('src/what-i-bring.js','utf8');
for(const match of toolsSource.matchAll(/'([\w-]+\.(?:svg|png|webp))'/g))paths.add('assets/icons/tools/'+match[1]);
for(const pages of Object.values(data))for(const page of pages){paths.add(page.src);for(const candidate of page.srcset.split(','))paths.add(candidate.trim().split(' ')[0]);assert.equal(page.width,1920);assert((await stat('dist/'+page.src)).size<=2000000);}
const missing=[];for(const path of paths)try{assert((await stat(resolve('dist',path))).isFile());}catch{missing.push(path);}
assert.deepEqual(missing,[],'Referenced resources must exist');
assert.match(html,/<base href="\/">/,'Assets must resolve from the site root after SPA rewrites');
assert.match(await readFile('dist/_redirects','utf8'),/^\/\*\s+\/index\.html\s+200\s*$/m,'Publish the Netlify SPA fallback');
assert.equal(await readFile('dist/_headers','utf8'),await readFile('src/_headers','utf8'),'Netlify cache metadata must accompany the published artifact');
assert.match(await readFile('dist/_headers','utf8'),/max-age=31536000, immutable/);
assert.match(html,/<script defer src="site\.js\?v=/);
const externalScripts=html.match(/<script[^>]* src=/g)||[];
assert.equal(externalScripts.length,2,'One application script and one analytics beacon');
const beacon=html.match(/<script\b[^>]*src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"[^>]*><\/script>/g)||[];
assert.equal(beacon.length,1,'Analytics must not be injected twice');
assert.match(beacon[0],/type="module"/,'Analytics must use deferred module execution');
assert.match(beacon[0],/fetchpriority="low"/,'Analytics must not compete at high priority with core images');
assert.match(beacon[0],/data-cf-beacon='\{"token":"[a-f0-9]{32}"\}'/,'Analytics needs a real site token');
assert(html.indexOf(beacon[0])>html.indexOf('<script defer src="site.js?v='),'Application script precedes analytics');
assert.match(html,/<html lang="zh-CN">/);assert.match(html,/<meta name="description"/);assert.match(html,/<link rel="canonical"/);
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.match(css,/case-page-yuxu[^}]*border-radius:48px/);
assert.match(css,/case-page-yuxu img[^}]*clip-path:none/);
assert.equal(data.yuxu.length,11);
assert(!/release-metrics|PerformanceObserver/.test(html),'QA instrumentation must not be published');
assert(!/\b(?:process\.env|import\.meta\.env)\b/.test(js),'Buildless client needs no environment variables');
console.log(`PASS: JS syntax, CSS parse, ${paths.size} resource references, metadata, single deferred bundle, Yuxu corners, Netlify fallback and root asset base, no QA probe or runtime env dependency.`);
