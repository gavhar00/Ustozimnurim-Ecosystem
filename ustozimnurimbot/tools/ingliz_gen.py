#!/usr/bin/env python3
"""Ingliz tili savollari (zamonlar / formulalar / qoidalar / tushib qolgan so'zlar).
Yozuv: (kichik_mavzu, savol, TO'G'RI, [3 noto'g'ri], izoh).
Ishga tushirish: python3 tools/ingliz_gen.py -> src/quiz_bank.json (eski 'Ingliz' savollarini almashtiradi).
"""
import json, pathlib

Z, F, Q, G = "zamon", "formula", "qoida", "gap"

D = [
# ───────── ZAMONLAR
(Z, "She ___ to school every day.", "goes", ["go", "going", "gone"],
 "every day — odat. Present Simple: he/she/it dan keyin fe'lga -s/-es qo'shiladi (go → goes)."),
(Z, "Look! The children ___ in the garden now.", "are playing", ["play", "played", "have played"],
 "Look! / now — hozir davom etayotgan ish. Present Continuous: am/is/are + V-ing."),
(Z, "I ___ this film three times.", "have seen", ["saw", "am seeing", "see"],
 "Tajriba, aniq vaqt aytilmagan — Present Perfect: have/has + V3 (seen)."),
(Z, "They ___ football when it started to rain.", "were playing", ["played", "play", "have played"],
 "Boshqa voqea boshlanganda davom etayotgan ish — Past Continuous: was/were + V-ing."),
(Z, "We ___ to Samarkand last summer.", "went", ["go", "have gone", "are going"],
 "last summer — aniq o'tgan vaqt. Past Simple: V2 (go → went)."),
(Z, "By the time he arrived, we ___ dinner.", "had finished", ["finished", "have finished", "finish"],
 "O'tmishdagi ikki voqeadan oldingisi — Past Perfect: had + V3."),
(Z, "I ___ you tomorrow.", "will call", ["called", "have called", "was calling"],
 "tomorrow — kelasi zamon. Future Simple: will + V1."),
(Z, "She ___ here since 2020.", "has lived", ["lives", "lived", "is living"],
 "since + vaqt nuqtasi — Present Perfect: has/have + V3 (lived)."),
(Z, "He ___ TV when I came in.", "was watching", ["watches", "watched", "has watched"],
 "Men kirganda u TV ko'rayotgan edi — Past Continuous: was/were + V-ing."),
(Z, "Water ___ at 100 degrees Celsius.", "boils", ["is boiling", "boiled", "has boiled"],
 "Umumiy ilmiy haqiqat — Present Simple (boil → boils)."),
(Z, "It ___ since morning, so the streets are wet.", "has been raining", ["rains", "rained", "will rain"],
 "since morning — ertalabdan beri davom etgan jarayon. Present Perfect Continuous: have/has been + V-ing."),
(Z, "Tomorrow at 5 p.m. I ___ my homework.", "will be doing", ["will do", "did", "have done"],
 "Kelajakdagi aniq paytda davom etayotgan ish — Future Continuous: will be + V-ing."),
(Z, "By next year, she ___ the university.", "will have graduated", ["graduates", "has graduated", "graduated"],
 "by next year — kelajakdagi muddatgacha tugallangan ish. Future Perfect: will have + V3."),
(Z, "The train ___ at 9:00 tomorrow.", "leaves", ["left", "has left", "was leaving"],
 "Jadval bo'yicha kelajak ish — Present Simple ishlatiladi (poyezd, avtobus, dars jadvali)."),
(Z, "Which sentence is in the Past Simple?", "I ate breakfast.", ["I have eaten breakfast.", "I am eating breakfast.", "I will eat breakfast."],
 "Past Simple: V2 shakli (eat → ate). Boshqalari: Present Perfect, Present Continuous, Future Simple."),
(Z, "Which sentence is in the Present Perfect?", "She has finished.", ["She finished.", "She is finishing.", "She had finished."],
 "Present Perfect: have/has + V3. 'had finished' — Past Perfect."),
(Z, "Which time word goes with the Present Simple?", "usually", ["yesterday", "at the moment", "next week"],
 "usually, always, often, sometimes, never — Present Simple bilan. yesterday — Past, at the moment — Continuous, next week — Future."),
(Z, "The word 'yesterday' is used with which tense?", "Past Simple", ["Present Perfect", "Future Simple", "Present Continuous"],
 "yesterday, last week, ago — aniq o'tgan vaqt → Past Simple."),
(Z, "I ___ my keys. I can't find them.", "have lost", ["lose", "was losing", "will lose"],
 "Natija hozirga ta'sir qilyapti (kalit yo'q) — Present Perfect: have + V3."),
(Z, "When I was a child, I ___ in a village.", "lived", ["live", "have lived", "am living"],
 "When I was a child — tugagan o'tmish davr. Past Simple: lived."),

# ───────── FORMULALAR
(F, "Past Simple inkor gap formulasi qaysi?", "S + did not + V1", ["S + did not + V2", "S + do not + V2", "S + not + V1"],
 "Past Simple inkor: did not (didn't) + fe'lning asosiy shakli. Masalan: I didn't go."),
(F, "Present Perfect formulasi qaysi?", "have/has + V3", ["have/has + V-ing", "had + V3", "will have + V3"],
 "Present Perfect = have/has + V3 (past participle). Masalan: She has done it."),
(F, "Present Continuous formulasi qaysi?", "am/is/are + V-ing", ["do/does + V-ing", "was/were + V-ing", "have + V-ing"],
 "Present Continuous = am/is/are + V-ing. Masalan: They are reading."),
(F, "Past Continuous formulasi qaysi?", "was/were + V-ing", ["am/is/are + V-ing", "had + V-ing", "did + V-ing"],
 "Past Continuous = was/were + V-ing. Masalan: I was sleeping."),
(F, "Past Perfect formulasi qaysi?", "had + V3", ["have + V3", "was + V3", "would + V3"],
 "Past Perfect = had + V3. Masalan: He had left before I came."),
(F, "Future Simple formulasi qaysi?", "will + V1", ["will + V-ing", "will + V3", "would + V1"],
 "Future Simple = will + V1 (to'siz infinitiv). Masalan: I will help."),
(F, "Future Continuous formulasi qaysi?", "will be + V-ing", ["will + V-ing", "will have + V3", "is going + V-ing"],
 "Future Continuous = will be + V-ing. Masalan: I will be working."),
(F, "Future Perfect formulasi qaysi?", "will have + V3", ["will be + V3", "had + V3", "will + V3"],
 "Future Perfect = will have + V3. Masalan: I will have finished."),
(F, "Present Perfect Continuous formulasi qaysi?", "have/has been + V-ing", ["have/has + V-ing", "had been + V-ing", "am/is/are being + V-ing"],
 "Present Perfect Continuous = have/has been + V-ing. Masalan: I have been waiting."),
(F, "First Conditional formulasi qaysi?", "If + Present Simple, will + V1", ["If + Past Simple, would + V1", "If + Past Perfect, would have + V3", "If + will, Present Simple"],
 "First Conditional — real kelajak: If it rains, we will stay home."),
(F, "Second Conditional formulasi qaysi?", "If + Past Simple, would + V1", ["If + Present Simple, will + V1", "If + Past Perfect, would have + V3", "If + would, Past Simple"],
 "Second Conditional — hozirgi xayoliy holat: If I had money, I would buy it."),
(F, "Third Conditional formulasi qaysi?", "If + Past Perfect, would have + V3", ["If + Past Simple, would + V1", "If + Present Simple, will + V1", "If + would have, Past Perfect"],
 "Third Conditional — o'tmishdagi o'zgarmas holat: If I had studied, I would have passed."),
(F, "Passive Voice (Present Simple) formulasi qaysi?", "am/is/are + V3", ["was/were + V3", "have/has + V3", "am/is/are + V-ing"],
 "Majhul nisbat (Present Simple): am/is/are + V3. Masalan: The book is written."),
(F, "Passive Voice (Past Simple) formulasi qaysi?", "was/were + V3", ["am/is/are + V3", "had + V3", "was/were + V-ing"],
 "Majhul nisbat (Past Simple): was/were + V3. Masalan: The letter was sent."),
(F, "Yaqin kelajak 'be going to' formulasi qaysi?", "am/is/are + going to + V1", ["will + going to + V1", "am/is/are + go to + V-ing", "was + going to + V3"],
 "Reja yoki aniq belgi: She is going to study. Formula: am/is/are + going to + V1."),
(F, "Modal fe'ldan (can, must, should) keyin qaysi shakl keladi?", "V1 (to'siz infinitiv)", ["to + V1", "V-ing", "V3"],
 "Modal fe'llardan keyin 'to' siz asosiy shakl keladi: can swim, must go, should study."),

# ───────── QOIDALAR
(Q, "She is ___ honest woman.", "an", ["a", "the", "—"],
 "honest so'zida 'h' o'qilmaydi, u unli tovush bilan boshlanadi — shuning uchun 'an'."),
(Q, "I saw ___ elephant at the zoo.", "an", ["a", "the", "—"],
 "elephant unli tovush bilan boshlanadi — a o'rniga 'an' ishlatiladi."),
(Q, "___ sun rises in the east.", "The", ["A", "An", "—"],
 "Yagona narsa (sun, moon, sky) oldidan 'the' qo'yiladi."),
(Q, "I was born ___ 1998.", "in", ["on", "at", "by"],
 "Yil, oy, fasl oldidan 'in' (in 1998, in May, in summer)."),
(Q, "The meeting is ___ Monday.", "on", ["in", "at", "for"],
 "Hafta kunlari va aniq sana oldidan 'on' (on Monday, on 5 May)."),
(Q, "See you ___ 5 o'clock.", "at", ["in", "on", "to"],
 "Aniq soat oldidan 'at' (at 5 o'clock, at noon, at night)."),
(Q, "This book is ___ than that one.", "more interesting", ["interesting", "most interesting", "interestinger"],
 "3 va undan ko'p bo'g'inli sifatlarda qiyosiy daraja: more + sifat (+ than)."),
(Q, "He is the ___ student in the class.", "best", ["good", "better", "goodest"],
 "good — better — best (qoidasiz shakl). the + orttirma daraja."),
(Q, "One child — two ___.", "children", ["childs", "childrens", "childes"],
 "child → children qoidasiz ko'plik (man → men, foot → feet)."),
(Q, "There ___ three books on the table.", "are", ["is", "am", "be"],
 "There are + ko'plik ot. Bir dona bo'lsa: There is."),
(Q, "There ___ some water in the glass.", "is", ["are", "were", "be"],
 "water sanalmaydigan ot — There is bilan keladi."),
(Q, "How ___ money do you have?", "much", ["many", "few", "lots"],
 "much — sanalmaydigan otlar bilan (money, water, time). many — sanaladiganlar bilan."),
(Q, "How ___ students are in your group?", "many", ["much", "little", "a little"],
 "students sanaladi — How many."),
(Q, "You ___ smoke here. It is forbidden.", "mustn't", ["needn't", "don't have to", "may"],
 "mustn't — taqiq. needn't / don't have to — shart emas (taqiq emas)."),
(Q, "Which sentence is correct?", "He doesn't like tea.", ["He don't like tea.", "He doesn't likes tea.", "He not like tea."],
 "doesn't dan keyin fe'l asosiy shaklda keladi: doesn't like (likes emas)."),
(Q, "I don't have ___ friends here.", "any", ["some", "a", "much"],
 "Inkor gapda 'any' ishlatiladi: I don't have any friends."),
(Q, "Would you like ___ tea?", "some", ["any", "a", "many"],
 "Taklif/iltimos so'roq gaplarida 'some' qo'llanadi: Would you like some tea?"),
(Q, "This is ___ book. (I)", "my", ["me", "mine", "I"],
 "Ot oldidan egalik sifati: my book. 'mine' — otsiz keladi."),
(Q, "This pen is ___. (I)", "mine", ["my", "me", "I"],
 "Ot yo'q — mutlaq egalik olmoshi: mine, yours, his, hers, ours, theirs."),
(Q, "I enjoy ___ books.", "reading", ["read", "to read", "reads"],
 "enjoy dan keyin gerund (V-ing): enjoy reading. Shunday: like, love, finish, mind."),
(Q, "I want ___ English.", "to learn", ["learn", "learning", "learned"],
 "want dan keyin to + V1: want to learn. Shunday: need, hope, decide."),

# ───────── TUSHIB QOLGAN SO'ZLAR
(G, "He is interested ___ music.", "in", ["on", "at", "of"],
 "be interested IN — predlogli iboralardan biri."),
(G, "I'm afraid ___ dogs.", "of", ["from", "at", "with"],
 "be afraid OF — qo'rqmoq."),
(G, "She is good ___ math.", "at", ["in", "on", "for"],
 "be good AT — biror narsada kuchli bo'lmoq."),
(G, "He is married ___ my sister.", "to", ["with", "by", "for"],
 "be married TO — kimgadir uylanmoq/turmushga chiqmoq."),
(G, "Thank you ___ your help.", "for", ["to", "of", "with"],
 "thank (someone) FOR — nima uchun rahmat aytilsa."),
(G, "I look forward ___ seeing you.", "to", ["for", "at", "on"],
 "look forward TO + V-ing — intiqib kutmoq."),
(G, "We arrived ___ Tashkent yesterday.", "in", ["at", "to", "on"],
 "arrive IN + shahar/mamlakat; arrive AT + kichik joy (at the station)."),
(G, "She is ___ doctor. She works in a hospital.", "a", ["an", "the", "—"],
 "doctor undosh bilan boshlanadi — 'a'. Kasb oldidan a/an qo'yiladi."),
(G, "___ I open the window?", "May", ["Do", "Are", "Does"],
 "Ruxsat so'rash: May I / Can I + V1."),
(G, "I will call you ___ I arrive.", "when", ["but", "or", "so"],
 "Vaqt bog'lovchisi: when. Kelasi zamon ma'nosida ham when dan keyin Present Simple (arrive) keladi."),
(G, "He studied hard, ___ he passed the exam.", "so", ["but", "because", "although"],
 "so — natija (shuning uchun). because — sabab, but — qarama-qarshilik."),
(G, "She was late ___ she missed the bus.", "because", ["so", "but", "although"],
 "because — sabab: kechikdi, chunki avtobusga ulgurmadi."),
(G, "___ it was raining, we went out.", "Although", ["Because", "So", "If"],
 "Although — garchi...: yomg'ir yog'ayotgan bo'lsa-da, biz chiqdik."),
(G, "If you ___ hard, you will pass.", "study", ["studied", "will study", "studying"],
 "First Conditional: if dan keyin Present Simple, will faqat asosiy qismda."),
(G, "Neither Ali ___ Vali came.", "nor", ["or", "and", "but"],
 "neither ... nor — na ... na. Juftlik: neither-nor, either-or, both-and."),
(G, "Either you ___ I must go.", "or", ["nor", "and", "but"],
 "either ... or — yo ... yoki."),
(G, "She has lived here ___ five years.", "for", ["since", "ago", "from"],
 "for + muddat (five years); since + boshlanish nuqtasi (2015)."),
(G, "He has lived here ___ 2015.", "since", ["for", "during", "ago"],
 "since + boshlanish nuqtasi (yil, sana)."),
(G, "I have ___ finished my homework.", "already", ["yet", "ago", "since"],
 "already — allaqachon (darak gap); yet — so'roq va inkorda."),
(G, "Have you finished your homework ___?", "yet", ["already", "ago", "since"],
 "yet — so'roq va inkor gapda oxirida: Have you ... yet?"),
(G, "He left two days ___.", "ago", ["before", "since", "for"],
 "ago — muddatdan keyin turadi va Past Simple bilan ishlatiladi."),
(G, "What ___ you doing now?", "are", ["is", "do", "does"],
 "Present Continuous so'roq: What + are + you + V-ing?"),
(G, "___ do you live? — In Bukhara.", "Where", ["When", "Who", "Why"],
 "Where — qayerda (joy), When — qachon, Who — kim, Why — nega."),
(G, "Give the book to ___. (she)", "her", ["she", "hers", "herself"],
 "Predlogdan keyin to'ldiruvchi olmosh: to her (she emas)."),
(G, "I cut ___ yesterday.", "myself", ["me", "my", "mine"],
 "Harakat egasiga qaytsa — qaytim olmosh: myself, yourself, himself, herself."),
(G, "The book ___ I bought is interesting.", "which", ["who", "where", "when"],
 "which — narsalar uchun nisbiy olmosh; who — odamlar uchun."),
(G, "The man ___ lives next door is a teacher.", "who", ["which", "where", "what"],
 "who — odamlar uchun nisbiy olmosh."),
]


def tekshir():
    qs = set()
    for s, q, ok, yomon, e in D:
        assert s in (Z, F, Q, G), s
        assert len(yomon) == 3, q
        op = [ok] + yomon
        assert len(set(op)) == 4, ("takror variant", q)
        assert q not in qs, ("takror savol", q)
        qs.add(q)
        assert len(q) <= 280 and all(len(o) <= 90 for o in op), q
        assert len(e) >= 15, q
    return len(D)


def main():
    n = tekshir()
    p = pathlib.Path(__file__).resolve().parent.parent / "src" / "quiz_bank.json"
    bank = json.loads(p.read_text(encoding="utf-8"))
    bank = [x for x in bank if x.get("t") != "Ingliz"]
    for s, q, ok, yomon, e in D:
        bank.append({"q": q, "o": [ok] + yomon, "c": 0, "t": "Ingliz", "s": s, "e": e})
    p.write_text(json.dumps(bank, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("Ingliz savollari:", n, "| bank jami:", len(bank))


if __name__ == "__main__":
    main()
