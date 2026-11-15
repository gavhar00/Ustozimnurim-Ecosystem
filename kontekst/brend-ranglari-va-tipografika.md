# Ustozim Nurim — brend ranglari va tipografika (Design System v0.1.0)

Manba: `hujjatlar/Dizayn-tizimi/design-site/tokens/tokens.json` (asl manba shu fayl; bu yerda qisqa nusxa).

## Asosiy ranglar
| Token | Qorong'i tema | Yorug' tema | Ishlatish |
|---|---|---|---|
| gold (brend) | #D6AC55 | #D6AC55 | Tugma, belgi, rangli blok. Yorug' fonda MATN rangi emas |
| on-gold | #121317 | #121317 | gold ustidagi matn |
| surface | #121317 | #F6F1E7 | Sahifa foni |
| surface-raised | #1A1B20 | #FFFDF8 | Karta, panel |
| surface-sunken | #0D0E11 | #EDE6D6 | Kiritish maydoni |
| ink | #F6F1E7 | #27282D | Asosiy matn |
| ink-muted | #B9BBC2 | #5A5C64 | Ikkilamchi matn |
| ink-faint | #8A8C94 | #6E6A60 | Placeholder |
| accent-text | #FFE7A8 | #7A4F0E | Ta'kidlangan so'z |
| glow | #FFE7A8 | #FFE7A8 | Nur effekti (matn emas) |
| hairline | #2C2D34 | #E0D8C6 | Bezak chiziq |
| border-strong | #6A6C76 | #8F897A | Kiritish maydoni chegarasi |
| success / warning / danger / info | #5CC796 / #F0A04B / #F27B72 / #7DB3FF | #1B7A52 / #9A5A00 / #B3261E / #1F5FBF | Holat ranglari |

Brend: night #121317, charcoal #27282D, cream #F6F1E7, logo-reverse #F8F8F6.
Gold shkalasi: 50 #FBF5E7 · 100 #F6EBD4 · 200 #EEDBB5 · 300 #E5C993 · 400 #DDB972 · 500 #D6AC55 · 600 #AD8941 · 700 #886A30 · 800 #664D20 · 900 #483412.
Personaj (Lumi/Pufak): fur-cream #EAC8A4, fur-body #DFBB99, foot-gold #BB7F43, brow-gold #C68032, nose-brown #A26241, iris-brown #974C0F, tuft-glow #FDF89B.

## Shriftlar
- Sarlavha (display): **Commissioner** (zaxira: Onest)
- Matn (sans): **Onest**
- Kod (mono): **IBM Plex Mono**

| Uslub | O'lcham | Qalinlik | Ishlatish |
|---|---|---|---|
| display-2xl | clamp(56px, 9vw, 128px) | 800 | Faqat landing hero, kichik harf, ≤6 so'z ("ilm — nur.") |
| display-xl | clamp(44px, 6vw, 88px) | 800 | Bo'lim hero |
| display-l | clamp(36px, 4.4vw, 56px) | 800 | Katta bo'lim sarlavhasi |
| h1 | 40px | 700 | Sahifa sarlavhasi (bittadan) |
| h2 | 32px | 700 | Bo'lim |
| h3 | 24px | 700 | Karta sarlavhasi |
| h4 | 20px | 600 | Kichik sarlavha |

## O'lchamlar
- Oraliq: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 px
- Burchak: 6 (xs) · 8 (sm) · 16 (karta) · 28 (katta panel) · 40 (hero) · 999 (tabletka)
- Animatsiya: 120ms hover · 200ms tugma · 360ms panel · 900ms "nur" (yutuq, kamdan-kam); ease cubic-bezier(.2,.8,.2,1)
- Ikonka: 24px to'r, chiziq 1.75; o'lchamlar 16/20/24/32/48
- Breakpoint: 480 · 768 · 1024 · 1280 · 1536

Ko'rish (yopiq havola, faqat egasi uchun): https://claude.ai/artifact/RQfZ3rgjCR53JkmYcVUMHd

## Qaror
- Rasmiy brend tilla rangi: **#D6AC55**. `ustozim-video` loyihasi (u yerda #E2B93B) hozircha ishlatilmaydi — unga moslashtirilmaydi.
