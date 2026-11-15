# Ustozim Nurim bot — tuzatish va deploy cheklisti

Sana: 2026-10-10 · Sinov: **26/26 o'tdi** · Holat: **deploy qilindi va jonli tasdiqlandi**

---

## 1. Tuzatilganlar

| # | Muammo | Oqibati | Holat |
|---|---|---|---|
| 1 | Vaqt tugaganda zaxira kuzatuv yo'q edi | Ulgurmagan odamning viktorinasi qotib qolardi | ✅ |
| 2 | `navbatniOl` kalitni tekshiruvdan oldin olardi | Begona javob savolni butunlay o'ldirardi | ✅ |
| 3 | Kun kaliti UTC'da edi | Yarim tundan keyin "bugun ishlagansiz" deb to'xtatardi | ✅ |
| 4 | Nolga bo'linish himoyasi yo'q | Reyting va statistikada `NaN` chiqishi mumkin edi | ✅ |
| 5 | Vaqt tugaganda oxirgi javob uzatilmasdi | Ball noto'g'ri sanalishi mumkin edi | ✅ |
| 6 | Tekshiruv uchun qo'yilgan `console.log` | Keraksiz jurnal shovqini | ✅ |
| 7 | `seqPollTotal` ishlatilmasdi | O'lik kod | ✅ |
| 8 | Fayl boshidagi izoh eskirgan edi | Chalg'ituvchi hujjat | ✅ |

### Batafsil: eng muhim uchtasi

**1-muammo — vaqt tugashi.** Ikki marta jonli o'lchandi, ikkalasida ham bir xil natija: Telegram'ga qisqa so'rovnoma yuborilib yopilgunicha kuzatildi — bot'ga **birorta ham xabar kelmadi**. Ya'ni so'rovnoma `open_period` tugab o'z-o'zidan yopilganda Telegram hech kimni ogohlantirmaydi. Kod faqat shu xabarga tayanardi.

Natijasi real foydalanuvchilarda ko'rindi: **10-oktabr kuni 7 kishidan 1 tasi 1-savoldayoq qotib qolgan.**

Endi bot vaqtni o'zi sanaydi. Lekin bu yerda ikkinchi to'siq bor edi — Cloudflare fon ishini uzoq ushlab turmaydi. Chegarani aniq o'lchadim:

| Fon ishi | Natija |
|---|---|
| 5 soniya | ✅ bajarildi |
| 18 soniya | ✅ bajarildi |
| 28 soniya | ❌ uzilib ketdi |

Savol taymeri esa 45 soniyagacha bo'lishi mumkin — ya'ni bitta kutish bilan qamrab bo'lmaydi. Shuning uchun kutish **12 soniyalik bo'laklarga** bo'linadi: har bo'lakdan keyin Worker o'zini qayta chaqiradi va yangi byudjet oladi. Shunda taymer uzunligiga cheklov qolmaydi.

Jonli tasdiqlandi: 45 soniyalik kutish oxirigacha bordi, va javob berilmagan viktorinada **savollar ketma-ket avtomatik o'tdi** (2 daqiqada 4 ta).

**2-muammo — kalit.** `navbatniOl` yozuvni o'chirib, keyin «javob bergan odam savol egasimi?» deb tekshirardi. Egasi bo'lmasa chiqib ketardi, lekin kalit allaqachon yeb bo'lingan edi. Natijada savol boshqa hech qachon oldinga surilmasdi. Endi tekshiruv kalitni olishdan **oldin**.

**3-muammo — sana.** `dayKey` UTC ishlatardi, ya'ni kun Toshkentda soat **05:00** da almashardi. Kechqurun viktorinani ishlagan odam yarim tundan keyin qayta kirsa, bot uni hali ham «bugun ishlagansiz» deb to'xtatardi. Sarlavhadagi sana esa Toshkent vaqtini ko'rsatib, ma'lumot bilan zid bo'lardi. Endi ikkalasi UTC+5 da.

---

## 2. Sinov tizimi

Yangi: `npm test` — soxta KV va soxta Telegram bilan 21 ta tekshiruv. Tarmoqqa chiqmaydi, haqiqiy botga tegmaydi.

```bash
npm test                              # tuzatilgan kodni sinaydi
node test/run.mjs test/eski/index.js  # eski kodni sinaydi (taqqoslash uchun)
```

Sinovlar haqiqatan ish berishini tasdiqladim: **eski kodda 4 tasi yiqiladi**, tuzatilganda hammasi o'tadi.

