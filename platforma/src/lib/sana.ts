const OYLAR = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** «23-noyabr, 2026, 17:30» — Toshkent vaqti bilan. */
export function tadbirSanasi(iso: string): string {
  const qismlar = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const q = (t: string) => qismlar.find((p) => p.type === t)?.value ?? "";
  return `${q("day")}-${OYLAR[Number(q("month")) - 1]}, ${q("year")}, ${q("hour")}:${q("minute")}`;
}

/** datetime-local qiymatini (Toshkent vaqti) ISO ga aylantiradi. */
export function toshkentdanISO(mahalliy: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(mahalliy)) return null;
  const d = new Date(`${mahalliy}:00+05:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Tadbir boshlanish vaqti o‘tib bo‘lganmi. */
export function otganmi(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}
