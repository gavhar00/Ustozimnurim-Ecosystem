# Ustozimnurim EcoSystem — xarita (har sessiyada shu bilan boshlang)

## Papkalar (`~/Downloads/dasturlash/projects/Ustozimnurim-EcoSystem/`)
| Papka | Nima | GitHub |
|---|---|---|
| `ustozimnurimbot/` | JONLI Telegram bot @ustozimnurimbot (~290 foydalanuvchi). Cloudflare Workers + D1 + KV, JavaScript. Qoidalar va xatolar jurnali: `CLAUDE.md` | ustozimnurimbot |
| `platforma/` | ustozimnurim.uz sayt kodi (yangi, bo'sh) | Ustozimnurim-EcoSystem/platforma |
| `hujjatlar/` | Dizayn tizimi (design-site, tokens), personaj (Lumi), README — kod emas | Google Drive zaxirasi |
| `kontekst/` | Claude Project'ga ulangan qisqa hujjatlar (shu papka) | — |
| `arxiv/` | ISHLATILMAYDI: eski quiz-worker, NestJS bot rejasi (Phase 1, hech qachon ishga tushmagan) | — |

## Ikki xil "bot" — chalkashtirma
- Jonli bot = `ustozimnurimbot/` (Cloudflare). Hamma bot ishi shu yerda.
- NestJS + grammY + Prisma/Neon + BullMQ "qulflangan arxitektura" — eski REJA, `arxiv/nestjs-bot/`. Uni jonli bot deb qabul qilma. Unga o'tish faqat admin qarori bilan.
- Ikkalasi bitta @ustozimnurimbot tokenini ishlata olmaydi.

## Ekotizim kanallari
@ustozimnurim (shaxsiy brend) · @sahifalarustozimnurim (kitob, challenge, quiz) · @ustozimnurimco (community) · @quranoy (Qur'on — eng ehtiyotkor, AI erkin kontent yo'q) · ustozimnurim.uz (platforma)

## Ish qoidalari (qisqa)
- Kod faqat repo papkalarida; hujjat/dizayn `hujjatlar/` da; eskirgan narsa o'chirilmaydi — `arxiv/` ga.
- Bitta ma'lumot bitta joyda; nusxa yaratilmaydi.
- Maxfiy kalitlar (token, .env) hech qachon Drive/GitHub/chatga tushmaydi.
- Admin bir narsani ikki marta aytmasin: tuzatishlar darhol `ustozimnurimbot/CLAUDE.md` ga yoziladi.

## Ochiq masalalar
- `hujjatlar/` dan yo'qolgan papkalar: TZ (docx), Kontent (aforizmlar.md), Hujjatlar (ADR, pufak-3d-pipeline.md), Personaj (pufak.blend) — 2026-11-01 da g'oyib bo'lgan, tiklanmagan.
- Bot reposini Ustozimnurim-EcoSystem organization'ga ko'chirish (Transfer).
