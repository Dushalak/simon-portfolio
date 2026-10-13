"""Offline asset build; Pillow is not required by Netlify's Node build."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import base64
from io import BytesIO

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'dist' / 'assets'
OUTPUT = ASSETS / 'optimized'
OUTPUT.mkdir(exist_ok=True)
EXPORTS = ROOT.parent / '全导出'
PAGE_DIRS = {'nelu':'小猫','yuxu':'予序','qingyu':'晴雨','aigc':'AIGC作品集导出'}
MOCKUPS = {'nelu':'007 2.png','yuxu':'iPhone14Pro-15 1.png','qingyu':'MacBook Pro _04 2.png','aigc':'iPhone14Pro-12 2.png'}
rows = []

def variant(source, name, width, quality, upscale=False):
    with Image.open(source) as original:
        original.load()
        # Higher-density files are rebuilt from original PNGs, never the lossy web versions.
        # A 1280px original remains the source-detail limit even when resampled to 1920px.
        width = width if upscale else min(width, original.width)
        height = round(original.height * width / original.width)
        image = original.resize((width, height), Image.Resampling.LANCZOS)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in original.info else 'RGB')
        from io import BytesIO
        buffer = BytesIO()
        image.save(buffer, 'WEBP', quality=quality, method=6, exact=True)
        content = buffer.getvalue()
        if len(content) > 2_000_000:
            raise ValueError(f'{name}: image exceeds network budget')
        digest = hashlib.sha256(content).hexdigest()[:10]
        path = OUTPUT / f'{name}-{width}-{digest}.webp'
        path.write_bytes(content)
        origin = source.relative_to(EXPORTS).as_posix() if source.is_relative_to(EXPORTS) else source.relative_to(ASSETS).as_posix()
        rows.append({'source':origin, 'sourceWidth':original.width,'file':str(path.relative_to(ASSETS)), 'before':source.stat().st_size,'after':len(content),'width':width,'height':height,'quality':quality,'alpha':image.mode=='RGBA'})
        return {'src':'assets/'+path.relative_to(ASSETS).as_posix(),'width':width,'height':height}

def responsive(source, name, large=1280, small=768, quality=76, upscale=False):
    desktop = variant(source, name, large, quality, upscale)
    mobile = variant(source, name, small, quality-4, upscale)
    desktop['srcset'] = f"{mobile['src']} {mobile['width']}w, {desktop['src']} {desktop['width']}w"
    return desktop

data = json.loads((ASSETS / 'projects.json').read_text('utf-8'))
for key,pages in data.items():
    for index,page in enumerate(pages):
        original = EXPORTS / PAGE_DIRS[key] / (page['label']+'.png')
        if not original.is_file():
            raise FileNotFoundError(f'Original PNG required: {original.name}')
        media = responsive(original, f'{key}-page-{index+1:02}', large=1920, small=1152, quality=84, upscale=True)
        page.update(media)
content = json.dumps(data,ensure_ascii=False,separators=(',',':')).encode('utf-8')
data_name = 'projects-lite.'+hashlib.sha256(content).hexdigest()[:10]+'.json'
(ASSETS / data_name).write_bytes(content)
covers = {}
detail_covers = {}
for key in data:
    cover = responsive(ASSETS / 'project-covers' / (key+'.webp'), key+'-cover', quality=74)
    covers[key] = {'cover':cover['src'],'coverSrcset':cover['srcset'],'coverWidth':cover['width'],'coverHeight':cover['height']}
    original_cover = EXPORTS / '网站素材' / MOCKUPS[key]
    detail = responsive(original_cover, key+'-detail-cover', large=2560, small=1536, quality=84, upscale=True)
    detail_covers[key] = {'cover':detail['src'],'coverSrcset':detail['srcset'],'coverWidth':detail['width'],'coverHeight':detail['height']}
    with Image.open(original_cover) as preview:
        preview.thumbnail((160,160),Image.Resampling.LANCZOS)
        buffer=BytesIO();preview.save(buffer,'WEBP',quality=48,method=6)
        detail_covers[key]['preview']='data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode('ascii')
hero = responsive(ASSETS / 'home-enhanced-poster.webp','hero-poster',large=1280,small=768,quality=72)
fallback = variant(ASSETS / 'home-figma.png','hero-fallback',1280,72)
media = {'dataURL':'assets/'+data_name,'covers':covers,'detailCovers':detail_covers,'hero':hero,'heroFallback':fallback['src']}
media['aboutTextures'] = {}
for source in (ASSETS / 'about').glob('*.png'):
    if source.stat().st_size > 50_000: continue
    with Image.open(source) as image:
        from io import BytesIO
        buffer=BytesIO();image.save(buffer,'WEBP',lossless=True,method=6,exact=True)
        content=buffer.getvalue();digest=hashlib.sha256(content).hexdigest()[:10]
        path=OUTPUT / (source.stem+'-'+digest+'.webp');path.write_bytes(content)
        media['aboutTextures']['assets/about/'+source.name]='assets/'+path.relative_to(ASSETS).as_posix()
import random
rng = random.Random(20261013)
grain = Image.frombytes('L',(128,128),bytes(rng.randrange(256) for _ in range(128*128)))
grain.save(OUTPUT / 'footer-grain-v1.webp','WEBP',quality=45,method=6)
(ROOT / 'src' / 'project-media.js').write_text('/* Generated by scripts/optimize-site-images.py. */\nwindow.PortfolioProjectMedia = '+json.dumps(media,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(OUTPUT / 'manifest.json').write_text(json.dumps({'media':media,'images':rows},ensure_ascii=False,indent=2),encoding='utf-8')
desktop = [row for row in rows if row['width']==1920 and '-page-' in row['file']]
mobile = [row for row in rows if row['width']==1152 and '-page-' in row['file']]
print(json.dumps({'pages':len(desktop),'pageBytesBefore':sum(r['before'] for r in desktop),'desktopBytes':sum(r['after'] for r in desktop),'mobileBytes':sum(r['after'] for r in mobile),'largest':max(r['after'] for r in rows),'files':len(rows)},ensure_ascii=False))
