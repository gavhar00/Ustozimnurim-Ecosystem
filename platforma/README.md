# UstozimNurim — platforma

O‘zbek tilidagi interaktiv dasturlash platformasi. Darsni tomosha qiling,
kodni o‘sha yerda yozing, natijani darhol ko‘ring.

## Texnologiyalar

| Qatlam     | Tanlov                               |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16 (App Router) + TypeScript |
| Uslublar   | Tailwind CSS v4 (`@theme` tokenlari) |
| Animatsiya | Framer Motion                        |
| Ikonalar   | lucide-react                         |
| Shriftlar  | Nunito (matn), JetBrains Mono (kod)  |
| Backend    | Supabase (auth, Postgres, storage)   |

## Ishga tushirish

```bash
npm install
cp .env.example .env.local   # Supabase kalitlarini to‘ldiring
npm run dev                  # http://localhost:3000
```

### Bazani tayyorlash

`supabase/migrations/0001_boshlangich_sxema.sql` faylini Supabase loyihangizning
SQL muharririda ishga tushiring (yoki `supabase db push`). U jadvallar, RLS
siyosatlari va yo‘nalishlar ro‘yxatini yaratadi.

Birinchi administratorni qo‘lda belgilang — ro‘yxatdan o‘tgandan keyin:

```sql
update public.profillar set rol = 'admin' where id = '<foydalanuvchi uuid>';
```

Tekshiruv buyruqlari:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # Production build
```

## Papka tuzilmasi

```
supabase/migrations/     # Baza sxemasi va RLS siyosatlari
src/
├─ proxy.ts              # Sessiyani yangilaydi, /panel va /admin ni qo‘riqlaydi
├─ app/                  # Sahifalar (App Router)
├─ components/
│  ├─ brand/             # Logo va brend elementlari
│  ├─ layout/            # Navbar, Footer, mavzu almashtirgich
│  ├─ home/              # Bosh sahifa bo‘limlari
│  └─ ui/                # Qayta ishlatiladigan primitivlar
└─ lib/
   ├─ auth.ts            # Joriy profil va rol tekshiruvi
   ├─ data/              # Ma’lumot so‘rovlari
   ├─ supabase/          # Server va brauzer klientlari
   ├─ maskot.ts          # Maskot rasmlari yo‘llari
   └─ navigatsiya.ts     # Menyu tuzilmasi
```

## Muhim qoidalar

1. **Butun interfeys o‘zbek tilida.** Ingliz tili faqat kod, texnik
   identifikatorlar va texnologiya nomlari uchun.
2. **Soxta ma’lumot yo‘q.** Statistika faqat bazadan hisoblanadi; baza
   ulanmagan yoki ma’lumot bo‘lmasa, blok umuman ko‘rsatilmaydi
   (`src/lib/data/statistika.ts`). Sharhlar bloki real sharhlar paydo
   bo‘lgandan keyin qo‘shiladi.
3. **Maskot.** Rasmlar `public/maskot/` ga qo‘yiladi va yo‘llari
   `src/lib/maskot.ts` da ko‘rsatiladi. Yo‘l `null` bo‘lsa, interfeys
   o‘rniga joy ajratadi — boshqa personaj qo‘yilmaydi.

## Holat

- [x] 1-bosqich — loyiha skeleti, dizayn tizimi, Bosh sahifa
- [x] 2-bosqich — Kurslar, Kurs sahifasi, Yo‘nalishlar, Hamjamiyat, Notlar,
      Biz haqimizda, auth sahifalari, 404, sitemap va robots
- [x] 3-bosqich — Supabase sxemasi va RLS, sessiya, rollar (o‘quvchi / ustoz / admin),
      himoyalangan marshrutlar
- [x] 4-bosqich — O‘quvchi paneli (umumiy ko‘rinish, kurslarim, yutuqlar, profil)
- [ ] 5-bosqich — Interaktiv dars ekrani (video + kod muharriri + natija)
- [ ] 6-bosqich — AI mentor va Hamjamiyat
- [ ] 7-bosqich — Admin paneli
- [ ] 8-bosqich — Test, optimizatsiya, production deploy
