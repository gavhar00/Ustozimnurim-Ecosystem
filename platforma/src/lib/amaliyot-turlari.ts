export type AmaliyotTili = "web" | "python";

export type SaqlanganKod = {
  id: string;
  nom: string;
  til: AmaliyotTili;
  html: string;
  css: string;
  js: string;
  python: string;
  yangilangan: string;
};

export const KOD_MAKS_BELGI = 50000;
export const KOD_MAKS_SONI = 50;

export const BOSHLANGICH_WEB = {
  html: `<main class="karta">
  <h1>Salom, dunyo!</h1>
  <p>Bu sizning birinchi sahifangiz.</p>
  <button id="tugma">Bosing</button>
  <p id="natija"></p>
</main>`,
  css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #0f0f12;
  color: #f5e9c8;
}
.karta {
  padding: 32px;
  border: 1px solid #c9a24b;
  border-radius: 16px;
  text-align: center;
}
button {
  padding: 10px 20px;
  border: 0;
  border-radius: 999px;
  background: #e0b84f;
  font-weight: 700;
  cursor: pointer;
}`,
  js: `let son = 0;
document.getElementById("tugma").addEventListener("click", () => {
  son++;
  document.getElementById("natija").textContent = "Bosildi: " + son;
  console.log("Tugma bosildi", son);
});`,
};

export const BOSHLANGICH_PYTHON = `ism = "Ustozim Nurim"
print("Salom,", ism)

for i in range(1, 6):
    print(i, "x", i, "=", i * i)
`;
