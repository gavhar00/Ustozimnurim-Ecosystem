/**
 * Joriy so'rov tili.
 *
 * NEGA AsyncLocalStorage: Worker bir izolyatsiyada bir nechta so'rovga
 * xizmat qiladi va ular `await` nuqtalarida aralashib ketadi. Til oddiy
 * modul o'zgaruvchisida tursa, bir foydalanuvchining tili ikkinchisiga
 * chiqib qolishi mumkin. ALS esa har so'rovga o'z qiymatini beradi.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export const TILLAR = ["uz", "ru", "en"];
export const TIL_NOMI = { uz: "🇺🇿 O'zbekcha", ru: "🇷🇺 Русский", en: "🇬🇧 English" };

const als = new AsyncLocalStorage();

export const tilBilan = (lang, fn) => als.run(TILLAR.includes(lang) ? lang : "uz", fn);
export const joriyTil = () => als.getStore() || "uz";
