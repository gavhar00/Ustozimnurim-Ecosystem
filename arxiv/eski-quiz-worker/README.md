# Ustozim Nurim — viktorina boti

Telegram bot: [@ustozimnurimbot](https://t.me/ustozimnurimbot)
Cloudflare Worker sifatida ishlaydi — server kerak emas, kompyuter o'chiq bo'lsa ham to'xtamaydi.

## Nima qiladi

Uchta rejim bor:

| Rejim | Mazmuni | Taymer |
|---|---|---|
| 🧠 Kunlik viktorina | Har kuni hamma uchun bir xil savollar, reytingga tushadi | Bor (20-45 soniya) |
| 📖 Kitob marafoni | «Ilm olish sirlari» kitobi, 14 fasl | Yo'q |
| 📚 O'z tezligimda | Bazadagi barcha savollar, ketma-ket mashq | Yo'q |

Taymer faqat kunlik viktorinada — chunki u reytingga tushadi va hamma teng
sharoitda bo'lishi kerak. O'rganish rejimlarida shoshirish zarar qiladi:
har kimning o'qish tezligi har xil.

## Tuzilishi

```
src/
├── index.js         bot mantiqi — xabarlar, savollar, reyting, cronlar
├── config.js        kunlik reja: qaysi kuni nechta savol, qaysi mavzudan
├── kitob.js         kitob marafoni: fasllar, progress
├── quiz_bank.json   kunlik viktorina bazasi (462 savol)
└── kitob_bank.json  kitob savollari (162 savol)
```

## Kunlik jadval (Toshkent vaqti)

| Vaqt | Nima bo'ladi |
|---|---|
| 05:00 | Yangi kun boshlanadi, savollar almashadi (UTC yarim tuni) |
| 20:00 | Guruhga kunlik e'lon |
| 21:00 | Kanalga fasl e'loni + ishlamaganlarga eslatma |
| 22:00 | Guruhga kunlik reyting |
| 23:00 | Kanalga kitob marafoni reytingi |

Jadval `wrangler.toml` dagi `crons` da, mantiq esa `index.js` dagi
`scheduled()` funksiyasida. Ikkalasi mos bo'lishi shart.

> **Eslatma.** Ilgari 20:00 dagi e'lon GitHub Actions'da turardi. GitHub
> ommaviy repozitoriyalarda jadvalli workflow'ni 60 kun harakatsizlikdan
> keyin o'zi o'chiradi — 2026-oktabrda aynan shunday bo'ldi va e'lon bir
> necha kun chiqmay qoldi. Shuning uchun u Worker cron'iga ko'chirildi.

## Ishga tushirish

```bash
npm install
npx wrangler login
npx wrangler deploy
```

Sirlar (bir martalik):

```bash
npx wrangler secret put BOT_TOKEN        # BotFather bergan token
npx wrangler secret put WEBHOOK_SECRET   # uzun tasodifiy satr
```

Mahalliy sinov uchun `.dev.vars.example` ni `.dev.vars` deb nusxalang.

## Savol qo'shish

`src/quiz_bank.json` oxiriga qo'shing:

```json
{"q": "Savol matni?", "o": ["variant1", "variant2", "variant3", "variant4"], "c": 0, "t": "IT"}
```

- `q` — savol, 300 belgidan oshmasin
- `o` — variantlar, 2-10 ta, har biri 100 belgidan oshmasin
- `c` — to'g'ri javob indeksi, **0 dan** boshlanadi
- `t` — mavzu: `IT`, `Liderlik`, `Diniy`, `Kino`, `Mantiq`

Kitob savollari (`kitob_bank.json`) qo'shimcha ikkita maydon oladi:
`f` — fasl raqami (1-14), `k` — savol turi (`fakt`, `sabab`, `iqtibos`,
`amaliy`, `taqqos`).

Taymerni qo'lda yozish shart emas — u `openPeriodFor()` da matn uzunligiga
qarab hisoblanadi.

O'zgartirgandan keyin `npx wrangler deploy` qilish **shart**, aks holda
jonli botda eski versiya qolaveradi.

## Admin buyruqlari

Faqat `ADMIN_ID` egasiga ishlaydi:

```
/stats          umumiy statistika
/sinov elon     guruhga kunlik e'lonni hozir yuborish
/sinov fasl     kanalga fasl e'lonini hozir yuborish
/sinov reyting  kanalga reytingni hozir yuborish
/reset [id]     foydalanuvchining bugungi holatini tozalash
```

## Texnik eslatmalar

**Cloudflare KV darhol yangilanmaydi.** Yozilgan qiymat shu zahoti
o'qilmasligi mumkin. Shuning uchun "nechanchi savoldaman" degan holat
hisoblagichdan emas, `p:{pollId}` yozuvidan olinadi.

**Savolni oldinga surish huquqi bitta.** Viktorinani bir necha yo'l surishi
mumkin (javob berish, poll yopilishi, tugma). `navbatniOl()` funksiyasi
`p:{pollId}` yozuvini o'chirib oladi — kim birinchi ulgursa, o'sha davom
ettiradi. Busiz foydalanuvchiga bitta savol ikki marta yoki ketma-ket
3-4 ta savol yuborilardi.

**KV ro'yxati sahifalanadi.** `SESSIONS.list()` bir chaqiruvda ko'pi bilan
1000 ta kalit qaytaradi. Barcha ro'yxatlar `listAll()` dan o'tadi, aks holda
1000-chi a'zodan keyingilari jimgina yo'qolardi.

## Saqlanadigan ma'lumot

| Kalit | Mazmuni | Muddat |
|---|---|---|
| `u:{uid}` | foydalanuvchi: ism, username, streak, ball | 400 kun |
| `b:{sana}:{uid}` | kunlik viktorina natijasi | 3 kun |
| `kd:{uid}:{fasl}` | fasl natijasi | 400 kun |
| `p:{pollId}` | savol → foydalanuvchi bog'lanishi | 12 soat |
| `done:{sana}:{uid}` | bugun yakunlangan belgisi | 3 kun |
