#!/usr/bin/env python3
"""IT mavzulari bo'yicha savollar: Figma, Python, JS, HTML, CSS, React (har biri 10 ta).
Kunlik viktorinada IT o'rinlari shu mavzular bo'yicha aylanib turadi (src/config.js).
Ishlatish: python3 tools/it_gen.py -> src/quiz_bank.json (eski 'itgen' belgili savollarni almashtiradi).
Yozuv: (savol, to'g'ri, [3 ta noto'g'ri], izoh)
"""
import json, pathlib

M = {
"figma": [
("Figma asosan nima uchun ishlatiladi?", "Interfeys (UI/UX) dizayni va prototiplash", ["Video montaj", "Ma'lumotlar bazasini boshqarish", "Kodni kompilyatsiya qilish"], "Figma — brauzerda ishlaydigan interfeys dizayni va prototiplash vositasi."),
("Figmada qayta ishlatiladigan dizayn elementi (tugma, kartochka) nima deb ataladi?", "Component", ["Layer", "Frame", "Plugin"], "Component asosiy nusxa (main) bo'ladi; undan olingan nusxalar o'zgarishlarni avtomatik oladi."),
("Figmada elementlarni avtomatik joylashtirib, oraliqlarini boshqaruvchi funksiya?", "Auto Layout", ["Auto Save", "Smart Align", "Mask"], "Auto Layout CSS Flexbox g'oyasiga o'xshaydi: elementlar tartib va oraliq bilan o'zi joylashadi."),
("Figmada rang va shriftlarni markaziy joyda saqlab, hamma joyda qo'llash uchun nima ishlatiladi?", "Styles va Variables", ["Pages", "Comments", "Prototype"], "Styles/Variables bir marta o'zgartirilsa, ishlatilgan hamma joyda yangilanadi."),
("Figmada ekran (artboard) vazifasini bajaradigan asosiy konteyner?", "Frame", ["Slice", "Pen", "Group"], "Frame — ekran o'lchami, maket va Auto Layout beriladigan konteyner."),
("Figmada ekranlar orasidagi o'tishni ko'rsatuvchi interaktiv demo qaysi bo'limda yaratiladi?", "Prototype", ["Dev Mode", "Assets", "Comments"], "Prototype bo'limida ekranlar bog'lanadi va oqim (flow) sinab ko'riladi."),
("Figmaning Dev Mode rejimi kimga eng foydali?", "Dizaynni kodga o'tkazuvchi dasturchilarga", ["Printer operatorlariga", "Ma'lumotlar bazasi adminlariga", "Video muharrirlarga"], "Dev Mode o'lcham, rang va CSS kod parchalarini dasturchi uchun qulay ko'rsatadi."),
("Figmaning asosiy ustunliklaridan biri?", "Brauzerda real vaqtda hamkorlikda ishlash", ["Faqat oflayn ishlaydi", "Faqat Windowsda ishlaydi", "Faqat kod yozadi"], "Bir faylda bir nechta kishi bir vaqtda ishlay oladi (Google Docs singari)."),
("Figmada vektor shakllarni nuqtalar bilan chizish uchun qaysi asbob?", "Pen tool", ["Hand tool", "Comment tool", "Scale tool"], "Pen tool nuqtalar (anchor) qo'yib, egri va to'g'ri chiziqli vektor yo'l chizadi."),
("Figmada Variants nima?", "Bitta komponentning turli holatlari (masalan, hover, disabled)", ["Fayl versiyalari tarixi", "Shriftlar to'plami", "Foydalanuvchi huquqlari"], "Variants bir komponent ichida holat va o'lcham variantlarini tartibli saqlaydi."),
],
"python": [
("Python'da ro'yxat (list) qaysi qavs bilan yoziladi?", "[ ]", ["{ }", "( )", "< >"], "list — kvadrat qavs: [1, 2, 3]. () — tuple, {} — dict yoki set."),
("len(\"salom\") natijasi?", "5", ["4", "6", "xato beradi"], "len() satrdagi belgilar sonini qaytaradi: s-a-l-o-m = 5."),
("Python'da izoh qaysi belgi bilan boshlanadi?", "#", ["//", "--", "/*"], "Bir qatorli izoh # bilan boshlanadi."),
("Python'da 3 ** 2 nimaga teng?", "9", ["6", "5", "32"], "** — darajaga ko'tarish: 3² = 9."),
("Qaysi tur o'zgartirib bo'lmaydigan (immutable)?", "tuple", ["list", "dict", "set"], "tuple yaratilgach elementlari o'zgarmaydi; list, dict, set o'zgaradi."),
("range(3) qaysi sonlarni beradi?", "0, 1, 2", ["1, 2, 3", "0, 1, 2, 3", "1, 2"], "range(n) 0 dan n-1 gacha sonlarni beradi."),
("Python'da funksiya qaysi kalit so'z bilan e'lon qilinadi?", "def", ["function", "func", "fn"], "def nom(parametrlar): — funksiya e'loni."),
("Python'da 10 // 3 natijasi?", "3", ["3.33", "4", "1"], "// — butun bo'lish (qoldiqsiz): 10 // 3 = 3."),
("Lug'at d = {'a': 1} da d['b'] ga murojaat qilinsa nima bo'ladi?", "KeyError xatosi", ["None qaytadi", "0 qaytadi", "Bo'sh satr qaytadi"], "Mavjud bo'lmagan kalit KeyError beradi; d.get('b') esa None qaytaradi."),
("Python'da 'a' * 3 natijasi?", "'aaa'", ["'a3'", "xato beradi", "3"], "Satrni songa ko'paytirish uni takrorlaydi."),
],
"js": [
("JavaScriptda let va const orasidagi asosiy farq?", "const qayta tayinlanmaydi, let tayinlanadi", ["let faqat sonlar uchun", "const faqat funksiya ichida ishlaydi", "Hech qanday farqi yo'q"], "const bilan e'lon qilingan o'zgaruvchiga yangi qiymat berib bo'lmaydi."),
("JavaScriptda === operatori nimani tekshiradi?", "Qiymat va turni (qat'iy tenglik)", ["Faqat qiymatni", "Faqat turni", "Xotira manzilini"], "=== tur o'zgartirmaydi: 5 === '5' false, 5 == '5' esa true."),
("Massiv oxiriga element qo'shuvchi metod?", "push()", ["pop()", "shift()", "slice()"], "push oxiriga qo'shadi, pop oxirgisini oladi, shift birinchisini oladi."),
("parseInt('42px') natijasi?", "42", ["NaN", "'42px'", "0"], "parseInt raqamlardan boshlangan qismni o'qiydi va 42 ni qaytaradi."),
("Brauzerda elementni id orqali olish?", "document.getElementById()", ["document.find()", "window.getId()", "dom.get()"], "document.getElementById('id') element obyektini qaytaradi."),
("Arrow funksiya sintaksisi qaysi?", "(a, b) => a + b", ["function => (a, b)", "a, b -> a + b", "=> (a, b)"], "Arrow funksiya: (parametrlar) => ifoda."),
("Array.isArray([]) natijasi?", "true", ["false", "'array'", "undefined"], "Array.isArray massiv ekanini tekshiradi; [] massiv, shuning uchun true."),
("Promise nima uchun ishlatiladi?", "Asinxron amallar natijasini boshqarish", ["CSS animatsiya yaratish", "Ma'lumotlarni shifrlash", "Fayllarga nom berish"], "Promise kelajakda tugaydigan amalning natijasini (muvaffaqiyat/xato) ifodalaydi."),
("typeof undefined natijasi?", "'undefined'", ["'object'", "'null'", "'number'"], "undefined — alohida tur; typeof uni 'undefined' deb qaytaradi."),
("JSON.stringify() nima qiladi?", "Obyektni JSON satriga aylantiradi", ["JSON satrini obyektga aylantiradi", "Faylni o'chiradi", "Massivni saralaydi"], "stringify — obyekt → satr, JSON.parse — satr → obyekt."),
],
"html": [
("Sahifadagi eng katta (asosiy) sarlavha tegi?", "<h1>", ["<head>", "<title1>", "<big>"], "<h1> — eng yuqori darajali sarlavha, odatda sahifada bitta bo'ladi."),
("Havola yaratadigan teg?", "<a>", ["<link>", "<url>", "<href>"], "<a href=\"...\"> havola yaratadi."),
("Rasm qo'yish uchun teg?", "<img>", ["<image>", "<pic>", "<src>"], "<img src=\"...\" alt=\"...\"> — yopuvchi tegsiz."),
("Rasm manzili qaysi atributda ko'rsatiladi?", "src", ["href", "alt", "title"], "src — manba; href havolalar uchun."),
("<ul> tegi nimani yaratadi?", "Tartibsiz (markerli) ro'yxat", ["Tartiblangan ro'yxat", "Jadval", "Shakl (form)"], "<ul> — markerli, <ol> — raqamlangan ro'yxat; elementlari <li>."),
("Ma'lumot kiritish maydonini yaratuvchi teg?", "<input>", ["<text>", "<field>", "<enter>"], "<input type=\"text\"> va boshqa turlari kiritish maydonlarini yaratadi."),
("Navigatsiya havolalari blokini bildiruvchi semantik teg?", "<nav>", ["<links>", "<top>", "<menu1>"], "<nav> asosiy navigatsiyani belgilaydi (qulaylik va SEO uchun)."),
("HTML hujjat turini bildiruvchi birinchi qator?", "<!DOCTYPE html>", ["<html5>", "<?html?>", "<start>"], "<!DOCTYPE html> brauzerga hujjat HTML5 ekanini aytadi."),
("Rasm yuklanmasa o'rniga ko'rsatiladigan matn qaysi atributda?", "alt", ["title", "src", "name"], "alt — muqobil matn; ko'zi ojizlar uchun ekran o'qigichlar ham uni o'qiydi."),
("Yangi qatorga o'tish tegi?", "<br>", ["<nl>", "<lb>", "<break>"], "<br> matnda qator uzadi, yopuvchi tegi yo'q."),
],
"css": [
("Elementning ichki bo'shlig'i (kontent va chegara orasi) qaysi xossa?", "padding", ["margin", "border", "gap"], "padding — chegara ichidagi bo'shliq, margin — tashqarisidagi."),
("Elementning tashqi bo'shlig'i qaysi xossa?", "margin", ["padding", "outline", "inset"], "margin elementni qo'shnilaridan uzoqlashtiradi."),
("display: flex nimaga xizmat qiladi?", "Elementlarni moslashuvchan qator/ustunda joylashtirish", ["Elementni yashirish", "Matnni qalin qilish", "Rasm yuklash"], "Flexbox bir o'lchamli joylashuv: tekislash, oraliq va yo'nalishni boshqaradi."),
("Fon rangini o'zgartiruvchi xossa?", "background-color", ["color", "bg", "fill-color"], "color — matn rangi, background-color — fon rangi."),
("CSS'da class selektori qaysi belgi bilan boshlanadi?", ".", ["#", "*", "&"], ".nom — class, #nom — id."),
("CSS'da id selektori qaysi belgi bilan boshlanadi?", "#", [".", "@", ":"], "#nom id bo'yicha tanlaydi; id sahifada noyob bo'lishi kerak."),
("Matn rangini beruvchi xossa?", "color", ["text-color", "font-color", "foreground"], "color: red; — matn (va border default) rangi."),
("position: absolute element joyini nimaga nisbatan hisoblaydi?", "Eng yaqin positioned (static bo'lmagan) ajdodiga", ["Doim sahifaning chap tepasiga", "Ekran markaziga", "Oldingi elementga"], "Positioned ajdod bo'lmasa, hujjat (viewport) boshlang'ich konteyneriga nisbatan."),
("Burchaklarni yumaloqlash xossasi?", "border-radius", ["corner", "round", "border-curve"], "border-radius: 50% — doira shakl beradi."),
("Sichqoncha elementga olib kelinganda uslub beruvchi pseudo-class?", ":hover", [":active", ":focus", ":visited"], ":hover — kursor ustida; :active — bosilganda; :focus — fokusda."),
],
"react": [
("React nima?", "Interfeys yaratish uchun JavaScript kutubxonasi", ["Ma'lumotlar bazasi", "Operatsion tizim", "CSS preprosessori"], "React komponentlar asosida foydalanuvchi interfeysini quradigan kutubxona."),
("Komponent holatini (state) saqlash uchun asosiy hook?", "useState", ["useStyle", "useData", "useProps"], "const [qiymat, setQiymat] = useState(boshlang'ich)."),
("API so'rovi kabi yon ta'sirlar uchun hook?", "useEffect", ["useState", "useMemo", "useId"], "useEffect render'dan keyin yon ta'sirni bajaradi."),
("JSX nima?", "JavaScript ichida HTML'ga o'xshash sintaksis", ["Yangi dasturlash tili", "CSS formati", "Ma'lumotlar bazasi so'rovi"], "JSX — React elementlarini yozishning qulay sintaksisi (kompilyatsiyadan keyin oddiy JS)."),
("Komponentga ma'lumot uzatish mexanizmi?", "props", ["reducers", "cookies", "selectors"], "Ota komponent bolasiga props orqali ma'lumot beradi."),
("Ro'yxatni render qilganda har elementga nima berish kerak?", "Noyob key", ["Noyob class", "Noyob server id", "type atributi"], "key React'ga qaysi element o'zgarganini aniqlashga yordam beradi."),
("useEffect(() => {...}, []) dagi bo'sh massiv nimani anglatadi?", "Faqat birinchi renderdan keyin bir marta ishlaydi", ["Har renderda ishlaydi", "Hech qachon ishlamaydi", "Faqat o'chirilganda ishlaydi"], "Bog'liqliklar bo'sh bo'lsa, effekt faqat mount'da bajariladi."),
("State'ni to'g'ridan-to'g'ri o'zgartirish (count++) nega noto'g'ri?", "React qayta render qilmaydi — setState funksiyasi kerak", ["Brauzer buni taqiqlaydi", "Xotira to'ladi", "Faqat TypeScript'da xato"], "State faqat set-funksiya orqali o'zgartirilsa, React interfeysni yangilaydi."),
("React komponent nomi qanday boshlanishi kerak?", "Bosh harf bilan", ["Kichik harf bilan", "Pastki chiziq bilan", "Raqam bilan"], "<Button /> — komponent; <button /> — oddiy HTML teg."),
("Virtual DOM nima uchun kerak?", "O'zgargan qismlarni samarali yangilash uchun", ["Brauzerni yashirish uchun", "Serverni tezlashtirish uchun", "Fayllarni siqish uchun"], "React eski va yangi virtual daraxtni solishtirib, haqiqiy DOM'da faqat farqni yangilaydi."),
],
}

