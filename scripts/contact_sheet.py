"""Contact sheets for landing image selection — 2 grids."""
import os
from PIL import Image, ImageDraw, ImageFont

SRC = '/home/z/my-project/public/images/landing'
OUT = '/home/z/my-project/download'
names = sorted([f for f in os.listdir(SRC) if f.endswith(('.jpg', '.jpeg'))])
COLS, TW, TH, PAD, LABEL_H = 5, 300, 200, 8, 22

def sheet(files, out):
    rows = (len(files) + COLS - 1) // COLS
    W = COLS * (TW + PAD) + PAD
    H = rows * (TH + LABEL_H + PAD) + PAD
    canvas = Image.new('RGB', (W, H), (14, 18, 28))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    except Exception:
        font = ImageFont.load_default()
    for i, f in enumerate(files):
        im = Image.open(os.path.join(SRC, f)).convert('RGB')
        # cover-crop to TWxTH
        r = max(TW / im.width, TH / im.height)
        im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
        x0 = (im.width - TW) // 2; y0 = (im.height - TH) // 2
        im = im.crop((x0, y0, x0 + TW, y0 + TH))
        cx = PAD + (i % COLS) * (TW + PAD)
        cy = PAD + (i // COLS) * (TH + LABEL_H + PAD)
        canvas.paste(im, (cx, cy))
        d.text((cx + 2, cy + TH + 3), f, fill=(180, 230, 255), font=font)
    canvas.save(out, quality=88)
    print('saved', out, canvas.size)

half = (len(names) + 1) // 2
sheet(names[:half], os.path.join(OUT, 'sheet-1.png'))
sheet(names[half:], os.path.join(OUT, 'sheet-2.png'))
