/**
 * Rang kontrasti tekshiruvi.
 *
 * `globals.css` dagi ikkala mavzuning token qiymatlarini o'qiydi va har bir
 * matn/fon juftligini WCAG 2.1 talabiga solishtiradi.
 *
 *   AA, oddiy matn ....... 4.5:1
 *   AA, yirik matn ....... 3.0:1  (>=24px yoki >=19px qalin)
 *   1.4.11, element konturi 3.0:1
 *
 * Nega alohida skript: mavzu qiymatini o'zgartirish bir soniyalik ish, uning
 * kontrastni buzganini esa ko'z bilan sezib bo'lmaydi. Bu tekshiruv
 * `npm run contrast` bilan yuritiladi va CI'da ham ishlashi mumkin.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** `:root { … }` yoki `.dark { … }` ichidagi `--u-*` qiymatlarini yig'adi. */
function mavzuTokenlari(selektor: string): Record<string, string> {
  const qolip = new RegExp(`^${selektor.replace(".", "\\.")} \\{(.*?)^\\}`, "sm");
  const blok = CSS.match(qolip);
  if (!blok) throw new Error(`globals.css da "${selektor}" bloki topilmadi`);

  const tokenlar: Record<string, string> = {};
  for (const [, nom, rang] of blok[1].matchAll(/(--u-[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokenlar[nom] = rang;
  }
  return tokenlar;
}

/** sRGB kanalini chiziqli yorug'likka o'tkazadi. */
function chiziqli(kanal: number): number {
  const k = kanal / 255;
  return k <= 0.04045 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4;
}

function nisbiyYorqinlik(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * chiziqli(r) + 0.7152 * chiziqli(g) + 0.0722 * chiziqli(b);
}

function kontrast(oldi: string, orqa: string): number {
  const a = nisbiyYorqinlik(oldi);
  const b = nisbiyYorqinlik(orqa);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

type Juft = { oldi: string; orqa: string; kam: number; izoh: string };

const JUFTLAR: Juft[] = [
  { oldi: "matn", orqa: "asos", kam: 4.5, izoh: "asosiy matn sahifada" },
  { oldi: "matn", orqa: "yuza", kam: 4.5, izoh: "asosiy matn kartochkada" },
  { oldi: "matn", orqa: "yuza-2", kam: 4.5, izoh: "asosiy matn jadval sarlavhasida" },
  { oldi: "matn-2", orqa: "yuza", kam: 4.5, izoh: "ikkilamchi matn" },
  { oldi: "matn-2", orqa: "yuza-2", kam: 4.5, izoh: "jadval ustun nomi" },
  { oldi: "matn-3", orqa: "yuza", kam: 4.5, izoh: "meta matn (raqam, sana)" },
  { oldi: "matn-3", orqa: "asos", kam: 4.5, izoh: "meta matn sahifada" },

  { oldi: "asosiy", orqa: "yuza", kam: 4.5, izoh: "havola" },
  { oldi: "asosiy-matn", orqa: "asosiy", kam: 4.5, izoh: "to'ldirilgan tugma matni" },

  { oldi: "muvaffaqiyat", orqa: "muvaffaqiyat-yuza", kam: 4.5, izoh: "muvaffaqiyat nishonchasi" },
  { oldi: "ogohlantirish", orqa: "ogohlantirish-yuza", kam: 4.5, izoh: "ogohlantirish nishonchasi" },
  { oldi: "xato", orqa: "xato-yuza", kam: 4.5, izoh: "xato nishonchasi" },
  { oldi: "malumot", orqa: "malumot-yuza", kam: 4.5, izoh: "ma'lumot nishonchasi" },
  { oldi: "jarayon", orqa: "jarayon-yuza", kam: 4.5, izoh: "jarayon nishonchasi" },
  { oldi: "yuza", orqa: "jarayon", kam: 4.5, izoh: "to'ldirilgan jarayon nishonchasi" },
  { oldi: "yuza", orqa: "xato", kam: 4.5, izoh: "xavfli tugma" },

  // Grafik elementlar — WCAG 1.4.11
  { oldi: "chegara-kuchli", orqa: "yuza", kam: 3, izoh: "forma maydoni konturi" },
  { oldi: "chegara-kuchli", orqa: "asos", kam: 3, izoh: "forma maydoni konturi sahifada" },
  { oldi: "asosiy", orqa: "asos", kam: 3, izoh: "fokus halqasi" },
];

const MAVZULAR = [
  { selektor: ":root", nom: "Yorug' mavzu" },
  { selektor: ".dark", nom: "Qorong'i mavzu" },
];

let yiqilgan = 0;
let jami = 0;

for (const mavzu of MAVZULAR) {
  const t = mavzuTokenlari(mavzu.selektor);
  console.log(`\n${mavzu.nom}`);

  for (const j of JUFTLAR) {
    const oldi = t[`--u-${j.oldi}`];
    const orqa = t[`--u-${j.orqa}`];
    if (!oldi || !orqa) {
      console.log(`  ⚠ token yo'q: --u-${j.oldi} / --u-${j.orqa}`);
      yiqilgan += 1;
      continue;
    }

    jami += 1;
    const n = kontrast(oldi, orqa);
    const otdi = n >= j.kam;
    if (!otdi) yiqilgan += 1;

    console.log(
      `  ${otdi ? "✔" : "✘"} ${n.toFixed(2).padStart(5)}:1  ` +
        `(kerak ${j.kam.toFixed(1)})  ${j.izoh}`
    );
  }
}

console.log(`\n${jami - yiqilgan}/${jami} juftlik WCAG AA dan o'tdi.`);

if (yiqilgan > 0) {
  console.error(`\n${yiqilgan} ta juftlik talabga javob bermaydi.`);
  process.exit(1);
}
