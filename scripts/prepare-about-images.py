"""Offline assets only: reproduce the Hive shader's initial frame, compress PNGs.
Run manually with Python, numpy and Pillow; Netlify needs only the saved WebP files.
"""
from pathlib import Path
import numpy as np
from PIL import Image

assets = Path(__file__).resolve().parent.parent / 'dist/assets/about'
for name in ['imgHi', 'imgUiUxAiAgent01CBaigc']:
    source = assets / (name + '.png')
    destination = assets / (name + '.webp')
    with Image.open(source) as image:
        image.save(destination, 'WEBP', lossless=True, method=6)
    print(f'{source.name}: {source.stat().st_size} -> {destination.stat().st_size} bytes (lossless)')

with Image.open(assets / 'imgB881Eac952Ae76E95B827Dfd83537F371.png') as portrait:
    for width in [640, 960, 1280]:
        height = round(portrait.height * width / portrait.width)
        resized = portrait.resize((width, height), Image.Resampling.LANCZOS)
        path = assets / f'portrait-{width}.webp'
        resized.save(path, 'WEBP', quality=90, method=6)
        print(f'{path.name}: {path.stat().st_size} bytes, {width} x {height}')

def preview(width, height, name):
    # FC, z, p, d and o follow src/about-hive.js at u_time=2.4, saturation=.45.
    x, y = np.meshgrid(np.arange(width, dtype=np.float32) + .5, np.arange(height, dtype=np.float32) + .5)
    ray = np.stack((x * 2 - width, (y - height * .06) * 2 - height, np.full_like(x, -height)), axis=-1)
    ray /= np.linalg.norm(ray, axis=-1, keepdims=True)
    z = np.ones_like(x)
    color = np.zeros((height, width, 4), dtype=np.float32)
    offsets = np.array([6, 1, 2, 0], dtype=np.float32)
    for _ in range(20):
        p = ray * z[..., None]
        p[..., 0] -= 2.4
        p[..., :2] *= .4
        d = np.maximum(p[..., 2] + 6, np.sum(np.cos(p[..., :2]) * np.sin(p[..., [1, 0]] / .4), axis=-1))
        z += d
        color += (np.cos((20 * p[..., 1] / z)[..., None] + offsets) + 1) * (d / z / 4)[..., None]
    color = np.tanh(color * color)[..., :3]
    luminance = color @ np.array([.2126, .7152, .0722], dtype=np.float32)
    color = luminance[..., None] * .55 + color * .45
    pixels = np.rint(np.clip(color, 0, 1) * 255).astype(np.uint8)[::-1]
    path = assets / ('hive-preview-' + name + '.webp')
    Image.fromarray(pixels).save(path, 'WEBP', quality=90, method=6)
    print(f'{path.name}: {path.stat().st_size} bytes, {width} x {height}')

preview(768, 432, 'desktop')
preview(448, 896, 'tablet')
preview(320, 1280, 'mobile')
