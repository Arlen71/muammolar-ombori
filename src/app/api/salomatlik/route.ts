import { db } from "@/lib/db";

/**
 * Sozlamalar diagnostikasi: `/api/salomatlik`
 *
 * Deploydan keyin nima ishlamayotganini tez aniqlash uchun. Maxfiy
 * qiymatlarni QAYTARMAYDI — faqat o'zgaruvchi bor-yo'qligi, protokoli va
 * bazaga ulanish natijasi. Parol, api_key va sessiya kaliti hech qachon
 * javobda ko'rinmaydi.
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

  const hammasiJoyida = sozlamalar.DATABASE_URL.togrimi &&
    sozlamalar.SESSION_SECRET.yetarliUzunmi &&
    baza.ulandi;

  return Response.json(
    { holat: hammasiJoyida ? "ok" : "muammo bor", sozlamalar, baza, msVaqt: Date.now() - boshlandi },
    { status: hammasiJoyida ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
