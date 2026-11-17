/**
 * O‘quvchi yozgan kodni ajratilgan (sandbox) iframe ichida ishga tushiradi.
 *
 * Nega kerak: ilgari kod `new Function` orqali sahifaning o‘zida bajarilardi —
 * u holda kod DOM’ga, localStorage’ga va Supabase sessiyasiga yetib bora olardi,
 * cheksiz tsikl esa butun oynani muzlatib qo‘yardi. Bu yerda kod o‘z originida,
 * alohida oqimda ishlaydi va muddatdan oshsa to‘xtatiladi.
 */

export type SandboxNatija = {
  turi: "chiqish" | "xato";
  qatorlar: string[];
};

/** Iframe ichida ishlaydigan kod — sahifadan butunlay ajratilgan. */
const ICHKI_SKRIPT = `
  const CHEK = 500;

  function korinish(q) {
    if (typeof q === "string") return q;
    if (q === undefined) return "undefined";
    if (q === null) return "null";
    if (typeof q === "function") return "[function]";
    if (typeof q === "bigint") return q.toString() + "n";
    try {
      return JSON.stringify(q, (_, v) => (typeof v === "bigint" ? v.toString() + "n" : v));
    } catch {
      return String(q);
    }
  }

  window.addEventListener("message", (hodisa) => {
    const kod = hodisa.data && hodisa.data.kod;
    if (typeof kod !== "string") return;

    const qatorlar = [];
    let toldi = false;

    function yoz(belgi) {
      return function (...argumentlar) {
        if (qatorlar.length >= CHEK) {
          toldi = true;
          return;
        }
        qatorlar.push(belgi + argumentlar.map(korinish).join(" "));
      };
    }

    const soxtaConsole = {
      log: yoz(""),
      info: yoz(""),
      debug: yoz(""),
      warn: yoz("⚠ "),
      error: yoz("✖ "),
      table: yoz(""),
    };

    let xato = null;
    try {
      new Function("console", kod)(soxtaConsole);
    } catch (e) {
      xato = e && e.message ? e.message : String(e);
    }

    if (toldi) {
      qatorlar.push("… chiqish juda uzun, qolgani ko‘rsatilmadi");
    }

    parent.postMessage({ manba: "ustozim-kod", qatorlar, xato }, "*");
  });
`;

/**
 * Kodni ishga tushiradi va natijani qaytaradi.
 * @param kod o‘quvchi yozgan JavaScript
 * @param muddat millisekundda; shu vaqtdan oshsa, bajarilish to‘xtatiladi
 */
export function kodniYurgiz(kod: string, muddat = 3000): Promise<SandboxNatija> {
  return new Promise((bajar) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.display = "none";
    iframe.srcdoc = `<!doctype html><meta charset="utf-8"><script>${ICHKI_SKRIPT}<\/script>`;

    let tugadi = false;

    function tozala() {
      window.removeEventListener("message", qabulQil);
      clearTimeout(soat);
      iframe.remove();
    }

    function yakunla(natija: SandboxNatija) {
      if (tugadi) return;
      tugadi = true;
      tozala();
      bajar(natija);
    }

    function qabulQil(hodisa: MessageEvent) {
      if (hodisa.source !== iframe.contentWindow) return;
      const malumot = hodisa.data;
      if (!malumot || malumot.manba !== "ustozim-kod") return;

      const qatorlar: string[] = Array.isArray(malumot.qatorlar)
        ? malumot.qatorlar.map(String)
        : [];

      if (malumot.xato) {
        yakunla({
          turi: "xato",
          qatorlar: [...qatorlar, String(malumot.xato)],
        });
        return;
      }

      yakunla({
        turi: "chiqish",
        qatorlar: qatorlar.length ? qatorlar : ["(natija bo‘sh)"],
      });
    }

    // Cheksiz tsikl bo‘lsa iframe javob bermaydi — uni o‘chirib yuboramiz.
    const soat = setTimeout(() => {
      yakunla({
        turi: "xato",
        qatorlar: [
          `Kod ${Math.round(muddat / 1000)} soniyadan ortiq ishladi va to‘xtatildi.`,
          "Cheksiz tsikl (while/for) yo‘qligini tekshiring.",
        ],
      });
    }, muddat);

    window.addEventListener("message", qabulQil);

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ kod }, "*");
    };

    document.body.appendChild(iframe);
  });
}
