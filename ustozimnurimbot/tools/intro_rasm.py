"""Bot kirish rasmi: qorong'i fon, tilla nur, Ustozim Nurim logosi (2D, tilla gradient) va Lumi personajlari.
Ishlatish: python3 tools/intro_rasm.py → tools/out/intro_1280.png, intro_640x360.png (BotFather), intro.jpg (sendPhoto)"""
import os, random, math
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
HERE = os.path.dirname(__file__)
def _lumi_top():
    # Papka nomi o'zgarib turadi (hujjatlar/ → Design System | …): stikerlarni nomi bo'yicha qidiramiz
    ildiz = os.path.abspath(os.path.join(HERE, "..", ".."))
    for yol, _, fayllar in os.walk(ildiz):
        if "node_modules" in yol or ".git" in yol: continue
        if os.path.basename(yol) == "stickers" and "sticker_03.png" in fayllar:
            return os.path.dirname(yol)
    raise SystemExit("Lumi stikerlari topilmadi")
R = _lumi_top()
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
K = 2                                  # ichki ko'lamlash: chiziqlar tiniq bo'lsin
W, H = 1280 * K, 720 * K

def blur(im, r): return im.filter(ImageFilter.GaussianBlur(r * K))

# 1) fon: tik gradient + markaziy tilla nur
bg = Image.new("RGB", (W, H))
px = ImageDraw.Draw(bg)
for y in range(H):
    t = y / H
    px.line([(0, y), (W, y)], fill=(int(13 + 20 * t), int(10 + 14 * t), int(7 + 6 * t)))
nur = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(nur)
d.ellipse((W * .5 - 520 * K, H * .55 - 330 * K, W * .5 + 520 * K, H * .55 + 330 * K), fill=(128, 92, 36))
bg = ImageChops.add(bg, blur(nur, 150))
bg = bg.convert("RGBA")

# 2) logo: tilla gradient, yumshoq porlash va ingichka yorqin chekka
mark = Image.open(os.path.join(HERE, "assets", "mark.png")).convert("RGBA")
mh = 600 * K
mark = mark.resize((int(mark.width * mh / mark.height), mh), Image.LANCZOS)
alfa = mark.getchannel("A")
grad = Image.new("RGB", mark.size)
gd = ImageDraw.Draw(grad)
for y in range(mark.height):
    t = y / mark.height
    gd.line([(0, y), (mark.width, y)], fill=(int(246 - 70 * t), int(214 - 80 * t), int(130 - 66 * t)))
cx, cy = W // 2 - mark.width // 2, int(H * 0.50 - mark.height / 2)
# porlash (glow)
glow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
g = Image.new("RGBA", mark.size, (214, 172, 85, 0)); g.putalpha(alfa.point(lambda v: int(v * 0.55)))
glow.alpha_composite(g, (cx, cy)); glow = blur(glow, 26)
bg.alpha_composite(glow)
# tana
tana = grad.convert("RGBA"); tana.putalpha(alfa.point(lambda v: int(v * 0.34)))
bg.alpha_composite(tana, (cx, cy))
# chekka chizig'i
ich = alfa.filter(ImageFilter.MinFilter(2 * K * 2 + 1))
chek = ImageChops.subtract(alfa, ich)
ch = Image.new("RGBA", mark.size, (255, 226, 150, 0)); ch.putalpha(chek.point(lambda v: int(v * 0.85)))
bg.alpha_composite(ch, (cx, cy))

# 3) yorug' zarralar (bokeh)
random.seed(11)
zr = Image.new("RGBA", bg.size, (0, 0, 0, 0)); zd = ImageDraw.Draw(zr)
for _ in range(46):
    x, y, r = random.randint(0, W), random.randint(0, H), random.randint(2, 7) * K
    a = random.randint(70, 200)
    zd.ellipse((x - r, y - r, x + r, y + r), fill=(240, 196, 100, a))
bg.alpha_composite(blur(zr, 1.2))
big = Image.new("RGBA", bg.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(big)
for _ in range(7):
    x, y, r = random.randint(0, W), random.randint(0, H), random.randint(22, 46) * K
    bd.ellipse((x - r, y - r, x + r, y + r), fill=(214, 172, 85, 34))
bg.alpha_composite(blur(big, 6))

# 4) personajlar
def kes(path, h):
    im = Image.open(path).convert("RGBA"); im = im.crop(im.getbbox())
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)

def qoy(im, cxx, bottom):
    soya = Image.new("RGBA", (int(im.width * 1.1), 70 * K), (0, 0, 0, 0))
    ImageDraw.Draw(soya).ellipse((im.width * .08, 14 * K, im.width * 1.0, 56 * K), fill=(0, 0, 0, 175))
    soya = blur(soya, 12)
    bg.alpha_composite(soya, (int(cxx - soya.width / 2), int(bottom - 40 * K)))
    # tilla yer nuri
    zn = Image.new("RGBA", (int(im.width * 1.5), 90 * K), (0, 0, 0, 0))
    ImageDraw.Draw(zn).ellipse((0, 20 * K, zn.width, 70 * K), fill=(214, 172, 85, 60))
    bg.alpha_composite(blur(zn, 18), (int(cxx - zn.width / 2), int(bottom - 56 * K)))
    bg.alpha_composite(im, (int(cxx - im.width / 2), int(bottom - im.height)))

st = lambda n: os.path.join(R, "stickers", "sticker_%02d.png" % n)
chap = kes(st(3), 310 * K); ong = kes(st(10), 310 * K)
bosh = kes(os.path.join(R, "12_cutout_neutral_ref.png"), 560 * K)
qoy(chap, 225 * K, 655 * K); qoy(ong, 1055 * K, 655 * K); qoy(bosh, 640 * K, 695 * K)

# 5) vinyetka
vin = Image.new("L", (W, H), 0)
ImageDraw.Draw(vin).ellipse((-W * .15, -H * .25, W * 1.15, H * 1.25), fill=255)
vin = blur(vin, 120)
qora = Image.new("RGBA", bg.size, (6, 4, 2, 255))
bg = Image.composite(bg, Image.alpha_composite(bg, qora).point(lambda v: v) if False else bg, vin) if False else bg
maska = ImageOps.invert(vin).point(lambda v: int(v * 0.55))
qora.putalpha(maska); bg.alpha_composite(qora)

rgb = bg.convert("RGB")
rgb.resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, "intro_1280.png"))
rgb.resize((640, 360), Image.LANCZOS).save(os.path.join(OUT, "intro_640x360.png"))
rgb.resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, "intro.jpg"), quality=90, optimize=True, subsampling=0)
print(os.path.getsize(os.path.join(OUT, "intro.jpg")) // 1024, "KB")
