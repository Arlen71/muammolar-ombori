import { createHash } from "node:crypto";

/**
 * Vektor matematikasi va matn tayyorlash.
 *
 * NEGA `embedding.ts` DAN AJRATILGAN
 *
 * `embedding.ts` API kalitini o'qiydi, shuning uchun unda `server-only`
 * turibdi — u kalitni brauzer to'plamiga tushib ketishidan saqlaydi.
 * Lekin o'sha qo'riqchi modulni test qiluvchidan ham to'sadi.
 *
 * Bu yerdagi kod esa sof: tarmoq ham, muhit o'zgaruvchisi ham, baza ham
 * yo'q. Shu tufayli u testlanadi — `scoring.ts` bilan bir xil sabab.
 *
 * Vektor matematikasi jimgina buziladigan turdagi kod: xato bo'lsa dastur
 * yiqilmaydi, shunchaki qidiruv noto'g'ri javob beradi.
 */

/**
 * Vektorni birlik uzunlikka keltiradi.
 *
 * Shundan keyin kosinus o'xshashlik oddiy skalyar ko'paytmaga aylanadi —
 * har bir solishtirishda uzunlikni qayta hisoblash kerak bo'lmaydi.
 * Provayder normallashtirilgan vektor qaytarsa ham buni ochiq qilamiz:
 * boshqa provayderga o'tilganda hisob-kitob jimgina buzilmasin.
 */
export function normalla(v: Float32Array): Float32Array {
  let yigindi = 0;
  for (const q of v) yigindi += q * q;
  const uzunlik = Math.sqrt(yigindi);
  if (uzunlik === 0) return v;
  for (let i = 0; i < v.length; i++) v[i] /= uzunlik;
  return v;
}

/**
 * Normallashtirilgan ikki vektorning kosinus o'xshashligi.
 *
 * O'lcham har xil bo'lsa 0 qaytariladi: bu model almashgan, lekin eski
 * vektorlar hali qayta hisoblanmagan degani. Xato tashlash noto'g'ri
 * bo'lardi — qidiruv butun sahifani yiqitishi kerak emas.
 */
export function kosinus(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let yigindi = 0;
  for (let i = 0; i < a.length; i++) yigindi += a[i] * b[i];
  return yigindi;
}

/*
  Bazada vektor `Bytes` sifatida saqlanadi, `Float[]` emas.

  Sabab — transport. Prisma bazaga HTTP orqali ulanadi va `Float[]` JSON
  matniga aylanadi: har bir son o'nlab belgi bo'lib yoziladi. 256 o'lchamli
  vektor JSON'da ~5 KB, baytlarda esa 1 KB. Qidiruvda barcha vektorlar
  o'qilgani uchun bu farq mingta muammoda 4 MB ni tashkil qiladi.
*/

export function baytga(v: Float32Array): Uint8Array<ArrayBuffer> {
  const chiqish = new Uint8Array(v.byteLength);
  chiqish.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
  return chiqish;
}

export function baytdan(b: Uint8Array): Float32Array {
  // `slice()` — baytlar 4 ga bo'linadigan manzildan boshlanishini kafolatlaydi
  const nusxa = b.slice();
  return new Float32Array(nusxa.buffer, nusxa.byteOffset, nusxa.byteLength / 4);
}

/**
 * Vektorga aylantiriladigan matn.
 *
 * Sarlavha va tavsif — muammoning o'zi; hozirgi jarayon esa uni boshqa
 * muammodan ajratadigan eng aniq qism («qo'lda yoziladi», «Excelda
 * yuritiladi»). Qolgan maydonlar raqam va tanlov bo'lgani uchun ma'no
 * qo'shmaydi.
 *
 * QOIDA: bu funksiya saqlashda ham, qidirishda ham BIR XIL ishlatiladi.
 * Aks holda so'rov vektori saqlangan vektorlardan boshqa joyda turadi va
 * solishtirish ma'nosini yo'qotadi.
 *
 * Sarlavha doim birinchi qatorda: trigramga tushib qolinganda
 * `oxshashMuammolar` faqat o'sha qatorni ishlatadi.
 */
export function muammoMatni(m: {
  title: string;
  description?: string | null;
  currentProcess?: string | null;
}): string {
  return [m.title, m.description, m.currentProcess]
    .filter((q): q is string => Boolean(q && q.trim()))
    .join("\n\n")
    .slice(0, 4000); // model chegarasidan ancha past, lekin kartochka uchun yetarli
}

/** Matn o'zgarganini bilish uchun qisqa belgi. */
export function matnBelgisi(matn: string): string {
  return createHash("sha256").update(matn).digest("hex").slice(0, 16);
}
