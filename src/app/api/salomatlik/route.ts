import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi } from "@/lib/auth";

/**
 * Sozlamalar diagnostikasi: `/api/salomatlik`
 *
 * Ikki darajali javob:
 *
 *   - **Har kim uchun**: faqat `ok` yoki `muammo bor`. Bu monitoring uchun
 *     yetarli va tashqi kuzatuvchiga tizim sozlamalari haqida hech narsa
 *     aytmaydi.
 *   - **Administrator uchun**: to'liq tafsilot — qaysi o'zgaruvchi
 *     yetishmayapti, bazaga ulanish xatosi, jonli commit.
 *
 * Maxfiy qiymatlarning O'ZI hech qachon qaytarilmaydi. Ilgari bu endpoint
 * hammaga to'liq tafsilot berardi — bu ortiqcha oshkoralik edi: hujumchiga
 * tizim qanday sozlanganini va nima buzuq ekanini bepul aytib berardi.
 */
export const dynamic = "force-dynamic";

function protokol(url: string | undefined): string {
  if (!url) return "yo'q";
  const nuqta = url.indexOf("://");
  return nuqta > 0 ? url.slice(0, nuqta + 3) : "noma'lum";
}

export async function GET() {
  const boshlandi = Date.now();

  // "yo'q" (umuman berilmagan) va "bo'sh" (kalit bor, qiymat bo'sh) ni
  // ajratamiz — bu ikkisi butunlay boshqa sozlama xatosi.
  const holati = (v: string | undefined) =>
    v === undefined ? "berilmagan" : v.length === 0 ? "bo'sh" : "to'ldirilgan";

  const sozlamalar = {
    DATABASE_URL: {
      bor: Boolean(process.env.DATABASE_URL),
      holati: holati(process.env.DATABASE_URL),
      uzunligi: (process.env.DATABASE_URL ?? "").length,
      protokol: protokol(process.env.DATABASE_URL),
      togrimi: (process.env.DATABASE_URL ?? "").startsWith("prisma+postgres://"),
    },
    SESSION_SECRET: {
      bor: Boolean(process.env.SESSION_SECRET),
      holati: holati(process.env.SESSION_SECRET),
      uzunligi: (process.env.SESSION_SECRET ?? "").length,
      yetarliUzunmi: (process.env.SESSION_SECRET ?? "").length >= 32,
    },
    // Boshqa o'zgaruvchilar ham ko'rinadimi — muhit umuman yetib kelayaptimi
    boshqalar: {
      SESSION_TTL_HOURS: holati(process.env.SESSION_TTL_HOURS),
      MAX_UPLOAD_BYTES: holati(process.env.MAX_UPLOAD_BYTES),
      VERCEL_ENV: process.env.VERCEL_ENV ?? "berilmagan",
    },
    // Qaysi build jonli ekanini bilish uchun. Sozlama o'zgartirilgandan
    // keyin qayta deploy bo'lgan-bo'lmaganini shundan aniqlash mumkin.
    deploy: {
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "berilmagan").slice(0, 7),
      xabar: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "berilmagan",
    },
    BLOB_READ_WRITE_TOKEN: {
      bor: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      izoh: "Bo'lmasa fayl biriktirish o'chiq bo'ladi, qolgani ishlaydi",
    },
  };

  let baza: { ulandi: boolean; xato?: string; muammolar?: number };
  try {
    baza = { ulandi: true, muammolar: await db.problem.count() };
  } catch (e) {
    // Xato matni foydali, lekin ichida ulanish manzili bo'lishi mumkin —
    // shuning uchun qisqartiramiz va api_key qismini olib tashlaymiz.
    const xato = (e instanceof Error ? e.message : String(e))
      .replace(/api_key=[\w.-]+/gi, "api_key=<yashirilgan>")
      .split("\n")[0]
      .slice(0, 300);
    baza = { ulandi: false, xato };
  }

  const hammasiJoyida =
    sozlamalar.DATABASE_URL.togrimi &&
    sozlamalar.SESSION_SECRET.yetarliUzunmi &&
    baza.ulandi;

  const holat = hammasiJoyida ? "ok" : "muammo bor";
  const javobSarlavhalari = { "Cache-Control": "no-store" };
  const kod = hammasiJoyida ? 200 : 503;

  // Tafsilotni faqat administrator ko'radi
  let admin = false;
  try {
    admin = (await getJoriyFoydalanuvchi())?.role === "ADMIN";
  } catch {
    // Baza yetib bo'lmasa foydalanuvchini aniqlab bo'lmaydi — mehmon deb hisoblaymiz
  }

  if (!admin) {
    return Response.json({ holat }, { status: kod, headers: javobSarlavhalari });
  }

  return Response.json(
    { holat, sozlamalar, baza, msVaqt: Date.now() - boshlandi },
    { status: kod, headers: javobSarlavhalari }
  );
}
