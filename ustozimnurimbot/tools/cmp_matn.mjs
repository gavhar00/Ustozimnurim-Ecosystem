import { MATN } from "../src/matn.js";
import { MATN_YANGI } from "../src/matn_yangi.js";
const v = (s) => new Set((String(s||"").match(/\{(\w+)\}/g)||[]));
for (const [k, n] of Object.entries(MATN_YANGI)) {
  const o = MATN[k];
  if (!o) { console.log("YANGI", k); continue; }
  for (const l of ["uz","ru","en"]) {
    const a=[...v(o[l])].sort().join(","), b=[...v(n[l])].sort().join(",");
    if (a!==b) console.log("FARQ", k, l, "eski:", a, "yangi:", b);
  }
}
