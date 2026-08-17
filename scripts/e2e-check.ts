/**
 * Uchdan-uchgacha ruxsat tekshiruvi.
 *
 * Ishga tushirish (dev server ochiq bo'lishi kerak):
 *   npm run dev            # boshqa terminalda
 *   npm run e2e
 *
 * Har bir rol uchun sessiya cookie'si yaratiladi va marshrutlar HTTP darajasida
 * tekshiriladi. Brauzersiz ishlaydi, tez va CI'da ham yuritsa bo'ladi.
 *
 * DIQQAT: skript avval barcha kerakli ma'lumotni bazadan o'qib oladi, so'ng
 * ulanishni UZADI va shundan keyingina HTTP so'rovlarni boshlaydi. Sababi:
 * lokal `prisma dev` serveri 10 ta ulanish bilan cheklangan, skript va dev
 * server bir vaqtda hovuz ochsa, server ulanishlarni uzib yuboradi (P1017).
 */
import "dotenv/config";

import { db } from "@/lib/db";
import { SESSIYA_COOKIE, sessiyaTokeniYarat } from "@/lib/session";

const ASOS = process.env.E2E_URL ?? "http://localhost:3000";

let otdi = 0;
let yiqildi = 0;

function tekshir(nom: string, shart: boolean, izoh = "") {
  if (shart) {
    otdi++;
    console.log(`  ✔ ${nom}`);
  } else {
    yiqildi++;
    console.log(`  ✘ ${nom}${izoh ? ` — ${izoh}` : ""}`);
  }
}

type Javob = { status: number; manzil: string | null; matn: string };

async function ol(yol: string, cookie?: string): Promise<Javob> {
  const javob = await fetch(`${ASOS}${yol}`, {
    redirect: "manual",
    headers: cookie ? { cookie: `${SESSIYA_COOKIE}=${cookie}` } : {},
  });
  const manzil = javob.headers.get("location");
  const matn = javob.status < 300 ? await javob.text() : "";
  return { status: javob.status, manzil, matn };
}

function yonaltiradi(j: Javob, yol: string): boolean {
  if (j.status !== 307 && j.status !== 302 && j.status !== 303) return false;
  if (!j.manzil) return false;
  return new URL(j.manzil, ASOS).pathname === yol;
}

/** Bazadan bir marta o'qib olinadigan hamma narsa. */
async function malumotYig() {
  const [admin, rahbar, dasturchi, kutayotgan] = await Promise.all([
    db.user.findFirstOrThrow({ where: { role: "ADMIN" } }),
    db.user.findFirstOrThrow({ where: { role: "LEADER" } }),
    db.user.findFirstOrThrow({ where: { role: "DEVELOPER", status: "ACTIVE" } }),
    db.user.findFirstOrThrow({ where: { role: "DEVELOPER", status: "PENDING" } }),
  ]);

  const [fayl, begonaMuammo, qoralama, ochiqMuammo] = await Promise.all([
    db.problemAttachment.findFirst({ select: { id: true } }),
    db.problem.findFirst({
      where: { organizationId: { not: rahbar.organizationId! } },
      select: { id: true },
    }),
    db.problem.findFirst({ where: { status: "DRAFT" }, select: { id: true } }),
    db.problem.findFirst({
      where: { status: "APPROVED", contactPhone: { not: null } },
      select: { id: true, contactPhone: true, title: true },
    }),
  ]);

  const cookie = (f: typeof admin) =>
    sessiyaTokeniYarat({
      sub: f.id,
      role: f.role,
      ver: f.sessionVersion,
      org: f.organizationId,
    });

  return {
    adminC: await cookie(admin),
    rahbarC: await cookie(rahbar),
    dasturchiC: await cookie(dasturchi),
    kutayotganC: await cookie(kutayotgan),
    // Bekor qilingan sessiyani sinash uchun: versiyasi mos kelmaydigan token
    eskiC: await sessiyaTokeniYarat({
      sub: rahbar.id,
      role: rahbar.role,
      ver: rahbar.sessionVersion + 1,
      org: rahbar.organizationId,
    }),
    faylId: fayl?.id ?? null,
    begonaMuammoId: begonaMuammo?.id ?? null,
    qoralamaId: qoralama?.id ?? null,
    ochiqMuammo,
  };
}

