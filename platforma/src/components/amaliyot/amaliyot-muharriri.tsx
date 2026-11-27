"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Play, Plus, Save, Send, Trash2 } from "lucide-react";
import { kodniOchir, kodniSaqla } from "@/app/amaliyot/amallar";
import { vazifaniSaqla } from "@/app/amaliyot/vazifa-amallar";
import {
  BOSHLANGICH_PYTHON,
  BOSHLANGICH_WEB,
  type AmaliyotTili,
  type SaqlanganKod,
} from "@/lib/amaliyot-turlari";
import { cn } from "@/lib/utils";

type Qator = { tur: "log" | "warn" | "xato"; matn: string };
type Varaq = "html" | "css" | "js";

const WEB_MANBA = "ustozim-amaliyot-web";
const PY_MANBA = "ustozim-amaliyot-py";
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
const PY_VAQT_CHEGARASI = 15000;

/** Natija oynasi uchun to‘liq hujjat; console chiqishi ota sahifaga xabar sifatida yuboriladi. */
function webHujjat(html: string, css: string, js: string, nusxa: number) {
  const korinish = `
    const k = (q) => { try { return typeof q === "string" ? q : JSON.stringify(q); } catch { return String(q); } };
    const yubor = (tur, a) => parent.postMessage({ manba: "${WEB_MANBA}", tur, matn: a.map(k).join(" ") }, "*");
    for (const [n, t] of [["log","log"],["info","log"],["debug","log"],["warn","warn"],["error","xato"]]) {
      console[n] = (...a) => yubor(t, a);
    }
    window.addEventListener("error", (e) => yubor("xato", [e.message]));
    window.addEventListener("unhandledrejection", (e) => yubor("xato", [String(e.reason)]));
  `;
  const xavfsizJs = js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><!-- ${nusxa} --><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css.replace(/<\/style/gi, "<\\/style")}</style><script>${korinish}</script></head><body>${html}<script>${xavfsizJs}</script></body></html>`;
}

/** Python uchun ajratilgan oyna: Pyodide alohida Web Worker ichida ishlaydi (asosiy sahifa muzlamaydi). */
function pyHujjat() {
  const ishchi = `
    importScripts(${JSON.stringify(PYODIDE)});
    let py = null;
    self.onmessage = async (e) => {
      try {
        if (!py) {
          postMessage({ t: "holat", m: "yuklanmoqda" });
          py = await loadPyodide();
        }
        py.setStdout({ batched: (s) => postMessage({ t: "log", m: s }) });
        py.setStderr({ batched: (s) => postMessage({ t: "xato", m: s }) });
        postMessage({ t: "holat", m: "bajarilmoqda" });
        await py.runPythonAsync(e.data.kod);
      } catch (err) {
        postMessage({ t: "xato", m: String((err && err.message) || err) });
      }
      postMessage({ t: "holat", m: "tugadi" });
    };
  `;
  return `<!doctype html><html><body><script>
    const ishchi = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(ishchi)}], { type: "text/javascript" })));
    ishchi.onmessage = (e) => parent.postMessage({ manba: "${PY_MANBA}", ...e.data }, "*");
    ishchi.onerror = (e) => parent.postMessage({ manba: "${PY_MANBA}", t: "xato", m: String(e.message || "Pyodide yuklanmadi") }, "*");
    addEventListener("message", (e) => { if (e.source === parent && e.data && typeof e.data.kod === "string") ishchi.postMessage({ kod: e.data.kod }); });
    parent.postMessage({ manba: "${PY_MANBA}", t: "tayyor" }, "*");
  <\/script></body></html>`;
}

const maydon =
  "min-h-[16rem] w-full flex-1 resize-none rounded-b-2xl bg-bg/70 p-4 font-mono text-[0.82rem] leading-6 text-fg outline-none placeholder:text-fg-muted";

export type VazifaKodi = {
  id: string;
  til: AmaliyotTili;
  html: string;
  css: string;
  js: string;
  python: string;
};

export function AmaliyotMuharriri({
  saqlanganlar,
  vazifa,
}: {
  saqlanganlar: SaqlanganKod[];
  /** Faol vazifa bo‘lsa — shu vazifa qoralamasi bilan ochiladi va «Topshirish» tugmasi chiqadi. */
  vazifa?: VazifaKodi;
}) {
  const router = useRouter();
  const [til, setTil] = useState<AmaliyotTili>(vazifa?.til ?? "web");
  const [varaq, setVaraq] = useState<Varaq>("html");
  const [html, setHtml] = useState(vazifa ? vazifa.html : BOSHLANGICH_WEB.html);
  const [css, setCss] = useState(vazifa ? vazifa.css : BOSHLANGICH_WEB.css);
  const [js, setJs] = useState(vazifa ? vazifa.js : BOSHLANGICH_WEB.js);
  const [qollanganJs, setQollanganJs] = useState(vazifa ? vazifa.js : BOSHLANGICH_WEB.js);
  const [nusxa, setNusxa] = useState(0);
  const [python, setPython] = useState(vazifa ? vazifa.python : BOSHLANGICH_PYTHON);
  const [korinishHtml, setKorinishHtml] = useState(vazifa ? vazifa.html : BOSHLANGICH_WEB.html);
  const [korinishCss, setKorinishCss] = useState(vazifa ? vazifa.css : BOSHLANGICH_WEB.css);
  const [chiqish, setChiqish] = useState<Qator[]>([]);
  const [pyHolat, setPyHolat] = useState<"bosh" | "yuklanmoqda" | "bajarilmoqda">("bosh");
  const [pyKalit, setPyKalit] = useState(0);
  const [royxat, setRoyxat] = useState(saqlanganlar);
  const [joriyId, setJoriyId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [xabar, setXabar] = useState<{ ok: boolean; matn: string } | null>(null);
  const [kutilmoqda, startTransition] = useTransition();
  const webRef = useRef<HTMLIFrameElement>(null);
  const pyRef = useRef<HTMLIFrameElement>(null);
  const pyTayyor = useRef(false);
  const pyKutayotgan = useRef<string | null>(null);
  const pyTaymer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HTML va CSS yozish to‘xtagach yangilanadi; JS faqat "Ishga tushirish" bosilganda qo‘llanadi.
  useEffect(() => {
    const t = setTimeout(() => {
      setKorinishHtml(html);
      setKorinishCss(css);
    }, 450);
    return () => clearTimeout(t);
  }, [html, css]);

  const webSrcDoc = useMemo(
    () => webHujjat(korinishHtml, korinishCss, qollanganJs, nusxa),
    [korinishHtml, korinishCss, qollanganJs, nusxa],
  );

  // Natija yangilanganda konsolni tozalaymiz (srcDoc o‘zgarishi bilan birga).
  const oldingiDoc = useRef(webSrcDoc);
  useEffect(() => {
    if (oldingiDoc.current !== webSrcDoc) {
      oldingiDoc.current = webSrcDoc;
      const t = setTimeout(() => setChiqish([]), 0);
      return () => clearTimeout(t);
    }
  }, [webSrcDoc]);

  const pyToxtat = useCallback(() => {
    if (pyTaymer.current) clearTimeout(pyTaymer.current);
    pyTaymer.current = null;
    pyKutayotgan.current = null;
    pyTayyor.current = false;
    setPyKalit((k) => k + 1);
    setPyHolat("bosh");
  }, []);

  useEffect(() => {
    function qabul(e: MessageEvent) {
      const d = e.data as { manba?: string; tur?: string; t?: string; matn?: string; m?: string } | null;
      if (!d) return;
      if (d.manba === WEB_MANBA && e.source === webRef.current?.contentWindow) {
        const tur = d.tur === "warn" || d.tur === "xato" ? d.tur : "log";
        setChiqish((q) => (q.length >= 300 ? q : [...q, { tur, matn: String(d.matn ?? "") }]));
      } else if (d.manba === PY_MANBA && e.source === pyRef.current?.contentWindow) {
        if (d.t === "tayyor") {
          pyTayyor.current = true;
          if (pyKutayotgan.current !== null) {
            pyRef.current?.contentWindow?.postMessage({ kod: pyKutayotgan.current }, "*");
            pyKutayotgan.current = null;
          }
        } else if (d.t === "holat") {
          if (d.m === "yuklanmoqda") setPyHolat("yuklanmoqda");
          else if (d.m === "bajarilmoqda") {
            setPyHolat("bajarilmoqda");
            if (pyTaymer.current) clearTimeout(pyTaymer.current);
            pyTaymer.current = setTimeout(() => {
              setChiqish((q) => [...q, { tur: "xato", matn: "Vaqt tugadi (15 soniya): dastur to‘xtatildi." }]);
              pyToxtat();
            }, PY_VAQT_CHEGARASI);
          } else if (d.m === "tugadi") {
            if (pyTaymer.current) clearTimeout(pyTaymer.current);
            setPyHolat("bosh");
          }
        } else if (d.t === "log" || d.t === "xato") {
          setChiqish((q) => (q.length >= 300 ? q : [...q, { tur: d.t === "xato" ? "xato" : "log", matn: String(d.m ?? "") }]));
        }
      }
    }
    window.addEventListener("message", qabul);
    return () => window.removeEventListener("message", qabul);
  }, [pyToxtat]);

  function ishgaTushir() {
    if (til === "web") {
      setChiqish([]);
      setQollanganJs(js);
      setKorinishHtml(html);
      setKorinishCss(css);
      setNusxa((n) => n + 1); // kod o‘zgarmagan bo‘lsa ham oyna qayta yuklansin
      return;
    }
    setChiqish([]);
    if (pyHolat !== "bosh") return;
    setPyHolat("yuklanmoqda");
    if (pyTayyor.current) {
      pyRef.current?.contentWindow?.postMessage({ kod: python }, "*");
    } else {
      pyKutayotgan.current = python;
    }
  }

  function yangi(t: AmaliyotTili) {
    if (t === "python") pyToxtat();
    setTil(t);
    setJoriyId(null);
    setNom("");
    setChiqish([]);
    setXabar(null);
  }

  function ochish(k: SaqlanganKod) {
    pyToxtat();
    setTil(k.til);
    setHtml(k.html);
    setCss(k.css);
    setJs(k.js);
    setQollanganJs(k.js);
    setKorinishHtml(k.html);
    setKorinishCss(k.css);
    setPython(k.python);
    setJoriyId(k.id);
    setNom(k.nom);
    setChiqish([]);
    setXabar(null);
  }

  function saqla(yangiSifatida: boolean) {
    setXabar(null);
    startTransition(async () => {
      const id = yangiSifatida ? null : joriyId;
      const r = await kodniSaqla(id, nom || "Nomsiz kod", til, html, css, js, python);
      if (!r.ok) return setXabar({ ok: false, matn: r.xato });
      const hozir = new Date().toISOString();
      const yozuv: SaqlanganKod = { id: r.malumot.id, nom: nom || "Nomsiz kod", til, html, css, js, python, yangilangan: hozir };
      setRoyxat((q) => [yozuv, ...q.filter((x) => x.id !== yozuv.id)]);
      setJoriyId(yozuv.id);
      if (!nom) setNom("Nomsiz kod");
      setXabar({ ok: true, matn: "Saqlandi." });
    });
  }

  function vazifaSaqlash(yakuniy: boolean) {
    if (!vazifa) return;
    setXabar(null);
    startTransition(async () => {
      const r = await vazifaniSaqla(vazifa.id, til, html, css, js, python, yakuniy);
      if (!r.ok) return setXabar({ ok: false, matn: r.xato });
      if (yakuniy) return router.refresh();
      setXabar({ ok: true, matn: "Vazifa qoralamasi saqlandi." });
    });
  }

  function topshirish() {
    if (typeof window !== "undefined" && !window.confirm("Vazifani topshirasizmi? Topshirilgandan keyin o‘zgartirib bo‘lmaydi.")) return;
    vazifaSaqlash(true);
  }

  function ochirish(id: string) {
    startTransition(async () => {
      const r = await kodniOchir(id);
      if (!r.ok) return setXabar({ ok: false, matn: r.xato });
      setRoyxat((q) => q.filter((x) => x.id !== id));
      if (joriyId === id) {
        setJoriyId(null);
        setNom("");
      }
    });
  }

  function tabBosilganda(e: React.KeyboardEvent<HTMLTextAreaElement>, qiymat: string, o: (v: string) => void) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      ishgaTushir();
      return;
    }
    if (e.key !== "Tab") return;
    e.preventDefault();
    const t = e.currentTarget;
    const bosh = t.selectionStart;
    const oxir = t.selectionEnd;
    o(qiymat.slice(0, bosh) + "  " + qiymat.slice(oxir));
    requestAnimationFrame(() => {
      t.selectionStart = t.selectionEnd = bosh + 2;
    });
  }

  const faolMatn = varaq === "html" ? html : varaq === "css" ? css : js;
  const faolO = varaq === "html" ? setHtml : varaq === "css" ? setCss : setJs;
  const bandMi = til === "python" && pyHolat !== "bosh";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      {/* Muharrir */}
      <section className="surface-card flex min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3">
          <div role="tablist" aria-label="Dasturlash tili" className="flex rounded-full border border-border-subtle p-0.5">
            {([["web", "Veb (HTML/CSS/JS)"], ["python", "Python"]] as const).map(([k, n]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={til === k}
                onClick={() => til !== k && yangi(k)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors",
                  til === k ? "bg-gold-400 text-ink-950" : "text-fg-muted hover:text-fg",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={ishgaTushir}
            disabled={bandMi}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-gold-400 px-4 text-xs font-black text-ink-950 hover:bg-gold-300 disabled:opacity-50"
          >
            <Play className="size-4" aria-hidden="true" />
            {pyHolat === "yuklanmoqda" ? "Python yuklanmoqda…" : pyHolat === "bajarilmoqda" ? "Bajarilmoqda…" : "Ishga tushirish"}
          </button>
        </div>

        {til === "web" ? (
          <>
            <div role="tablist" aria-label="Fayllar" className="flex gap-1 border-b border-border-subtle px-3 pt-2">
              {(["html", "css", "js"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={varaq === v}
                  onClick={() => setVaraq(v)}
                  className={cn(
                    "rounded-t-xl px-4 py-1.5 font-mono text-xs font-bold uppercase",
                    varaq === v ? "bg-bg/70 text-gold-300" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              aria-label={`${varaq.toUpperCase()} kodi`}
              value={faolMatn}
              onChange={(e) => faolO(e.target.value)}
              onKeyDown={(e) => tabBosilganda(e, faolMatn, faolO)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className={maydon}
            />
            <p className="border-t border-border-subtle px-4 py-2 text-[0.7rem] text-fg-muted">
              HTML va CSS yozganingizda natija o‘zi yangilanadi. JS ni qo‘llash uchun «Ishga tushirish» (Ctrl+Enter) ni bosing.
            </p>
          </>
        ) : (
          <>
            <textarea
              aria-label="Python kodi"
              value={python}
              onChange={(e) => setPython(e.target.value)}
              onKeyDown={(e) => tabBosilganda(e, python, setPython)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className={cn(maydon, "min-h-[20rem]")}
            />
            <p className="border-t border-border-subtle px-4 py-2 text-[0.7rem] text-fg-muted">
              Python brauzeringizda (Pyodide) ishlaydi. Birinchi ishga tushirishda dastur yuklanishi biroz vaqt oladi. input() qo‘llab-quvvatlanmaydi; dastur 15 soniyadan oshsa to‘xtatiladi.
            </p>
          </>
        )}

        {/* Saqlash */}
        {vazifa ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle p-3">
            <button
              type="button"
              onClick={() => vazifaSaqlash(false)}
              disabled={kutilmoqda}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold-400/50 px-4 text-xs font-extrabold text-gold-300 hover:bg-gold-400/10 disabled:opacity-50"
            >
              <Save className="size-4" aria-hidden="true" /> Qoralamani saqlash
            </button>
            <button
              type="button"
              onClick={topshirish}
              disabled={kutilmoqda}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold-400 px-4 text-xs font-black text-ink-950 hover:bg-gold-300 disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden="true" /> Topshirish
            </button>
            {xabar ? (
              <p role="status" className={cn("w-full text-xs font-bold", xabar.ok ? "text-emerald-400" : "text-red-400")}>
                {xabar.matn}
              </p>
            ) : null}
          </div>
        ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle p-3">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value.slice(0, 80))}
            placeholder="Kod nomi"
            aria-label="Kod nomi"
            className="h-9 min-w-0 flex-1 rounded-full border border-border-subtle bg-bg/60 px-4 text-sm outline-none focus:border-gold-400"
          />
          <button
            type="button"
            onClick={() => saqla(false)}
            disabled={kutilmoqda}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold-400/50 px-4 text-xs font-extrabold text-gold-300 hover:bg-gold-400/10 disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden="true" /> {joriyId ? "Yangilash" : "Saqlash"}
          </button>
          {joriyId ? (
            <button
              type="button"
              onClick={() => saqla(true)}
              disabled={kutilmoqda}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-subtle px-3 text-xs font-bold text-fg-muted hover:text-fg disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" /> Nusxa
            </button>
          ) : null}
          {xabar ? (
            <p role="status" className={cn("w-full text-xs font-bold", xabar.ok ? "text-emerald-400" : "text-red-400")}>
              {xabar.matn}
            </p>
          ) : null}
        </div>
        )}
      </section>

      {/* Natija */}
      <section className="flex min-h-0 flex-col gap-5">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
            <span className="font-mono text-xs font-bold text-gold-300">Natija</span>
            <span className="text-[0.7rem] text-fg-muted">{til === "web" ? "Ajratilgan oyna" : "Konsol"}</span>
          </div>
          {til === "web" ? (
            <iframe
              ref={webRef}
              title="Natija ko‘rinishi"
              sandbox="allow-scripts"
              srcDoc={webSrcDoc}
              className="h-80 w-full border-0 bg-white"
            />
          ) : (
            <>
              <iframe
                key={pyKalit}
                ref={pyRef}
                title="Python ishga tushirish muhiti"
                sandbox="allow-scripts"
                srcDoc={pyHujjat()}
                className="hidden"
              />
              <p className="p-4 text-sm text-fg-muted">
                {pyHolat === "bosh" ? "Dastur chiqishi pastdagi konsolda ko‘rinadi." : pyHolat === "yuklanmoqda" ? "Python muhiti yuklanmoqda…" : "Dastur bajarilmoqda…"}
              </p>
            </>
          )}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
            <span className="font-mono text-xs font-bold text-gold-300">Konsol</span>
            <button type="button" onClick={() => setChiqish([])} className="text-[0.7rem] font-bold text-fg-muted hover:text-fg">
              Tozalash
            </button>
          </div>
          <div aria-live="polite" className="max-h-56 min-h-24 overflow-y-auto p-3 font-mono text-xs leading-5">
            {chiqish.length === 0 ? (
              <p className="text-fg-muted">Hozircha chiqish yo‘q.</p>
            ) : (
              chiqish.map((q, i) => (
                <p
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    q.tur === "xato" && "text-red-400",
                    q.tur === "warn" && "text-amber-300",
                  )}
                >
                  {q.matn}
                </p>
              ))
            )}
          </div>
        </div>

        {vazifa ? null : (
          <>
        <div className="surface-card overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-gold-300">
              <FolderOpen className="size-3.5" aria-hidden="true" /> Saqlangan kodlarim ({royxat.length})
            </span>
          </div>
          {royxat.length === 0 ? (
            <p className="p-4 text-sm text-fg-muted">Hali kod saqlanmagan.</p>
          ) : (
            <ul className="max-h-56 divide-y divide-border-subtle overflow-y-auto">
              {royxat.map((k) => (
                <li key={k.id} className="flex items-center gap-2 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => ochish(k)}
                    className={cn("min-w-0 flex-1 text-left", k.id === joriyId && "text-gold-300")}
                  >
                    <span className="block truncate text-sm font-bold">{k.nom}</span>
                    <span className="text-[0.7rem] text-fg-muted">{k.til === "web" ? "Veb" : "Python"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => ochirish(k.id)}
                    disabled={kutilmoqda}
                    aria-label={`${k.nom} kodini o‘chirish`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        )}
      </section>
    </div>
  );
}