Qamrab olingan: to'liq viktorina sikli, takroriy kirish, vaqt tugashi, begona javob, sana chegarasi, o'rganish rejimlarida taymer yo'qligi, bo'sh holatlar.

---

## 3. Deploy — bajarildi ✅

- [x] `npx wrangler login`
- [x] `npm test` — 26/26
- [x] `npx wrangler deploy` — versiya `531e263d`
- [x] Jonli sinov: javob berilmagan viktorinada savollar avtomatik o'tdi
- [x] Sinov izlari tozalandi, admin natijasi (4/15) tiklandi

## 4. Siz tekshiradigan narsalar

Kodni men tekshirdim, lekin Telegramdagi ko'rinishni faqat siz ko'ra olasiz:

- [ ] Botga `/sozla` yozing. **«Vaqt tugashi (poll): ✅ yoqilgan»** satrini ko'ring
- [ ] `/kunlik` — savol kelsinmi, taymer ko'rinsinmi
- [ ] Bitta savolga **ataylab javob bermang**. Uch narsani kuzating:
  - [ ] «⏱ Vaqt tugadi» xabari keldimi
  - [ ] To'g'ri javob matnda ko'rsatildimi
  - [ ] Keyingi savol o'zi keldimi
- [ ] `/natija` — hech qayerda `NaN` yo'qligini tekshiring
- [ ] Ertaga 20:00 va 22:00 da guruhga e'lon va reyting tushganini ko'ring

> Eslatma: bugun siz allaqachon viktorinani ishlagansiz (4/15), shuning uchun
> `/kunlik` sizni qaytarib yuboradi. Sinash uchun ertagacha kuting yoki
> `/reset` buyrug'ini ishlating.

---

## 5. Hal qilinmagan — bilib turing

### 🔴 KV yozuv chegarasi — eng yaqin xavf

Bepul Cloudflare KV kuniga **1 000 ta yozuvga** ruxsat beradi. Bitta foydalanuvchi kunlik viktorinada ~43 ta yozuv qiladi.

**Chegara: kuniga ~23 ta faol foydalanuvchi.**

Undan oshganda bot qulamaydi — bundan yomoni, **jim turadi**: javoblar yozilmaydi, reytingga tushmaydi, xato ham ko'rinmaydi. Hozir ~8 kishi ishlatyapti, shuning uchun bilinmayapti.

Yechim ikkita: Workers Paid ($5/oy) yoki D1 ga ko'chish (bepul, ko'proq ish). Platforma bilan birlashtirish rejasi borligini hisobga olsak, to'g'ri yo'l — platformaning PostgreSQL bazasiga o'tish.

### 🟡 Marafon cronlari bo'sh ishlayapti

`postFaslElon` va `postChannelBoard` har kuni ishga tushadi, lekin marafon 2026-08-21 da tugagan — ikkalasi ham darhol chiqib ketadi. Zarari yo'q, lekin `CHANNEL_ID` tashlab ketilgan kanalga ishora qilib turibdi.

Marafonni @ustozimnurimco da qayta boshlasangiz: `CHANNEL_ID` va `KITOB_START` ni yangilash kifoya.

### 🟡 Reyting 300 kishida uzayib ketadi

Hozir hamma ishtirokchi ko'rinadi — 8 kishida to'g'ri qaror. 300 kishida bu guruhga har kecha 4-5 ta uzun xabar degani. O'sha paytda: guruhga top-20, lichkaga shaxsiy o'rin.

### 🟡 Bot tokeni almashtirilmagan

Token suhbatda bir necha marta ochiq ishlatilgan. @BotFather → `/revoke` → yangisini `npx wrangler secret put BOT_TOKEN` bilan qo'ying.

---

## 6. Keyingi bosqich

Kelishganimizdek, bular alohida ish:

1. **Yo'nalish tizimi** — Aralash standart, 5 ta yo'nalish ixtiyoriy; kuniga navbatma-navbat 13 va 11 ta savol, hamma uchun bir xil son
2. **Kichik banklarni kengaytirish** — Diniy, Kino, Mantiq'ni 150 tagacha (~270 ta yangi savol)
3. **Bazani ko'chirish** — platformaning PostgreSQL'iga
4. **AI agent qatlami** — kunlik fokus, haftalik tahlil, xatolar ustida ish

4-bandni boshlashdan oldin platforma stack'i va oylik byudjet aniq bo'lishi kerak.
