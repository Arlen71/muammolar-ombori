import "server-only";

import { normalla } from "@/lib/vektor";

/**
 * Muammo matnini vektorga aylantirish (embedding).
 *
 * NEGA KERAK
 *
 * Ilgari o'xshash muammolar `pg_trgm` bilan izlanardi — u so'zlarni uch
 * harfli bo'laklarga bo'lib solishtiradi. Ya'ni umumiy so'z bo'lmasa,
 * hech narsa topilmasdi:
 *
 *   «Xodimlar ta'til so'rovini qog'ozda yozadi»
 *   «Mehnat ta'tili hujjatlari jurnalda yuritiladi»
 *
 * Bu bitta muammo, lekin ularda birgina umumiy so'z yo'q. Vektor esa
 * ma'noni solishtiradi va bunday juftlikni topadi.
 *
 * Bu omborning eng kuchli signali uchun muhim: dasturchi «37 ta
 * tashkilotda shu muammo bor» degan raqamga qarab tanlaydi. Dublikat
 * topilmasa, bitta muammo o'nta alohida yozuv bo'lib tarqalib ketadi va
 * hech biri kuchli ko'rinmaydi.
 *
 * PROVAYDER
 *
 * So'rov OpenAI ning `/v1/embeddings` shakliga yuboriladi. Bu shakl
 * amalda standart bo'lib qolgan: Ollama, vLLM, llama.cpp kabi o'z
 * serveringizda ishlaydigan dasturlar ham aynan shu shaklni beradi.
 * Shuning uchun O'zbekistondagi serverga ko'chganda kod emas, faqat
 * `EMBEDDING_URL` o'zgaradi.
 *
 * SOZLANMAGAN BO'LSA
 *
 * Kalit berilmasa modul jim qoladi va qidiruv eski `pg_trgm` usuliga
 * qaytadi. Tizim ishlashdan to'xtamaydi — bu qo'shimcha imkoniyat,
 * majburiy bog'liqlik emas.
 */

const URL_MANZILI = process.env.EMBEDDING_URL ?? "https://api.openai.com/v1/embeddings";
const KALIT = process.env.EMBEDDING_API_KEY;
const MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

/**
 * Vektor o'lchami.
 *
 * 256 — to'liq 1536 emas. `text-embedding-3-*` oilasi o'lchamni
 * qisqartirishni qo'llab-quvvatlaydi va sifat deyarli tushmaydi, hajm esa
 * olti barobar kichrayadi. Bu bizda muhim: qidiruv paytida barcha
 * vektorlar bazadan HTTP orqali o'qiladi, ya'ni har bir bayt yo'lda
 * vaqt oladi.
 */
const OLCHAM = Number(process.env.EMBEDDING_OLCHAMI ?? 256);

/**
 * Eng kam o'xshashlik (kosinus).
 *
 * DIQQAT: bu qiymat taxminiy va real kartochkalarda sozlanishi kerak.
 * Kosinus balli mutlaq ma'noga ega emas — bir sohada 0.7 «aynan bir xil»
 * bo'lsa, boshqasida «shunchaki yaqin» bo'lishi mumkin. Bazadagi
 * muammolar bo'yicha taqsimotni ko'rish uchun:
 *
 *     npm run embedding -- --kalibrlash
 */
const CHEGARA = Number(process.env.EMBEDDING_CHEGARASI ?? 0.62);

export const embeddingSozlamalari = {
  model: MODEL,
  olcham: OLCHAM,
  chegara: CHEGARA,
} as const;

/** Kalit berilmagan bo'lsa embedding ishlatilmaydi. */
export function embeddingSozlanganmi(): boolean {
  return Boolean(KALIT);
}

/**
 * Matnlarni vektorga aylantiradi.
 *
 * Kirish tartibi chiqish tartibiga teng. Provayder javobni `index` bilan
 * qaytaradi va u tartibsiz kelishi mumkin, shuning uchun ochiq tartiblanadi.
 */
export async function embeddinglarniOl(matnlar: string[]): Promise<Float32Array[]> {
  if (!KALIT) throw new Error("EMBEDDING_API_KEY o'rnatilmagan");
  if (matnlar.length === 0) return [];

  const javob = await fetch(URL_MANZILI, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KALIT}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: matnlar,
      dimensions: OLCHAM,
    }),
  });

  if (!javob.ok) {
    const matn = await javob.text().catch(() => "");
    throw new Error(`Embedding xizmati ${javob.status} qaytardi: ${matn.slice(0, 200)}`);
  }

  const natija = (await javob.json()) as {
    data?: { index: number; embedding: number[] }[];
  };
  const qatorlar = natija.data;
  if (!Array.isArray(qatorlar) || qatorlar.length !== matnlar.length) {
    throw new Error("Embedding xizmati kutilmagan javob qaytardi");
  }

  const tartiblangan = [...qatorlar].sort((a, b) => a.index - b.index);
  return tartiblangan.map((q) => normalla(Float32Array.from(q.embedding)));
}
