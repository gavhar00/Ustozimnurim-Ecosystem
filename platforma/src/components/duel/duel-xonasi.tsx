"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, Clock, Swords, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duelBekor, duelBoshla, duelHolatiniOl, duelJavob, duelQabul } from "@/app/duel/amallar";
import { MuallifAvatari } from "@/components/lenta/muallif-avatari";
import { qiyinlikNomi, yonalishNomi, type DuelHolati } from "@/lib/duel-turlari";
import { cn } from "@/lib/utils";

type Ishtirokchi = { id: string; ism: string; avatar: string | null };

const TUGAGAN = ["tugadi", "rad", "bekor"];

export function DuelXonasi({
  boshlangich,
  men,
  raqib,
}: {
  boshlangich: DuelHolati;
  men: Ishtirokchi;
  raqib: Ishtirokchi;
}) {
  const [h, setH] = useState(boshlangich);
  const [hozir, setHozir] = useState(() => Date.parse(boshlangich.server_vaqti));
  const [yuborilgan, setYuborilgan] = useState<Record<number, number>>({});
  const [xato, setXato] = useState("");
  const [band, startTransition] = useTransition();
  const farq = useRef(0); // server vaqti - mijoz vaqti (ms)
  const idRef = useRef(boshlangich.id);

  const yangila = useCallback(async () => {
    const yangi = await duelHolatiniOl(idRef.current);
    if (!yangi) return;
    farq.current = Date.parse(yangi.server_vaqti) - Date.now();
    setH(yangi);
  }, []);

  // Server vaqtiga moslangan soat
  useEffect(() => {
    farq.current = Date.parse(boshlangich.server_vaqti) - Date.now();
    const t = setInterval(() => setHozir(Date.now() + farq.current), 250);
    return () => clearInterval(t);
  }, [boshlangich.server_vaqti]);

  // Davriy yangilanish — duel tugamaguncha
  useEffect(() => {
    if (TUGAGAN.includes(h.holat)) return;
    const t = setInterval(yangila, 4000);
    return () => clearInterval(t);
  }, [h.holat, yangila]);

  const tugash = h.tugash ? Date.parse(h.tugash) : null;
  const muddat = Date.parse(h.muddat);
  const ochiqHolat = h.holat === "kutilmoqda" || h.holat === "boshlandi";

  // Shaxsiy vaqt tugaganda natija hisoblanishi uchun
  const vaqtTugadi = tugash !== null && hozir >= tugash;
  useEffect(() => {
    if (ochiqHolat && h.men_boshladi && vaqtTugadi && !h.men_tugatdim) void yangila();
  }, [ochiqHolat, h.men_boshladi, h.men_tugatdim, vaqtTugadi, yangila]);

  const menChaqiruvchi = h.men_chaqiruvchi;
  const mening = {
    ...Object.fromEntries((h.mening_javoblarim ?? []).map((j) => [j.tartib, j.tanlov])),
    ...yuborilgan,
  } as Record<number, number>;
  const javobSoni = Object.keys(mening).length;

  function amal(f: () => Promise<{ ok: boolean; xato?: string }>) {
    setXato("");
    startTransition(async () => {
      const n = await f();
      if (!n.ok) setXato(n.xato ?? "Xatolik yuz berdi.");
      await yangila();
    });
  }

  function tanla(tartib: number, tanlov: number) {
    if (mening[tartib] !== undefined) return;
    setYuborilgan((o) => ({ ...o, [tartib]: tanlov }));
    void duelJavob(h.id, tartib, tanlov).then((n) => {
      if (!n.ok) {
        setXato(n.xato);
        setYuborilgan((o) => {
          const k = { ...o };
          delete k[tartib];
          return k;
        });
      }
    });
  }

  const sarlavha = (
    <div className="surface-card flex items-center justify-between gap-3 p-4 sm:p-5">
      <Kishi k={men} />
      <div className="flex flex-col items-center text-center">
        <Swords className="size-6 text-gold-300" aria-hidden="true" />
        <p className="mt-1 text-xs font-bold text-fg-muted">
          {yonalishNomi(h.yonalish)} · {qiyinlikNomi(h.qiyinlik)}
        </p>
        <p className="text-xs text-fg-muted">
          {h.vazifalar_soni} ta savol · {Math.round(h.davomiylik / 60)} daqiqa
        </p>
      </div>
      <Kishi k={raqib} ongda />
    </div>
  );

  let tana: React.ReactNode;

  const muddatMatni = (() => {
    const ms = Math.max(0, muddat - hozir);
    const soat = Math.floor(ms / 3_600_000);
    const daq = Math.floor((ms % 3_600_000) / 60_000);
    return soat > 0 ? `${soat} soat ${daq} daqiqa` : `${daq} daqiqa`;
  })();

  if (ochiqHolat && !h.men_boshladi) {
    const raqibIshlagan = h.raqib_boshladi;
    tana = (
      <Markaz
        ikona={<Swords className="size-8" />}
        sarlavha={menChaqiruvchi ? "Duelni boshlang" : `${raqib.ism} sizni duelga chaqirdi`}
        izoh={`${h.vazifalar_soni} ta savol, ${Math.round(h.davomiylik / 60)} daqiqa. Ikkalangizga savollar bir xil, lekin bir vaqtda ishlash shart emas. ${
          raqibIshlagan ? `${raqib.ism} allaqachon ishlab bo‘lgan yoki ishlayapti. ` : ""
        }Kirish uchun ${muddatMatni} qoldi — undan keyin kirmagan odam yutqazadi. “Boshlash”ni bossangiz vaqt darrov hisoblana boshlaydi.`}
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button disabled={band} onClick={() => amal(() => duelBoshla(h.id))}>Boshlash</Button>
          {!menChaqiruvchi ? (
            <Button variant="secondary" disabled={band} onClick={() => amal(() => duelQabul(h.id, false))}>Rad etish</Button>
          ) : !raqibIshlagan ? (
            <Button variant="secondary" disabled={band} onClick={() => amal(() => duelBekor(h.id))}>Taklifni bekor qilish</Button>
          ) : null}
        </div>
      </Markaz>
    );
  } else if (ochiqHolat && h.men_tugatdim) {
    tana = (
      <Markaz
        ikona={<Clock className="size-8" />}
        sarlavha="Siz ishingizni tugatdingiz"
        izoh={
          h.raqib_boshladi
            ? `${raqib.ism} hali tugatmagan. Natija ikkalangiz tugatgach chiqadi.`
            : `${raqib.ism} hali kirmagan. ${muddatMatni} ichida kirmasa, siz g‘olib bo‘lasiz.`
        }
      >
        <Link href="/duel" className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 font-bold hover:border-gold-400/60">
          Duellar sahifasi
        </Link>
      </Markaz>
    );
  } else if (ochiqHolat) {
    if (!h.vazifalar) {
      tana = <Markaz ikona={<Clock className="size-8" />} sarlavha="Savollar yuklanmoqda…" />;
    } else {
      const qolgan = Math.max(0, Math.ceil(((tugash ?? hozir) - hozir) / 1000));
      const vazifalar = h.vazifalar;
      const joriy = vazifalar.find((v) => mening[v.tartib] === undefined);
      const hammasi = !joriy;
      tana = (
        <div className="surface-card p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between text-sm font-bold">
            <span className="text-fg-muted">
              Savol {Math.min(javobSoni + 1, vazifalar.length)} / {vazifalar.length}
            </span>
            <span className={cn("inline-flex items-center gap-1.5 tabular-nums", qolgan <= 10 ? "text-red-400" : "text-gold-300")}>
              <Clock className="size-4" aria-hidden="true" />
              {Math.floor(qolgan / 60)}:{String(qolgan % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-border-subtle" aria-hidden="true">
            <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${(javobSoni / vazifalar.length) * 100}%` }} />
          </div>
          {joriy && !vaqtTugadi ? (
            <>
              <h2 className="text-lg font-extrabold leading-snug sm:text-xl">{joriy.savol}</h2>
              <div className="mt-5 grid gap-3">
                {joriy.variantlar.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => tanla(joriy.tartib, i)}
                    className="rounded-2xl border border-border-subtle bg-bg-card px-4 py-3.5 text-left font-semibold transition-colors hover:border-gold-400/60 hover:bg-gold-400/10"
                  >
                    <code className="font-[family-name:var(--font-mono-code)] text-[0.95rem]">{v}</code>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="py-6 text-center font-bold text-fg-muted">
              {hammasi ? "Barcha savollarga javob berdingiz. Natija hisoblanmoqda…" : "Vaqt tugadi. Natija hisoblanmoqda…"}
            </p>
          )}
        </div>
      );
    }
  } else if (h.holat === "tugadi") {
    const menBall = (menChaqiruvchi ? h.chaqiruvchi_ball : h.raqib_ball) ?? 0;
    const raqibBall = (menChaqiruvchi ? h.raqib_ball : h.chaqiruvchi_ball) ?? 0;
    const ozgarish = (menChaqiruvchi ? h.chaqiruvchi_ozgarish : h.raqib_ozgarish) ?? 0;
    const yutdim = h.galib_id === men.id;
    const durrang = h.galib_id === null;
    tana = (
      <>
        <div className="surface-card p-6 text-center sm:p-8">
          <Trophy className={cn("mx-auto size-10", durrang ? "text-fg-muted" : yutdim ? "text-gold-300" : "text-fg-muted")} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            {durrang ? "Durang" : yutdim ? "Siz g‘olib bo‘ldingiz!" : `${raqib.ism} g‘olib bo‘ldi`}
          </h2>
          <p className="mt-2 text-lg font-extrabold tabular-nums">
            {menBall} : {raqibBall}
          </p>
          {(h.raqib_javoblari ?? []).length === 0 && !durrang ? (
            <p className="mt-1 text-sm text-fg-muted">
              {yutdim ? `${raqib.ism} 24 soat ichida kirmadi.` : "Siz 24 soat ichida kirmadingiz."}
            </p>
          ) : null}
          <p className="mt-1 text-sm font-bold text-fg-muted">
            Reyting:{" "}
            <span className={ozgarish > 0 ? "text-emerald-400" : ozgarish < 0 ? "text-red-400" : ""}>
              {ozgarish > 0 ? `+${ozgarish}` : ozgarish}
            </span>
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/duel" className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 font-bold hover:border-gold-400/60">
              Duellar sahifasi
            </Link>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {(h.vazifalar ?? []).map((v) => {
            const mn = mening[v.tartib];
            const rq = h.raqib_javoblari?.find((j) => j.tartib === v.tartib)?.tanlov;
            return (
              <div key={v.tartib} className="surface-card p-4 sm:p-5">
                <p className="font-extrabold">{v.tartib + 1}. {v.savol}</p>
                <ul className="mt-3 grid gap-2 text-sm">
                  {v.variantlar.map((o, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2",
                        i === v.togri ? "border-emerald-500/50 bg-emerald-500/10" : mn === i ? "border-red-500/40 bg-red-500/10" : "border-border-subtle",
                      )}
                    >
                      <code className="font-[family-name:var(--font-mono-code)]">{o}</code>
                      <span className="flex shrink-0 gap-1.5 text-xs font-bold text-fg-muted">
                        {mn === i ? <span>Siz</span> : null}
                        {rq === i ? <span>{raqib.ism.split(" ")[0]}</span> : null}
                        {i === v.togri ? <Check className="size-4 text-emerald-400" aria-label="To‘g‘ri javob" /> : mn === i ? <X className="size-4 text-red-400" aria-hidden="true" /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {mn === undefined ? <p className="mt-2 text-xs text-fg-muted">Siz bu savolga javob bermadingiz.</p> : null}
              </div>
            );
          })}
        </div>
      </>
    );
  } else {
    tana = (
      <Markaz ikona={<X className="size-8" />} sarlavha={h.holat === "rad" ? "Taklif rad etildi" : "Duel bekor qilindi"}>
        <Link href="/duel" className="inline-flex h-11 items-center rounded-full border border-border-strong px-5 font-bold hover:border-gold-400/60">
          Duellar sahifasiga qaytish
        </Link>
      </Markaz>
    );
  }

  return (
    <div className="space-y-5">
      {sarlavha}
      {tana}
      {xato ? <p role="alert" className="text-center text-sm font-bold text-red-400">{xato}</p> : null}
    </div>
  );
}

function Kishi({ k, ongda }: { k: Ishtirokchi; ongda?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", ongda && "flex-row-reverse text-right")}>
      <MuallifAvatari ism={k.ism} url={k.avatar} className="size-11" />
      <p className="truncate text-sm font-extrabold sm:text-base">{k.ism}</p>
    </div>
  );
}

function Markaz({ ikona, sarlavha, izoh, children }: { ikona: React.ReactNode; sarlavha: string; izoh?: string; children?: React.ReactNode }) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      <span className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300">{ikona}</span>
      <h2 className="mt-4 text-xl font-black">{sarlavha}</h2>
      {izoh ? <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{izoh}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
