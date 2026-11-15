#!/usr/bin/env python3
"""
KV → D1 ko'chirish.

NIMA KO'CHADI:
  u:<uid>        → users         (ism, streak, kunlar, kursor, kitob bosqichi,
                                  hamda eski umumiy natija legacy_* ustunlarida)
  b:<sana>:<uid> → daily         (kunlik yakun: ball/jami)
  done:<uid>:<sana> → daily      (b: da yo'q bo'lsa, zaxira manba)
  kd:<uid>:<fasl>  → fasl_done   (kitob marafonidagi tugatilgan fasllar)

NIMA KO'CHMAYDI (ataylab):
  a:, k:  — ayni bugungi, hali yakunlanmagan seansning oraliq javoblari.
            Ularda savol matni emas, faqat indeks turadi; savol identifikatorini
            (qid) tiklash uchun o'sha kunning tasodifiy tanlovini qayta
            yasash kerak bo'ladi va bu xato ma'lumot yozish xavfini tug'diradi.
            Oqibati: ko'chirish paytida viktorina o'rtasida bo'lgan odam
            bugungi viktorinani boshidan boshlaydi. Yakunlaganlar (done:)
            esa saqlanib qoladi.
  p:      — javob kutilayotgan so'rovnomalar; bir necha daqiqada o'z-o'zidan
            eskiradi, ko'chirishning ma'nosi yo'q.

Ishga tushirish:
    python3 kochir.py            # faqat SQL fayl yasaydi, bazaga tegmaydi
    python3 kochir.py --qolla    # yasaydi va D1 ga qo'llaydi
"""
import json
import pathlib
import subprocess
import sys
import tempfile

ILDIZ = pathlib.Path.home() / "ustozim-quiz-bot"
BINDING = ["--binding", "SESSIONS", "--remote"]


def wrangler(*args, kiritish=None):
    r = subprocess.run(
        ["npx", "wrangler", *args], cwd=ILDIZ, capture_output=True, text=True, input=kiritish
    )
    if r.returncode:
        sys.exit(f"wrangler xato ({' '.join(args)}):\n{r.stderr[-2000:]}")
    return r.stdout


def kalitlar(prefix):
    out = wrangler("kv", "key", "list", *BINDING, "--prefix", prefix)
    return [x["name"] for x in json.loads(out)]


def qiymatlar(nomlar):
    """bulk get — 413 ta alohida so'rov o'rniga bir necha to'plam."""
    natija = {}
    for i in range(0, len(nomlar), 100):
        bolak = nomlar[i : i + 100]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(bolak, f)
            yol = f.name
        out = wrangler("kv", "bulk", "get", yol, *BINDING)
        try:
            data = json.loads(out)
        except json.JSONDecodeError:
            sys.exit(f"bulk get javobini o'qib bo'lmadi:\n{out[:500]}")
        # Javob shakli versiyaga qarab farq qiladi — ikkisini ham qabul qilamiz.
        if isinstance(data, dict):
            data = data.get("values", data)
        if isinstance(data, dict):
            natija.update(data)
        else:
            for yozuv in data:
                natija[yozuv["key"]] = yozuv.get("value")
        print(f"  ... {min(i + 100, len(nomlar))}/{len(nomlar)}", flush=True)
    return natija


def butun(v, aslida=0):
    try:
        return int(v)
    except (TypeError, ValueError):
        return aslida


def yukla(v):
    if v is None:
        return None
    if isinstance(v, (dict, list)):
        return v
    try:
        return json.loads(v)
    except (json.JSONDecodeError, TypeError):
        return None


def q(s):
    """SQL uchun satrni qalqonlash."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


# ——————————————————————————————————————————— 1. KV dan o'qish

print("KV kalitlari o'qilmoqda…")
u_kalit = kalitlar("u:")
b_kalit = kalitlar("b:")
d_kalit = kalitlar("done:")
k_kalit = kalitlar("kd:")
print(f"  u: {len(u_kalit)}, b: {len(b_kalit)}, done: {len(d_kalit)}, kd: {len(k_kalit)}")

print("Qiymatlar o'qilmoqda…")
hammasi = qiymatlar(u_kalit + b_kalit + d_kalit + k_kalit)

# ——————————————————————————————————————————— 2. SQL yasash

satrlar = ["-- KV → D1 ko'chirish. Qayta ishga tushirish xavfsiz (INSERT OR REPLACE)."]
hisob = {"users": 0, "daily": 0, "fasl_done": 0, "bo'sh": 0}

for kalit in u_kalit:
    uid = kalit[2:]
    u = yukla(hammasi.get(kalit))
    if not isinstance(u, dict):
        hisob["bo'sh"] += 1
        continue
    satrlar.append(
        "INSERT OR REPLACE INTO users "
        "(uid, name, uname, streak, last_daily, days, seq, kitob, blocked, "
        " legacy_answered, legacy_correct) VALUES ("
        f"{q(uid)}, {q(u.get('name'))}, {q(u.get('uname'))}, {butun(u.get('streak'))}, "
        f"{q(u.get('lastDaily'))}, {butun(u.get('days'))}, {butun(u.get('seq'))}, "
        f"{butun(u.get('kitob'))}, {1 if u.get('blocked') else 0}, "
        f"{butun(u.get('answered'))}, {butun(u.get('correct'))});"
    )
    hisob["users"] += 1

# daily: b: birinchi navbatda (ism ham bor), done: — to'ldiruvchi
kunlik = {}
for kalit in b_kalit:
    _, sana, uid = kalit.split(":", 2)
    v = yukla(hammasi.get(kalit))
    if isinstance(v, dict) and "s" in v:
        kunlik[(uid, sana)] = (butun(v.get("s")), butun(v.get("t")))

for kalit in d_kalit:
    _, uid, sana = kalit.split(":", 2)
    if (uid, sana) in kunlik:
        continue
    v = yukla(hammasi.get(kalit))
    if isinstance(v, dict) and "score" in v:
        kunlik[(uid, sana)] = (butun(v.get("score")), butun(v.get("total")))

for (uid, sana), (ball, jami) in kunlik.items():
    satrlar.append(
        "INSERT OR REPLACE INTO daily (uid, day, score, total) VALUES ("
        f"{q(uid)}, {q(sana)}, {ball}, {jami});"
    )
    hisob["daily"] += 1

for kalit in k_kalit:
    _, uid, fasl = kalit.split(":", 2)
    v = yukla(hammasi.get(kalit))
    if not isinstance(v, dict):
        continue
    satrlar.append(
        "INSERT OR REPLACE INTO fasl_done (uid, fasl, score, total) VALUES ("
        f"{q(uid)}, {butun(fasl)}, {butun(v.get('ball'))}, {butun(v.get('total'))});"
    )
    hisob["fasl_done"] += 1

yol = ILDIZ / "kochirish.sql"
yol.write_text("\n".join(satrlar) + "\n", encoding="utf-8")
print(f"\n{yol} yozildi — {hisob}")

# ——————————————————————————————————————————— 3. Qo'llash

if "--qolla" in sys.argv:
    print("D1 ga qo'llanmoqda…")
    out = wrangler("d1", "execute", "ustozim-quiz-db", "--remote", "--file", str(yol), "--yes")
    print(out[-1500:])
else:
    print("Bazaga tegilmadi. Qo'llash uchun:  python3 kochir.py --qolla")
