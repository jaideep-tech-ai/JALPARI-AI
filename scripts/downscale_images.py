"""Downscale oversized landing photos to max 1600px wide, quality 82 — keeps payload sane."""
import os
from PIL import Image

SRC = '/home/z/my-project/public/images/landing'
MAX_W = 1600
for f in sorted(os.listdir(SRC)):
    if not f.endswith(('.jpg', '.jpeg')):
        continue
    p = os.path.join(SRC, f)
    im = Image.open(p)
    if im.width > MAX_W:
        r = MAX_W / im.width
        im = im.resize((MAX_W, int(im.height * r)), Image.LANCZOS)
        im.save(p, quality=82, optimize=True)
        print(f'{f}: -> {im.size} {os.path.getsize(p)//1024}KB')
    else:
        print(f'{f}: kept {im.size} {os.path.getsize(p)//1024}KB')
