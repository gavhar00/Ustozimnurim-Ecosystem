import type { Metadata } from "next";
import { ClipboardList, Plus } from "lucide-react";
import { VazifaAmallari, VazifaFormasi } from "@/components/admin/vazifa-formasi";
import { EmptyState } from "@/components/ui/empty-state";
import { adminVazifalari } from "@/lib/data/vazifalar";

export const metadata: Metadata = { title: "Vazifalar", robots: { index: false, follow: false } };

const vaqt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function AdminVazifalar() {
  const royxat = await adminVazifalari();
  const hozir = new Date().getTime();
  return (
    <>
      <header>
        <h1 className="text-2xl font-black leading-tight sm:text-3xl">Amaliyot vazifalari</h1>
        <p className="mt-2 leading-relaxed text-fg-muted">
          Vazifa va loyiha faylini qo‘shing. O‘quvchi «Boshlash»ni bosganda muddat (standart 48 soat) shu zahoti ochiladi,
          muddat ichida topshiradi, so‘ng keyingi vazifaga o‘tadi. Vazifalar yaratilish tartibida beriladi.
        </p>
      </header>

      <section className="mt-7">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-extrabold">
          <Plus className="size-5 text-gold-300" aria-hidden="true" /> Yangi vazifa
        </h2>
        <div className="surface-card p-6"><VazifaFormasi /></div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-extrabold">Barcha vazifalar</h2>
        {royxat.length === 0 ? (
          <div className="mt-4">
            <EmptyState ikona={<ClipboardList className="size-7" aria-hidden="true" />} sarlavha="Vazifa yo‘q" izoh="Yuqoridagi formadan birinchi vazifani yarating." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {royxat.map((v) => (
              <li key={v.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold">№{v.tartib}. {v.nom}</p>
                    <p className="mt-1 text-sm text-fg-muted">
                      {v.muddat_soat} soat · {v.fayl_nomi ? `fayl: ${v.fayl_nomi}` : "faylsiz"} · {v.topshiriqlar.length} ta urinish,{" "}
                      {v.topshiriqlar.filter((t) => t.topshirilgan).length} ta topshirilgan
                    </p>
                  </div>
                  <span className={v.holat === "chop_etilgan" ? "rounded-pill border border-border-strong bg-gold-400/12 px-3 py-1 text-xs font-extrabold text-gold-300" : "rounded-pill border border-border-subtle px-3 py-1 text-xs font-bold text-fg-muted"}>
                    {v.holat === "chop_etilgan" ? "Chop etilgan" : "Qoralama"}
                  </span>
                </div>
                <div className="mt-4"><VazifaAmallari id={v.id} holat={v.holat} faylNomi={v.fayl_nomi} /></div>

                {v.topshiriqlar.length > 0 ? (
                  <ul className="mt-4 divide-y divide-border-subtle rounded-xl border border-border-subtle">
                    {v.topshiriqlar.map((t) => {
                      const holat = t.topshirilgan ? "Topshirgan" : new Date(t.muddat).getTime() > hozir ? "Jarayonda" : "Muddat o‘tgan";
                      return (
                        <li key={t.id} className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold">{t.toliq_ism}</span>
                            <span className="text-xs text-fg-muted">
                              {holat} · boshladi {vaqt(t.boshlangan)} · muddat {vaqt(t.muddat)}
                              {t.topshirilgan ? ` · topshirdi ${vaqt(t.topshirilgan)}` : ""}
                            </span>
                          </div>
                          {t.html || t.css || t.js || t.python ? (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-bold text-gold-300">Kodni ko‘rish ({t.til === "web" ? "Veb" : "Python"})</summary>
                              <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-bg/70 p-3 font-mono text-xs leading-5">
{t.til === "python" ? t.python : `<!-- HTML -->\n${t.html}\n\n/* CSS */\n${t.css}\n\n// JS\n${t.js}`}
                              </pre>
                            </details>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
