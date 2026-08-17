import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// `promisify(scrypt)` parametrli variantni tanimaydi, shuning uchun qo'lda o'raymiz.
function scryptAsync(
  parol: string,
  tuz: Buffer,
  uzunlik: number,
  sozlamalar: ScryptOptions
): Promise<Buffer> {
  return new Promise((bajarildi, xato) => {
    scrypt(parol, tuz, uzunlik, sozlamalar, (e, kalit) =>
      e ? xato(e) : bajarildi(kalit)
    );
  });
}

/**
 * Parol xeshlash — Node.js ichidagi `scrypt` orqali, tashqi kutubxonasiz.
 *
 * Nega bcrypt/argon2 emas: bu davlat tizimi, har bir tashqi bog'liqlik audit
 * qilinishi kerak. `scrypt` Node'ning o'zida, C darajasida amalga oshirilgan va
 * xotiraga bog'liq (memory-hard) — GPU bilan brute-force qilish qimmat.
 *
 * Saqlash formati:  scrypt$N$r$p$<tuz base64>$<kalit base64>
 * Parametrlar xeshning o'zida saqlanadi, shuning uchun kelajakda ularni
 * kuchaytirsak, eski parollar ham ishlashda davom etadi.
 */

const N = 16_384; // CPU/xotira narxi
const R = 8;
const P = 1;
const KALIT_UZUNLIGI = 64;
const MAXMEM = 64 * 1024 * 1024; // 128 * N * R = 16 MB kerak, zaxira bilan

export async function parolXeshla(parol: string): Promise<string> {
  const tuz = randomBytes(16);
  const kalit = (await scryptAsync(parol.normalize("NFKC"), tuz, KALIT_UZUNLIGI, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  }));

  return [
    "scrypt",
    N,
    R,
    P,
    tuz.toString("base64"),
    kalit.toString("base64"),
  ].join("$");
}

export async function parolTekshir(parol: string, xesh: string): Promise<boolean> {
  const qismlar = xesh.split("$");
  if (qismlar.length !== 6 || qismlar[0] !== "scrypt") return false;

  const [, nMatn, rMatn, pMatn, tuzMatn, kalitMatn] = qismlar;
  const n = Number(nMatn);
  const r = Number(rMatn);
  const p = Number(pMatn);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  let saqlangan: Buffer;
  let tuz: Buffer;
  try {
    saqlangan = Buffer.from(kalitMatn, "base64");
    tuz = Buffer.from(tuzMatn, "base64");
  } catch {
    return false;
  }
  if (saqlangan.length === 0 || tuz.length === 0) return false;

  const hisoblangan = (await scryptAsync(
    parol.normalize("NFKC"),
    tuz,
    saqlangan.length,
    { N: n, r, p, maxmem: MAXMEM }
  ));

  // Uzunliklar teng bo'lmasa timingSafeEqual xato beradi — oldindan tekshiramiz
  if (hisoblangan.length !== saqlangan.length) return false;
  return timingSafeEqual(hisoblangan, saqlangan);
}

/**
 * Yangi foydalanuvchi uchun o'qishga qulay boshlang'ich parol yaratadi.
 * Admin akkaunt yaratganda ishlatiladi va rahbarga bir marta ko'rsatiladi.
 * Chalkashtiradigan belgilar (0/O, 1/l/I) ataylab olib tashlangan.
 */
export function boshlangichParolYarat(uzunlik = 10): string {
  const alifbo = "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789";
  const baytlar = randomBytes(uzunlik * 2);
  let natija = "";
  for (let i = 0; natija.length < uzunlik && i < baytlar.length; i++) {
    // Moduldan kelib chiqadigan qiyshiqlikni yo'qotish uchun chegaradan oshgan baytlarni tashlaymiz
    const chegara = Math.floor(256 / alifbo.length) * alifbo.length;
    if (baytlar[i] >= chegara) continue;
    natija += alifbo[baytlar[i] % alifbo.length];
  }
  return natija.length === uzunlik ? natija : boshlangichParolYarat(uzunlik);
}
