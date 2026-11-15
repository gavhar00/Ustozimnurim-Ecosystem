#!/usr/bin/env python3
"""
@sahifalarUstozimnurim kanaliga kunlik fasl e'lonini yuboradi.

Har kuni bitta fasl: qisqa anons + "sinovdan o'tish" tugmasi.
Tugma botdagi o'sha fasl bosqichiga to'g'ridan-to'g'ri olib boradi.

Muhit o'zgaruvchilari:
  BOT_TOKEN     — @BotFather bergan token
  CHANNEL_ID    — @sahifalarUstozimnurim yoki -100...
  BOT_USERNAME  — ustozimnurimbot
  START_DATE    — marafon boshlangan sana, YYYY-MM-DD
  PIN           — "1" bo'lsa post pin qilinadi
"""
import os
import sys
import json
import urllib.request
from datetime import date, datetime

TOKEN = os.environ["BOT_TOKEN"]
CHANNEL = os.environ.get("CHANNEL_ID", "@sahifalarUstozimnurim")
BOT = os.environ.get("BOT_USERNAME", "ustozimnurimbot")
START = os.environ.get("START_DATE", "2026-08-08")
PIN = os.environ.get("PIN", "0") == "1"

FASL = [
    (1, "📖", "Ilm va fiqhning mohiyati va fazilati",
     "Nima uchun ilm o'rganish farz? Qaysi ilmni bilish har bir insonga shart? "
     "Muallif ilmning qadri va fiqhning o'rnini ochib beradi."),
    (2, "🎯", "Ilm olishda niyat qilish",
     "«Amallar niyatga qarab bo'ladi.» Bir xil mehnat — niyatga ko'ra ikki xil natija. "
     "Bu fasl ilm yo'lidagi eng nozik masalaga bag'ishlangan."),
    (3, "🤝", "Ilm, ustoz va sherik tanlash",
     "Ustozni qanday tanlash kerak? Nega ikki oy sabr qilish tavsiya qilinadi? "
     "Va nima uchun do'st tanlash ilmning yarmi hisoblanadi."),
    (4, "🙏", "Ilm va ilm ahlini ulug'lash",
     "«Ilm afzalmi yoki odob?» — javob sizni o'ylantiradi. "
     "Ustoz hurmati, kitob odobi va shogirdlik adabi haqida."),
    (5, "🔥", "Jiddu-jahd, bardavomlik va himmat",
     "Kechalar, mehnat va sabr. Nega yoshlikda o'rganilgan ilm toshga o'yilgan naqshga "
     "o'xshatiladi va «rifq» nima degani?"),
    (6, "📝", "Darsni boshlash, miqdori va tartibi",
     "Bu fasl — amaliy metodika. Saboq miqdori, takror tizimi va munozara qoidalari. "
     "Bugungi o'quv usullariga hayratlanarli darajada yaqin."),
    (7, "🕊", "Tavakkul qilish",
     "Rizq tashvishi ilmni qanday to'sadi? Talaba nimaga g'am chekishi va nimaga "
     "chekmasligi kerak — muallif aniq chegara qo'yadi."),
    (8, "⏳", "Tahsil vaqti",
     "«Beshikdan lahadgacha.» Sakson yoshda ilm boshlagan olim hikoyasi va "
     "kun davomidagi eng barakali soatlar haqida."),
    (9, "💛", "Nasihat va mehru shafqat",
     "Dushmanlik, hasad va yomon gumon — ilm yo'lining ko'rinmas to'siqlari. "
     "Muallif ulardan qutulishning kutilmagan yo'lini ko'rsatadi."),
    (10, "✍️", "Foyda talab qilish",
     "«Kimning cho'ntagida daftar yurmas, qalbiga hikmat ham kirmas.» "
     "Eshitganni yozib borish odati haqida butun bir fasl."),
    (11, "🛡", "Ilm olishda parhez va taqvo",
     "Ovqat, uyqu va suhbat — uchtasi ham ilmga bevosita ta'sir qiladi. "
     "Bu fasl talabaning kundalik turmush tartibiga bag'ishlangan."),
    (12, "🧠", "Zehnni mustahkamlaydigan omillar",
     "Xotirani kuchaytiradigan va zaiflashtiradigan narsalar ro'yxati. "
     "Ba'zilari sizni ajablantiradi."),
    (13, "🌾", "Rizq va umrni ziyoda qiladiganlar",
     "Kundalik odatlarning rizqqa ta'siri haqida o'ttizdan ortiq aniq ko'rsatma. "
     "Kitobning eng amaliy qismi."),
    (14, "📜", "Imom A'zamning Abu Yusufga vasiyati",
     "Ustozning shogirdga so'nggi so'zi: hokimiyat, jamiyat, oila va obro' haqida. "
     "Marafonning yakuniy bosqichi."),
]


def api(method, payload):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{TOKEN}/{method}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    boshlangan = datetime.strptime(START, "%Y-%m-%d").date()
    kun = (date.today() - boshlangan).days

    if kun < 0:
        print(f"Marafon hali boshlanmagan ({START}).")
        return
    if kun >= len(FASL):
        print("Marafon yakunlangan — e'lon yuborilmadi.")
        return

    n, ok, ad, tavsif = FASL[kun]
    matn = (
        f"{ok} <b>{n}-FASL</b>  ·  <i>Kun {kun + 1}/{len(FASL)}</i>\n"
        f"<b>{ad}</b>\n\n"
        f"{tavsif}\n\n"
        f"━━━━━━━━━━━━━━\n"
        f"📚 Bugungi vazifa: shu faslni o'qib chiqing\n"
        f"✅ So'ng quyidagi tugma orqali sinovdan o'ting — 8 ta savol\n\n"
        f"<i>«Ilm olish sirlari» — Imom Zarnujiy</i>"
    )

    res = api("sendMessage", {
        "chat_id": CHANNEL,
        "text": matn,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
        "reply_markup": {"inline_keyboard": [[
            {"text": f"✅ {n}-fasl sinovi", "url": f"https://t.me/{BOT}?start=fasl{n}"}
        ]]},
    })

    if not res.get("ok"):
        print("XATO:", res, file=sys.stderr)
        sys.exit(1)

    mid = res["result"]["message_id"]
    print(f"Yuborildi: {n}-fasl (kun {kun + 1}), message_id={mid}")

    if PIN:
        api("unpinAllChatMessages", {"chat_id": CHANNEL})
        api("pinChatMessage", {"chat_id": CHANNEL, "message_id": mid,
                               "disable_notification": True})
        print("Pin qilindi.")


if __name__ == "__main__":
    main()
