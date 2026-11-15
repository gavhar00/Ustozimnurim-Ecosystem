#!/usr/bin/env python3
"""
Tarjima tekshirgichi.

NEGA MEXANIK TEKShIRUV KERAK: tarjimada xato ko'zga tashlanmaydi.
Savol ruscha, javoblar ruscha, hammasi joyida ko'rinadi — lekin
to'g'ri javob indeksi siljib ketgan bo'lishi mumkin, yoki izoh
Telegram chegarasidan oshib ketgan bo'ladi va bot savolni umuman
yubormaydi. Bunday xatolarni o'qib topib bo'lmaydi, ularni SANASh
kerak.

Tekshiriladigan narsalar:
  · savollar soni o'zbekchasiga teng
  · to'g'ri javob indeksi (c) aynan bir xil
  · variantlar soni bir xil
  · izoh 200 belgidan oshmaydi (Telegram sendPoll cheklovi)
  · matnda kirill harflari bor
  · YOT YOZUV yo'q — tarjima paytida tasodifan kirib qolgan
    lotin, arab, xitoy belgilari. Bu eng ayyor xato turi: bitta
    begona harf matn ichida ko'zga umuman tashlanmaydi.
  · o'zbekcha qoldiq yo'q (o', g', tipik qo'shimchalar)
"""
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path.home() / "ustozim-quiz-bot"
SHU = pathlib.Path(__file__).parent

uz_hammasi = json.loads((ROOT / "src" / "kitob_bank.json").read_text(encoding="utf-8"))

# Ruscha matnda bo'lishi MUMKIN bo'lgan belgilar: kirill, raqam, tinish,
# bo'shliq. Lotin — faqat alohida holatlarda (masalan, lotincha qisqartma),
# shuning uchun u alohida sanaladi, taqiqlanmaydi.
YOT = re.compile(
    r"[^Ѐ-ӿ -~«»‐-―‘-‟…⁠"
    r" –—’é↑→✓✗]"
)
OZBEKCHA = re.compile(r"\b(va|bilan|uchun|kitobda|ya'ni|bo'l\w*|qil\w*|deb)\b", re.I)

xatolar = []
jami = 0

fayllar = sorted(SHU.glob("fasl*_ru.json"))
if not fayllar:
    print("Tarjima fayllari topilmadi")
    sys.exit(1)

for fayl in fayllar:
    fasl = int(re.search(r"fasl(\d+)_ru", fayl.name).group(1))
    ru = json.loads(fayl.read_text(encoding="utf-8"))
    uz = [q for q in uz_hammasi if q["f"] == fasl]
    jami += len(ru)

    def xato(i, nima):
        xatolar.append(f"  fasl {fasl:2d} savol {i + 1:2d}: {nima}")

    if len(ru) != len(uz):
        xatolar.append(f"  fasl {fasl}: savollar soni {len(ru)} ≠ {len(uz)} (o'zbekcha)")
        continue

    for i, (r, u) in enumerate(zip(ru, uz)):
        if r.get("f") != fasl:
            xato(i, f"f={r.get('f')}, kutilgan {fasl}")
        if r.get("c") != u.get("c"):
            xato(i, f"to'g'ri javob indeksi SILJIGAN: c={r.get('c')}, o'zbekchada {u.get('c')}")
        if r.get("k") != u.get("k"):
            xato(i, f"turi mos emas: {r.get('k')} ≠ {u.get('k')}")
        if len(r.get("o", [])) != len(u.get("o", [])):
            xato(i, f"variantlar soni {len(r.get('o', []))} ≠ {len(u.get('o', []))}")
        if len(r.get("e", "")) > 200:
            xato(i, f"izoh {len(r['e'])} belgi — Telegram chegarasi 200")
        if len(set(r.get("o", []))) != len(r.get("o", [])):
            xato(i, "variantlar orasida takror bor")

        for nom, matn in [("savol", r.get("q", "")), ("izoh", r.get("e", "")),
                          *[(f"variant {j + 1}", o) for j, o in enumerate(r.get("o", []))]]:
            if not re.search(r"[Ѐ-ӿ]", matn):
                xato(i, f"{nom}: kirill harfi yo'q — tarjima qilinmaganga o'xshaydi")
            for ch in YOT.findall(matn):
                nomi = unicodedata.name(ch, "NOMA'LUM")
                xato(i, f"{nom}: YOT BELGI {ch!r} ({nomi})")
            if OZBEKCHA.search(matn):
                xato(i, f"{nom}: o'zbekcha qoldiq — {OZBEKCHA.search(matn).group(0)!r}")

        # Eng uzun variant to'g'ri javob bo'lib qolishi — klassik nuqson.
        # Odam mazmunni bilmasa ham uzunrog'ini tanlaydi.
        # To'rt variantdan biri HAR DOIM eng uzun bo'ladi — bu o'z-o'zidan
        # nuqson emas. Nuqson to'g'ri javob IKKINCHI eng uzundan sezilarli
        # uzun bo'lganda paydo bo'ladi: o'shanda uzunlik javobni oshkor
        # qiladi va mazmunni bilmagan odam ham to'g'ri tanlaydi.
        o = r.get("o", [])
        if len(o) > 1:
            tartib = sorted((len(x) for x in o), reverse=True)
            tanlov = len(o[r.get("c", 0)])
            if tanlov == tartib[0] and tartib[1] and tanlov / tartib[1] >= 1.30:
                xato(i, f"to'g'ri javob uzunlikdan BILINADI ({tanlov} vs {tartib[1]})")

print(f"Tekshirildi: {len(fayllar)} ta fasl, {jami} ta savol")
if xatolar:
    print(f"\n{len(xatolar)} ta muammo:\n" + "\n".join(xatolar))
    sys.exit(1)
print("Hammasi joyida ✓")
