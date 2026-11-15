#!/usr/bin/env python3
"""Arab savollarini GENERATORDAN MUSTAQIL tekshiradi (Unicode nomlari bo'yicha)."""
import json, sys, unicodedata, collections, re

d = json.load(open(sys.argv[1], encoding="utf-8"))
xato = []

# Unicode rasmiy nomi -> o'zbekcha nom (generatordan alohida, qo'lda ikkinchi marta yozilgan)
NOM = {
 "ALEF": "Alif", "BEH": "Bā", "TEH": "Tā", "THEH": "Sā", "JEEM": "Jīm", "HAH": "Ḥā",
 "KHAH": "Xō", "DAL": "Dāl", "THAL": "Zāl", "REH": "Rō", "ZAIN": "Zā", "SEEN": "Sīn",
 "SHEEN": "Shīn", "SAD": "Sōd", "DAD": "Zōd", "TAH": "Tō", "ZAH": "Zō", "AIN": "'Ayyn",
 "GHAIN": "G'oyyn", "FEH": "Fā", "QAF": "Qōf", "KAF": "Kāf", "LAM": "Lām", "MEEM": "Mīm",
 "NOON": "Nūn", "HEH": "Hā", "WAW": "Vāv", "YEH": "Yā",
}
HARF_NOM = {}
for ch in "ابتثجحخدذرزسشصضطظعغفقكلمنهوي":
    n = unicodedata.name(ch).replace("ARABIC LETTER ", "")
    HARF_NOM[ch] = NOM[n]
HARF_NOM['لا'] = 'Lām-alif'
assert len(HARF_NOM) == 29 and len(set(HARF_NOM.values())) == 29

# 1) tuzilma
cnt = collections.Counter(q["g"] for q in d)
for g in range(1, 36):
    if cnt[g] != 3: xato.append(f"{g}-kunda {cnt[g]} ta savol (3 bo'lishi kerak)")
if len({q["q"] for q in d}) != len(d): xato.append("takroriy savol matni bor")
for q in d:
    if not (2 <= len(q["o"]) <= 10): xato.append("variantlar soni: " + q["q"])
    if len(set(q["o"])) != len(q["o"]): xato.append("takroriy variant: " + q["q"])
    if not 0 <= q["c"] < len(q["o"]): xato.append("c noto'g'ri: " + q["q"])
    if len(q["q"]) > 300 or any(len(o) > 100 for o in q["o"]): xato.append("uzun: " + q["q"])
    if not q.get("e") or len(q["e"]) > 200: xato.append(f"izoh yo'q/uzun ({len(q.get('e',''))}): {q['q']}")
    if q["t"] != "Arab": xato.append("t xato")

# 2) harf <-> nom mosligi
for q in d:
    m = re.match(r"Bu harfning nomi nima\?\s+(\S+)$", q["q"])
    if m:
        if q["o"][q["c"]] != HARF_NOM[m.group(1)]: xato.append("harf->nom xato: " + q["q"])
    m = re.match(r"«(.+?)» harfi qaysi\?$", q["q"])
    if m:
        inv = {v: k for k, v in HARF_NOM.items()}
        if q["o"][q["c"]] != inv[m.group(1)]: xato.append("nom->harf xato: " + q["q"])

# 3) 1-14 kun: har bir harf kamida bir marta, har kuni ikki yangi harf
yangi = set()
for g in range(1, 15):  # harflar kursi
    for q in [x for x in d if x["g"] == g]:
        m = re.match(r"«(.+?)» harfi qaysi\?$", q["q"]) or re.match(r"Bu harfning nomi nima\?\s+(\S+)$", q["q"])
        if m:
            key = q["o"][q["c"]]
            yangi.add(HARF_NOM.get(key, key))
if len(yangi) != 29: xato.append(f"1-14 kunda {len(yangi)} ta harf qamrab olindi (29 bo'lishi kerak)")

# 3b) harakat savollari: «Xَ» — to'g'ri variant = harf nomi + haraka nomi (Unicode belgisidan)
MK = {"\u064E": "fatha", "\u0650": "kasra", "\u064F": "zamma"}
nh = 0
for q in d:
    m = re.match(r"«(.)([\u064E\u0650\u064F])» — qaysi harf va qanday harakat\?$", q["q"])
    if m:
        nh += 1
        exp = HARF_NOM[m.group(1)] + " + " + MK[m.group(2)]
        if q["o"][q["c"]] != exp: xato.append("harakat savoli xato: " + q["q"])
if nh != 28: xato.append(f"harakat savollari {nh} ta (28 bo'lishi kerak)")

# 4) c taqsimoti
dist = collections.Counter(q["c"] for q in d)
print("c taqsimoti:", dict(sorted(dist.items())))
# 5) eng uzun javob = to'g'ri (faqat o'zbekcha matnli variantlar)
uz = [q for q in d if not re.search(r"[؀-ۿ]", "".join(q["o"]))]
uzun = sum(1 for q in uz if len(q["o"][q["c"]]) == max(len(o) for o in q["o"]) and sum(len(o) == len(q["o"][q["c"]]) for o in q["o"]) == 1)
print(f"matnli variantli savol: {len(uz)}, to'g'ri javob yagona eng uzun: {uzun}")

# 6) arab belgilari: faqat ruxsat etilganlar
ok = set(HARF_NOM) | set("\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0640 ")
for q in d:
    for ch in q["q"] + "".join(q["o"]):
        if "؀" <= ch <= "ۿ" and ch not in ok: xato.append(f"kutilmagan belgi U+{ord(ch):04X} {q['q']}")

print(f"jami {len(d)} savol (kurs {sum(1 for q in d if q['g']>0)}, takror {sum(1 for q in d if q['g']==0)})")
print("XATOLAR:" if xato else "XATO YO'Q")
for x in xato: print(" -", x)
sys.exit(1 if xato else 0)