# Qiyin (h:true) IT savollarini ham mavzuga bog'laymiz
HARD_S = {"DASTURLASH tillari": "js", "PRIMITIV": "js", "HTTP": "js", "Git": "js", "MA'LUMOTLAR BAZASI": "python",
          "HOOK": "react", "CSS xossalari": "css", "HTML teglari": "html", "Python": "python", "JavaScript": "js"}

def tekshir():
    for s, lst in M.items():
        for q, ok, yomon, e in lst:
            op = [ok] + yomon
            assert len(yomon) == 3 and len(set(op)) == 4, q
            assert len(q) <= 250 and all(len(o) <= 90 for o in op), q
            assert 15 <= len(e) <= 200, (q, len(e))

def main():
    tekshir()
    p = pathlib.Path(__file__).resolve().parent.parent / "src" / "quiz_bank.json"
    bank = json.loads(p.read_text(encoding="utf-8"))
    bank = [x for x in bank if x.get("src") != "itgen"]
    for s, lst in M.items():
        for q, ok, yomon, e in lst:
            bank.append({"q": q, "o": [ok] + yomon, "c": 0, "t": "IT", "s": s, "e": e, "src": "itgen"})
    for q in bank:
        if q.get("h") and q["t"] == "IT" and not q.get("s"):
            q["s"] = next((v for k, v in HARD_S.items() if k.lower() in q["q"].lower() or any(k.lower() in str(x).lower() for x in q["o"])), "js")
            if q.get("img", "").startswith("k7"):
                q["s"] = "python"
    p.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("IT mavzu savollari:", sum(len(v) for v in M.values()), "| bank:", len(bank))

if __name__ == "__main__":
    main()