async function main() {
  console.log(`Tekshiruv manzili: ${ASOS}\n`);

  const m = await malumotYig();
  // Bazadagi ulanishlarni bo'shatamiz — quyida faqat HTTP ishlatiladi
  await db.$disconnect();

  console.log("Kirmagan mehmon:");
  {
    const bosh = await ol("/");
    tekshir("bosh sahifa ochiladi", bosh.status === 200, `status ${bosh.status}`);
    tekshir(
      "ochiq sahifada muammo sarlavhalari oshkor bo'lmaydi",
      m.ochiqMuammo ? !bosh.matn.includes(m.ochiqMuammo.title) : true,
      "yopiq ombor mazmuni ochiq sahifada ko'rinyapti"
    );
    tekshir("kirish sahifasi ochiladi", (await ol("/kirish")).status === 200);
    tekshir("/ombor kirishga yo'naltiradi", yonaltiradi(await ol("/ombor"), "/kirish"));
    tekshir("/rahbar kirishga yo'naltiradi", yonaltiradi(await ol("/rahbar"), "/kirish"));
    tekshir("/admin kirishga yo'naltiradi", yonaltiradi(await ol("/admin"), "/kirish"));

    if (m.faylId) {
      const j = await ol(`/api/fayl/${m.faylId}`);
      tekshir("fayl API avtorizatsiyasiz 401 qaytaradi", j.status === 401, `status ${j.status}`);
    }
  }

  console.log("\nTashkilot rahbari:");
  {
    tekshir("/rahbar ochiladi", (await ol("/rahbar", m.rahbarC)).status === 200);
    tekshir(
      "/rahbar/boshqalar ochiladi",
      (await ol("/rahbar/boshqalar", m.rahbarC)).status === 200
    );
    tekshir("/admin ga kira olmaydi", yonaltiradi(await ol("/admin", m.rahbarC), "/rahbar"));
    tekshir("/ombor ga kira olmaydi", yonaltiradi(await ol("/ombor", m.rahbarC), "/rahbar"));
    tekshir(
      "kirish sahifasidan ish stoliga qaytariladi",
      yonaltiradi(await ol("/kirish", m.rahbarC), "/rahbar")
    );

    if (m.begonaMuammoId) {
      const j = await ol(`/rahbar/muammo/${m.begonaMuammoId}/korish`, m.rahbarC);
      tekshir("boshqa tashkilot muammosi 404 beradi", j.status === 404, `status ${j.status}`);
    }
  }

  console.log("\nTasdiqlanmagan dasturchi:");
  {
    tekshir(
      "/ombor kutish sahifasiga yo'naltiradi",
      yonaltiradi(await ol("/ombor", m.kutayotganC), "/kutilmoqda"),
      "tasdiqlanmagan dasturchi omborga kirib qoldi"
    );
    tekshir("/kutilmoqda ochiladi", (await ol("/kutilmoqda", m.kutayotganC)).status === 200);
  }

  console.log("\nTasdiqlangan dasturchi:");
  {
    tekshir("/ombor ochiladi", (await ol("/ombor", m.dasturchiC)).status === 200);
    tekshir("/ombor/mening ochiladi", (await ol("/ombor/mening", m.dasturchiC)).status === 200);
    tekshir("/admin ga kira olmaydi", yonaltiradi(await ol("/admin", m.dasturchiC), "/ombor"));
    tekshir("/rahbar ga kira olmaydi", yonaltiradi(await ol("/rahbar", m.dasturchiC), "/ombor"));

    if (m.qoralamaId) {
      const j = await ol(`/ombor/${m.qoralamaId}`, m.dasturchiC);
      tekshir("qoralama omborda 404 beradi", j.status === 404, `status ${j.status}`);
    }

    if (m.ochiqMuammo?.contactPhone) {
      const j = await ol(`/ombor/${m.ochiqMuammo.id}`, m.dasturchiC);
      // Ikki shart alohida: aks holda 500 xatosi "maxfiylik buzildi" degan
      // noto'g'ri tashxis berib qo'yadi
      tekshir("ochiq muammo sahifasi ochiladi", j.status === 200, `status ${j.status}`);
      if (j.status === 200) {
        tekshir(
          "olinmagan muammoda telefon raqami yashirin",
          !j.matn.includes(m.ochiqMuammo.contactPhone),
          "aloqa raqami muammoni olmasdan ham ko'rinyapti"
        );
      }
    }
  }

  console.log("\nAdministrator:");
  {
    for (const yol of [
      "/admin",
      "/admin/moderatsiya",
      "/admin/dasturchilar",
      "/admin/tashkilotlar",
      "/admin/foydalanuvchilar",
      "/admin/dublikatlar",
    ]) {
      const j = await ol(yol, m.adminC);
      tekshir(`${yol} ochiladi`, j.status === 200, `status ${j.status}`);
    }
    tekshir("admin omborni ham ko'radi", (await ol("/ombor", m.adminC)).status === 200);
  }

  console.log("\nBekor qilingan sessiya:");
  {
    tekshir(
      "eski sessiya versiyasi qabul qilinmaydi",
      yonaltiradi(await ol("/rahbar", m.eskiC), "/kirish")
    );
    tekshir(
      "yaroqsiz cookie bilan kirish sahifasi ochiladi (halqa yo'q)",
      (await ol("/kirish", m.eskiC)).status === 200,
      "yo'naltirish halqasi qaytdi"
    );
  }

  console.log(`\n${otdi} ta o'tdi, ${yiqildi} ta yiqildi`);
  process.exit(yiqildi > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error("XATO:", e instanceof Error ? e.message : e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
