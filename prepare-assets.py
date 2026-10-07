from pathlib import Path
from PIL import Image
import json, re

root = Path(__file__).parent.parent
out = Path(__file__).parent / 'dist' / 'assets'
out.mkdir(parents=True, exist_ok=True)
projects = [('nelu','小猫'),('yuxu','予序'),('qingyu','晴雨'),('aigc','AIGC作品集导出')]
manifest = {}
for key, folder in projects:
    files = [f for f in (root/'全导出'/folder).glob('*.png') if '简历' not in f.name]
    files.sort(key=lambda f: (int(re.search(r'\d+', f.name).group()), '设计推导' in f.name))
    manifest[key] = []
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB')
        name = f'{key}-{i+1:02}.webp'
        im.save(out/name, 'WEBP', quality=88, method=6)
        manifest[key].append({'src':'assets/'+name,'label':f.stem,'width':im.width,'height':im.height})

materials = root/'作品源文件'/'作品集封面整体导出'/'素材'
for key, filename in [('yuxu','iPhone14Pro-15.png'),('qingyu','MacBook Pro _04.png'),('aigc','iPhone14Pro-12.png')]:
    im = Image.open(materials/filename).convert('RGB')
    im.thumbnail((1600,1200))
    im.save(out/(key+'-hero.webp'),quality=88,method=6)
im = Image.open(root/'C端AI小猫Nelu'/'设计素材'/'Iphone 17 Pro Max 10.png').convert('RGBA')
im = im.crop(im.getbbox())
im.thumbnail((1000,1100))
im.save(out/'nelu-hero.webp',quality=92,method=6)
im = Image.open(root/'全导出'/'封面'/'介绍.png').convert('RGB').crop((738,84,1220,720))
im.save(out/'portrait.webp',quality=90,method=6)
im = Image.open(materials/'未标题-3.png').convert('RGB')
im.thumbnail((1600,1200))
im.save(out/'hero-poster.webp',quality=88,method=6)
(out/'projects.json').write_text(json.dumps(manifest,ensure_ascii=False),encoding='utf-8')
print('Prepared',sum(map(len,manifest.values())),'case-study pages and 6 presentation images')
