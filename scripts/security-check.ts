/**
 * Xavfsizlik tekshiruvi — jonli manzilga qarshi haqiqiy hujum stsenariylari.
 *
 * Ishga tushirish:
 *   npm run security                          # lokal dev serverga qarshi
 *   E2E_URL=https://... SESSION_SECRET=... npm run security
 *
 * Skript o'zi vaqtinchalik sinov ma'lumotini yaratadi (qoralama muammo va
 * unga biriktirma) va oxirida albatta o'chiradi.
 *
 * Nima tekshiriladi:
 *   1. Biriktirilgan fayllar sizib chiqmasligi — asosiy talab
 *   2. Sessiya qalbakilashtirishga chidamliligi
 *   3. Rollar orasidagi chegaralar
 *   4. Inyeksiya va XSS
 *   5. Javob sarlavhalari
 */
import { readFileSync } from "node:fs";

import "dotenv/config";

import { db } from "@/lib/db";

// Blob tokeni odatda `.env.local` da bo'ladi (`vercel link` qo'yadi).
// Bo'lmasa sarlavha tekshiruvlari o'tkazib yuboriladi — jimgina emas, aytiladi.
try {
  for (const q of readFileSync(".env.local", "utf8").split("\n")) {
    const m = q.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // .env.local yo'q — muammo emas
}
import { SESSIYA_COOKIE, sessiyaTokeniYarat } from "@/lib/session";

const ASOS = process.env.E2E_URL ?? "http://localhost:3000";

let otdi = 0;
let yiqildi = 0;
const jiddiy: string[] = [];

function tekshir(nom: string, shart: boolean, izoh = "", ogirlik: "jiddiy" | "oddiy" = "oddiy") {
  if (shart) {
    otdi++;
    console.log(`  ✔ ${nom}`);
  } else {
    yiqildi++;
    console.log(`  ✘ ${nom}${izoh ? ` — ${izoh}` : ""}`);
    if (ogirlik === "jiddiy") jiddiy.push(nom);
  }
}

type Javob = { status: number; manzil: string | null; matn: string };

async function ol(yol: string, cookie?: string): Promise<Javob> {
  const j = await fetch(`${ASOS}${yol}`, {
    redirect: "manual",
    headers: cookie ? { cookie: `${SESSIYA_COOKIE}=${cookie}` } : {},
  });
  return {
    status: j.status,
    manzil: j.headers.get("location"),
    matn: j.status < 300 ? await j.text() : "",
  };
}

async function sarlavhalar(yol: string, cookie?: string) {
  const j = await fetch(`${ASOS}${yol}`, {
    redirect: "manual",
    headers: cookie ? { cookie: `${SESSIYA_COOKIE}=${cookie}` } : {},
  });
  await j.body?.cancel();
  return { status: j.status, h: j.headers };
}

function kirishgaYonaltiradi(j: Javob): boolean {
  if (![302, 303, 307].includes(j.status)) return false;
  return new URL(j.manzil ?? "/", ASOS).pathname === "/kirish";
}

async function main() {
  console.log(`Xavfsizlik tekshiruvi: ${ASOS}\n`);

  // ── Ma'lumot yig'ish ──
  const [admin, rahbar, dasturchi, kutayotgan] = await Promise.all([
    db.user.findFirstOrThrow({ where: { role: "ADMIN" } }),
    db.user.findFirstOrThrow({ where: { role: "LEADER" } }),
    db.user.findFirstOrThrow({ where: { role: "DEVELOPER", status: "ACTIVE" } }),
    db.user.findFirstOrThrow({ where: { role: "DEVELOPER", status: "PENDING" } }),
  ]);

  const begonaRahbar = await db.user.findFirst({
    where: { role: "LEADER", organizationId: { not: rahbar.organizationId } },
  });

  const ochiqBiriktirma = await db.problemAttachment.findFirstOrThrow({
    where: { problem: { status: "APPROVED" } },
    include: { problem: { select: { id: true, organizationId: true } } },
  });

  // Vaqtinchalik qoralama + biriktirma: e'lon qilinmagan fayl sinovi uchun
  // Sarlavhalarni tekshirish uchun omborda haqiqiy fayl bo'lishi kerak
  let haqiqiyYol: string | null = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const natija = await put(
      `biriktirmalar/${crypto.randomUUID()}.csv`,
      "sarlavha,qiymat\nsinov,1\n",
      { access: "private", contentType: "text/csv", addRandomSuffix: false }
    );
    haqiqiyYol = natija.pathname;
  }

  const turkum = await db.category.findFirstOrThrow();
  const qoralama = await db.problem.create({
    data: {
      refCode: `XAVF-${Date.now()}`,
      organizationId: rahbar.organizationId!,
      authorId: rahbar.id,
      title: "Xavfsizlik sinovi uchun vaqtinchalik qoralama",
      description: "Bu yozuv skript tomonidan yaratilgan va darhol o'chiriladi.",
      categoryId: turkum.id,
      status: "DRAFT",
      attachments: {
        create: {
          fileName: "maxfiy-hujjat.csv",
          storedName: haqiqiyYol ?? `biriktirmalar/${crypto.randomUUID()}.csv`,
          mimeType: "text/csv",
          size: 24,
        },
      },
    },
    include: { attachments: true },
  });
  const qoralamaBiriktirma = qoralama.attachments[0];

  const cookie = (f: typeof admin) =>
    sessiyaTokeniYarat({ sub: f.id, role: f.role, ver: f.sessionVersion, org: f.organizationId });

  const adminC = await cookie(admin);
  const rahbarC = await cookie(rahbar);
  const dasturchiC = await cookie(dasturchi);
  const kutayotganC = await cookie(kutayotgan);
  const begonaC = begonaRahbar ? await cookie(begonaRahbar) : null;

  // Qalbakilashtirilgan tokenlar
  const eskiVersiya = await sessiyaTokeniYarat({
    sub: rahbar.id, role: rahbar.role, ver: rahbar.sessionVersion + 1, org: rahbar.organizationId,
  });
  const rolKotarilgan = await sessiyaTokeniYarat({
    sub: rahbar.id, role: "ADMIN", ver: rahbar.sessionVersion, org: rahbar.organizationId,
  });
  // Boshqa kalit bilan imzolangan token
  const haqiqiyKalit = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "x".repeat(64);
  const yotKalit = await sessiyaTokeniYarat({
    sub: admin.id, role: "ADMIN", ver: admin.sessionVersion, org: null,
  });
  process.env.SESSION_SECRET = haqiqiyKalit;

  await db.$disconnect();

  try {
    // ── 1. Biriktirilgan fayllar ──
    console.log("1. Biriktirilgan fayllar (asosiy talab)");
    {
      const F = (id: string) => `/api/fayl/${id}`;

      tekshir(
        "kirmagan foydalanuvchi faylni ololmaydi",
        (await ol(F(ochiqBiriktirma.id))).status === 401,
        "", "jiddiy"
      );
      tekshir(
        "TASDIQLANMAGAN dasturchi faylni ololmaydi",
        (await ol(F(ochiqBiriktirma.id), kutayotganC)).status === 403,
        "", "jiddiy"
      );

      const tasdiqlangan = await ol(F(ochiqBiriktirma.id), dasturchiC);
      tekshir(
        "tasdiqlangan dasturchi ombordagi faylga kira oladi",
        tasdiqlangan.status !== 403 && tasdiqlangan.status !== 401,
        `status ${tasdiqlangan.status}`
      );

      tekshir(
        "e'lon qilinmagan (qoralama) muammo fayli dasturchiga BERILMAYDI",
        (await ol(F(qoralamaBiriktirma.id), dasturchiC)).status === 403,
        "", "jiddiy"
      );

      if (begonaC) {
        tekshir(
          "boshqa tashkilot rahbari fayl ola olmaydi",
          (await ol(F(qoralamaBiriktirma.id), begonaC)).status === 403,
          "", "jiddiy"
        );
      }

      const oz = await ol(F(qoralamaBiriktirma.id), rahbarC);
      tekshir(
        "o'z tashkiloti rahbari faylga kira oladi",
        oz.status !== 403 && oz.status !== 401,
        `status ${oz.status}`
      );

      tekshir("mavjud bo'lmagan fayl 404", (await ol(F("yoq-bunday-id"))).status !== 200);
      tekshir(
        "yo'l hujumi (../) server xatosiga olib kelmaydi",
        (await ol(F("..%2F..%2Fetc%2Fpasswd"), adminC)).status !== 500
      );
    }

    // ── 2. Fayl ombori tashqaridan ──
    console.log("\n2. Fayl ombori");
    {
      const yol = qoralamaBiriktirma.storedName;
      tekshir(
        "bazada ochiq URL emas, ichki yo'l saqlanadi",
        !yol.startsWith("http"),
        `saqlangan: ${yol.slice(0, 40)}`, "jiddiy"
      );

      // Ochiq blob domenidan to'g'ridan-to'g'ri olishga urinish
      const taxminiy = `https://public.blob.vercel-storage.com/${yol}`;
      const javob = await fetch(taxminiy).catch(() => null);
      tekshir(
        "faylni ochiq blob manzilidan olib bo'lmaydi",
        !javob || javob.status !== 200,
        `status ${javob?.status}`, "jiddiy"
      );
    }

    // ── 3. Sessiya ishonchliligi ──
    console.log("\n3. Sessiya");
    {
      tekshir(
        "boshqa kalit bilan imzolangan token qabul qilinmaydi",
        kirishgaYonaltiradi(await ol("/admin", yotKalit)),
        "", "jiddiy"
      );
      tekshir(
        "eski sessiya versiyasi qabul qilinmaydi",
        kirishgaYonaltiradi(await ol("/rahbar", eskiVersiya))
      );
      // Rolni ko'tarish: imzo bizniki, lekin baza rolni qayta tekshiradi
      const kotarilgan = await ol("/admin", rolKotarilgan);
      tekshir(
        "tokendagi rolni ko'tarish admin panelini ochmaydi",
        kotarilgan.status !== 200,
        `status ${kotarilgan.status}`, "jiddiy"
      );
      tekshir(
        "buzilgan token bilan kirish sahifasi ochiladi (halqa yo'q)",
        (await ol("/kirish", "buzilgan.token.qiymat")).status === 200
      );

      const s = await sarlavhalar("/kirish");
      const cookieSarlavha = s.h.get("set-cookie") ?? "";
      tekshir(
        "sessiya cookie'si httpOnly (agar o'rnatilsa)",
        !cookieSarlavha.includes(SESSIYA_COOKIE) || /httponly/i.test(cookieSarlavha)
      );
    }

    // ── 4. Rollar orasidagi chegara ──
    console.log("\n4. Rollar");
    {
      tekshir("rahbar admin paneliga kira olmaydi", (await ol("/admin", rahbarC)).status !== 200, "", "jiddiy");
      tekshir("rahbar omborga kira olmaydi", (await ol("/ombor", rahbarC)).status !== 200);
      tekshir("dasturchi admin paneliga kira olmaydi", (await ol("/admin", dasturchiC)).status !== 200, "", "jiddiy");
      tekshir("dasturchi rahbar bo'limiga kira olmaydi", (await ol("/rahbar", dasturchiC)).status !== 200);
      tekshir(
        "tasdiqlanmagan dasturchi omborni ko'rmaydi",
        (await ol("/ombor", kutayotganC)).status !== 200,
        "", "jiddiy"
      );
      tekshir(
        "boshqa tashkilot muammosi rahbarga ko'rinmaydi",
        begonaC ? (await ol(`/rahbar/muammo/${qoralama.id}/korish`, begonaC)).status === 404 : true,
        "", "jiddiy"
      );
      tekshir(
        "qoralama omborda ko'rinmaydi",
        (await ol(`/ombor/${qoralama.id}`, dasturchiC)).status === 404,
        "", "jiddiy"
      );
    }

    // ── 5. Ochiq sahifada ma'lumot sizishi ──
    console.log("\n5. Ochiq sahifa");
    {
      const bosh = await ol("/");
      tekshir("bosh sahifa ochiladi", bosh.status === 200);
      tekshir(
        "muammo sarlavhalari oshkor bo'lmaydi",
        !bosh.matn.includes("Fuqarolar murojaatlari qog'oz"),
        "", "jiddiy"
      );
      tekshir("tashkilot nomlari oshkor bo'lmaydi", !bosh.matn.includes("Chilonzor tumani hokimligi"));
      tekshir(
        "maxfiy qiymatlar HTML'ga tushmaydi",
        !bosh.matn.includes("prisma+postgres://") && !bosh.matn.includes("api_key="),
        "", "jiddiy"
      );

      const sal = await ol("/api/salomatlik");
      tekshir(
        "diagnostika endpointi mehmonga sozlama tafsilotini bermaydi",
        !sal.matn.includes("sozlamalar") && !sal.matn.includes("DATABASE_URL"),
        `javob: ${sal.matn.slice(0, 80)}`, "jiddiy"
      );
      tekshir(
        "diagnostika endpointi maxfiy qiymat qaytarmaydi",
        !sal.matn.includes("prisma+postgres://") && !sal.matn.includes("api_key="),
        "", "jiddiy"
      );
      const salAdmin = await ol("/api/salomatlik", adminC);
      tekshir(
        "administrator to'liq tafsilotni ko'radi",
        salAdmin.matn.includes("sozlamalar")
      );
    }

    // ── 6. Inyeksiya va XSS ──
    console.log("\n6. Inyeksiya va XSS");
    {
      const sql = encodeURIComponent("' OR 1=1 --");
      const j1 = await ol(`/ombor?q=${sql}`, dasturchiC);
      tekshir("SQL inyeksiya qidiruvni buzmaydi", j1.status === 200, `status ${j1.status}`, "jiddiy");

      const drop = encodeURIComponent("'; DROP TABLE \"Problem\"; --");
      tekshir(
        "DROP TABLE urinishi zararsiz",
        (await ol(`/ombor?q=${drop}`, dasturchiC)).status === 200,
        "", "jiddiy"
      );

      const xss = encodeURIComponent('<script>alert(1)</script>');
      const j3 = await ol(`/ombor?q=${xss}`, dasturchiC);
      tekshir(
        "XSS yuklamasi HTML'ga xom holda tushmaydi",
        !j3.matn.includes("<script>alert(1)</script>"),
        "", "jiddiy"
      );
    }

    // ── 7. Javob sarlavhalari ──
    console.log("\n7. Sarlavhalar");
    {
      if (!haqiqiyYol) {
        console.log("  ⚠ o'tkazib yuborildi: BLOB_READ_WRITE_TOKEN yo'q, haqiqiy fayl yuklanmadi");
      } else {
        const f = await sarlavhalar(`/api/fayl/${qoralamaBiriktirma.id}`, rahbarC);
        tekshir("fayl haqiqatan beriladi", f.status === 200, `status ${f.status}`);
        tekshir("fayl javobida nosniff bor", f.h.get("x-content-type-options") === "nosniff");
        tekshir(
          "fayl attachment sifatida beriladi (brauzerda ochilmaydi)",
          (f.h.get("content-disposition") ?? "").startsWith("attachment"),
          "", "jiddiy"
        );
        tekshir(
          "fayl javobi keshlanmaydi",
          (f.h.get("cache-control") ?? "").includes("no-store")
        );
      }
    }
  } finally {
    // Sinov ma'lumotini albatta tozalaymiz
    await db.problem.delete({ where: { id: qoralama.id } }).catch(() => {});
    if (haqiqiyYol && process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(haqiqiyYol).catch(() => {});
    }
    await db.$disconnect().catch(() => {});
  }

  console.log(`\n${otdi} ta o'tdi, ${yiqildi} ta yiqildi`);
  if (jiddiy.length) {
    console.log("\nJIDDIY MUAMMOLAR:");
    for (const n of jiddiy) console.log(`  · ${n}`);
  }
  process.exit(yiqildi > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("XATO:", e instanceof Error ? e.message : e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
