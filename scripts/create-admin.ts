/**
 * Administrator akkauntini yaratish yoki uning parolini tiklash.
 *
 * Seed skriptidan farqi: bu skript ISHLAB CHIQARISHDA ham ishlaydi va
 * mavjud ma'lumotga tegmaydi. Serverga birinchi marta joylashtirganda va
 * admin parolini yo'qotib qo'yganda shu skript ishlatiladi.
 *
 * Foydalanish:
 *   npm run admin:create
 *       — interaktiv: ism va telefonni so'raydi
 *
 *   npm run admin:create -- --ism "Sardor Rahimov" --tel 901112233
 *       — parol avtomatik yaratiladi va bir marta ekranga chiqadi
 *
 *   npm run admin:create -- --tel 901112233 --parolni-tikla
 *       — mavjud adminning parolini tiklaydi va barcha sessiyalarini uzadi
 *
 *   npm run admin:create -- --ism "..." --tel "..." --yana
 *       — tizimda admin allaqachon bo'lsa ham qo'shimcha admin yaratadi
 *
 *   npm run admin:create -- --ism "..." --tel "..." --parol "..."
 *       — parolni o'zingiz belgilaysiz (kamida 8 belgi)
 */
import "dotenv/config";

import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { stdin, stdout } from "node:process";

import { db } from "@/lib/db";
import { boshlangichParolYarat, parolXeshla } from "@/lib/password";
import { telefonNormalla } from "@/lib/validation";
import { telefonMatni } from "@/lib/labels";

const ENG_QISQA_PAROL = 8;

function chiqib(xabar: string): never {
  console.error(`\n  XATO: ${xabar}\n`);
  process.exit(1);
}

/** Interaktiv rejimda savol beradi. TTY bo'lmasa — xato. */
async function sora(savol: string): Promise<string> {
  if (!stdin.isTTY) {
    chiqib(
      `«${savol}» ko'rsatilmagan. Interaktiv bo'lmagan muhitda barcha ` +
        `parametrlarni bayroqlar orqali bering. Yordam uchun skript boshidagi izohga qarang.`
    );
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(`  ${savol}: `)).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      ism: { type: "string" },
      tel: { type: "string" },
      parol: { type: "string" },
      lavozim: { type: "string" },
      yana: { type: "boolean", default: false },
      "parolni-tikla": { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  const parolniTikla = values["parolni-tikla"] === true;

  // ── Telefon ──────────────────────────────────────────────────────
  const xomTelefon = values.tel ?? (await sora("Telefon raqami (masalan 901112233)"));
  const telefon = telefonNormalla(xomTelefon);
  if (!telefon) {
    chiqib(`«${xomTelefon}» to'g'ri telefon raqami emas. Namuna: +998901112233`);
  }

  const mavjud = await db.user.findUnique({
    where: { phone: telefon },
    select: { id: true, fullName: true, role: true, status: true },
  });

  // ── Parol ────────────────────────────────────────────────────────
  const berilganParol = values.parol ?? process.env.ADMIN_PASSWORD;
  if (berilganParol && berilganParol.length < ENG_QISQA_PAROL) {
    chiqib(`Parol kamida ${ENG_QISQA_PAROL} belgidan iborat bo'lishi kerak.`);
  }
  const parol = berilganParol || boshlangichParolYarat(12);
  const parolXeshi = await parolXeshla(parol);

  // ── Parolni tiklash ──────────────────────────────────────────────
  if (parolniTikla) {
    if (!mavjud) {
      chiqib(`${telefonMatni(telefon)} raqami bilan foydalanuvchi topilmadi.`);
    }
    if (mavjud.role !== "ADMIN") {
      chiqib(
        `${telefonMatni(telefon)} — bu ${mavjud.role} akkaunti, administrator emas. ` +
          `Oddiy foydalanuvchi parolini admin panelidan tiklang.`
      );
    }

    await db.user.update({
      where: { id: mavjud.id },
      data: {
        passwordHash: parolXeshi,
        status: "ACTIVE",
        // Barcha ochiq sessiyalar darhol yaroqsiz bo'ladi
        sessionVersion: { increment: 1 },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: mavjud.id,
        action: "admin.parol_skript_orqali_tiklandi",
        entity: "User",
        entityId: mavjud.id,
      },
    });

    natijaniChiqar("Parol tiklandi", mavjud.fullName, telefon, parol, !berilganParol);
    console.log("  Barcha eski sessiyalar uzildi — qaytadan kirish talab qilinadi.\n");
    return;
  }

  // ── Yangi admin yaratish ─────────────────────────────────────────
  if (mavjud) {
    chiqib(
      `${telefonMatni(telefon)} raqami band («${mavjud.fullName}», ${mavjud.role}).\n` +
        `         Parolni tiklamoqchi bo'lsangiz:  npm run admin:create -- --tel ${xomTelefon} --parolni-tikla`
    );
  }

  const adminlar = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { fullName: true, phone: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  if (adminlar.length > 0 && !values.yana) {
    console.error(`\n  Tizimda allaqachon ${adminlar.length} ta administrator bor:\n`);
    for (const a of adminlar) {
      console.error(`    · ${a.fullName} — ${telefonMatni(a.phone)} (${a.status})`);
    }
    chiqib(
      "Yana bitta admin kerak bo'lsa, --yana bayrog'ini qo'shing.\n" +
        "         Parolni yo'qotgan bo'lsangiz --parolni-tikla dan foydalaning."
    );
  }

  const ism = values.ism ?? (await sora("Ism-familiya"));
  if (ism.trim().length < 5) {
    chiqib("Ism-familiyani to'liq kiriting.");
  }

  const yangi = await db.user.create({
    data: {
      fullName: ism.trim(),
      position: values.lavozim?.trim() || "Tizim administratori",
      phone: telefon,
      passwordHash: parolXeshi,
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: { id: true, fullName: true },
  });

  await db.auditLog.create({
    data: {
      actorId: yangi.id,
      action: "admin.skript_orqali_yaratildi",
      entity: "User",
      entityId: yangi.id,
      meta: { birinchimi: adminlar.length === 0 },
    },
  });

  natijaniChiqar(
    adminlar.length === 0 ? "Birinchi administrator yaratildi" : "Administrator yaratildi",
    yangi.fullName,
    telefon,
    parol,
    !berilganParol
  );
}

function natijaniChiqar(
  sarlavha: string,
  ism: string,
  telefon: string,
  parol: string,
  parolYaratilganmi: boolean
) {
  const chiziq = "─".repeat(52);
  console.log(`\n  ${sarlavha}\n  ${chiziq}`);
  console.log(`  Ism      : ${ism}`);
  console.log(`  Login    : ${telefon}`);
  if (parolYaratilganmi) {
    console.log(`  Parol    : ${parol}`);
    console.log(`  ${chiziq}`);
    console.log("  Bu parol boshqa hech qayerda saqlanmaydi va qayta ko'rsatilmaydi.");
    console.log("  Uni hoziroq xavfsiz joyga ko'chiring.");
  } else {
    console.log(`  Parol    : (siz bergan parol)`);
    console.log(`  ${chiziq}`);
  }
  console.log("");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    // Prisma'ning unique cheklovi — ikki jarayon bir vaqtda ishga tushsa
    if ((e as { code?: string }).code === "P2002") {
      console.error("\n  XATO: Bu telefon raqami hozirgina band qilindi. Qaytadan urinib ko'ring.\n");
    } else {
      console.error("\n  XATO:", e instanceof Error ? e.message : e, "\n");
    }
    await db.$disconnect().catch(() => {});
    process.exit(1);
  });
