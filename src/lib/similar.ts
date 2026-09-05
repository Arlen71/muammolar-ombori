import "server-only";

import { db } from "@/lib/db";
import type { ProblemStatus } from "@/generated/prisma/enums";
import {
  embeddingSozlamalari,
  embeddingSozlanganmi,
  embeddinglarniOl,
} from "@/lib/embedding";
import { baytdan, baytga, kosinus, matnBelgisi, muammoMatni } from "@/lib/vektor";

/**
 * O'xshash muammolarni topish.
 *
 * UCH BOSQICHLI ZAXIRA
 *
 *   1. Vektor (embedding) — ma'noni solishtiradi. Umumiy so'z bo'lmasa ham
 *      «Xodimlar ta'til so'rovini qog'ozda yozadi» bilan «Mehnat ta'tili
 *      hujjatlari jurnalda yuritiladi» ni bog'laydi.
 *   2. `pg_trgm` — so'zlarni uch harfli bo'laklarga bo'lib solishtiradi.
 *      Embedding sozlanmagan yoki hali bironta muammo vektorga
 *      aylantirilmagan bo'lsa ishlaydi.
 *   3. Oddiy so'z qidiruvi — `pg_trgm` kengaytmasi ham bo'lmasa.
 *
 * Har bosqich o'zidan keyingisiga tushadi va dastur hech qachon
 * ishlashdan to'xtamaydi: bu qidiruv forma to'ldirishga xalaqit
 * bermasligi kerak.
 *
 * BU FUNKSIYA QAROR QABUL QILMAYDI. U faqat nomzodlarni ball bilan
 * qaytaradi. Birlashtirish — bir tashkilotning muammosini ombordan
 * olib tashlash demak, shuning uchun uni odam bosadi
 * (`dublikatniBirlashtir`).
 */

export type OxshashMuammo = {
  id: string;
  refCode: string;
  title: string;
  organizationName: string;
  supporterCount: number;
  oxshashlik: number;
  /** Ball qaysi usul bilan olingani — interfeysda tushuntirish uchun */
  usul: "vektor" | "trigram" | "soz";
};

/** Kengaytma bir marta tekshiriladi va natija eslab qolinadi. */
let trgmBormi: boolean | null = null;

async function trgmMavjudmi(): Promise<boolean> {
  if (trgmBormi !== null) return trgmBormi;
  try {
    const natija = await db.$queryRaw<{ bor: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS bor`;
    trgmBormi = natija[0]?.bor ?? false;
  } catch {
    trgmBormi = false;
  }
  return trgmBormi;
}

/** Zaxira usul: sarlavhadagi uzun so'zlar bo'yicha qidiradi. */
async function zaxiraQidiruv(
  sarlavha: string,
  chiqarilsin: string[],
  soni: number
): Promise<OxshashMuammo[]> {
  const sozlar = sarlavha
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length >= 5)
    .slice(0, 6);
  if (sozlar.length === 0) return [];

  const topilgan = await db.problem.findMany({
    where: {
      id: { notIn: chiqarilsin },
      canonicalId: null,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
      OR: sozlar.map((s) => ({ title: { contains: s, mode: "insensitive" as const } })),
    },
    take: soni,
    include: {
      organization: { select: { name: true } },
      _count: { select: { supporters: true } },
    },
  });

  return topilgan.map((m) => {
    const mosKelgan = sozlar.filter((s) => m.title.toLowerCase().includes(s)).length;
    return {
      id: m.id,
      refCode: m.refCode,
      title: m.title,
      organizationName: m.organization.name,
      supporterCount: m._count.supporters,
      oxshashlik: mosKelgan / sozlar.length,
      usul: "soz" as const,
    };
  });
}

/** Omborda turgan, boshqasining takrori bo'lmagan muammolar. */
const OMBORDAGI_HOLATLAR: ProblemStatus[] = [
  "APPROVED",
  "TAKEN",
  "SOLUTION_OFFERED",
  "RESOLVED",
];

const OMBORDAGI = {
  canonicalId: null,
  status: { in: OMBORDAGI_HOLATLAR },
};

/**
 * Vektor bo'yicha qidiruv.
 *
 * Barcha vektorlar bazadan o'qib olinadi va kosinus Node ichida
 * hisoblanadi. Pilot hajmida (yuzlab muammo) bu bir necha millisekund va
 * `pgvector` kengaytmasiga bog'lanish shart emas — bu esa bazani
 * O'zbekistondagi serverga ko'chirishni osonlashtiradi.
 *
 * Yozuvlar o'n mingdan oshsa bu usul sekinlashadi; o'shanda `pgvector`
 * ga o'tish kerak bo'ladi. Interfeys o'zgarmaydi.
 *
 * Nomzod topilmasa `null` qaytaradi — bu «vektor qidiruvi ishlamadi»
 * degani (hali bironta muammo vektorga aylantirilmagan). Bo'sh massiv
 * esa «ishladi, lekin o'xshashi yo'q» degani. Bu farq muhim: birinchisida
 * `pg_trgm` ga tushish kerak, ikkinchisida esa yo'q — aks holda toza
 * natija ustiga trigramning shovqini qo'shilardi.
 */
async function vektorQidiruv(
  matn: string,
  chiqarilsin: string[],
  soni: number,
  engKam: number
): Promise<OxshashMuammo[] | null> {
  if (!embeddingSozlanganmi()) return null;

  const nomzodlar = await db.problem.findMany({
    where: {
      ...OMBORDAGI,
      id: { notIn: chiqarilsin },
      embedding: { not: null },
      embeddingModel: embeddingSozlamalari.model,
    },
    select: {
      id: true,
      refCode: true,
      title: true,
      embedding: true,
      organization: { select: { name: true } },
      _count: { select: { supporters: true } },
    },
  });
  if (nomzodlar.length === 0) return null;

  let soralgan: Float32Array;
  try {
    [soralgan] = await embeddinglarniOl([matn]);
  } catch {
    // Xizmat javob bermasa qidiruvni butunlay yo'qotmaymiz — trigramga tushamiz
    return null;
  }

  return nomzodlar
    .map((m) => ({
      id: m.id,
      refCode: m.refCode,
      title: m.title,
      organizationName: m.organization.name,
      supporterCount: m._count.supporters,
      oxshashlik: kosinus(soralgan, baytdan(m.embedding!)),
      usul: "vektor" as const,
    }))
    .filter((m) => m.oxshashlik >= engKam)
    .sort((a, b) => b.oxshashlik - a.oxshashlik)
    .slice(0, soni);
}

/**
 * Berilgan matnga o'xshash, omborda turgan muammolarni qaytaradi.
 *
 * @param matn    Sarlavha, yoki sarlavha + tavsif. Saqlangan vektorlar
 *                `muammoMatni()` dan olingani uchun so'rov ham imkon
 *                qadar shu shaklda bo'lishi kerak — aks holda so'rov
 *                vektori boshqa joyda turadi va ballar pasayadi.
 * @param engKam  Trigram uchun eng kam ball. Vektor o'z chegarasini
 *                `EMBEDDING_CHEGARASI` dan oladi: ikki usulning ballari
 *                bir xil shkalada emas va bitta son ikkalasiga to'g'ri
 *                kelmaydi.
 */
export async function oxshashMuammolar(
  matn: string,
  {
    chiqarilsin = [],
    soni = 5,
    engKam = 0.3,
  }: { chiqarilsin?: string[]; soni?: number; engKam?: number } = {}
): Promise<OxshashMuammo[]> {
  const tozaMatn = matn.trim();
  if (tozaMatn.length < 10) return [];

  const vektor = await vektorQidiruv(
    tozaMatn,
    chiqarilsin,
    soni,
    embeddingSozlamalari.chegara
  );
  if (vektor !== null) return vektor;

  // Trigram faqat sarlavha bo'yicha ishlaydi — uzun matnda `similarity()`
  // ballari cho'kib ketadi, chunki u butun satrni solishtiradi.
  const sarlavha = tozaMatn.split("\n")[0].slice(0, 200);

  if (!(await trgmMavjudmi())) {
    return zaxiraQidiruv(sarlavha, chiqarilsin, soni);
  }

  // Prisma'ning tipli so'rovlari `similarity()` ni bilmaydi — xom SQL ishlatamiz.
  // Barcha qiymatlar parametr sifatida uzatiladi, SQL inyeksiya ehtimoli yo'q.
  const chiqarilsinRoyxati = chiqarilsin.length > 0 ? chiqarilsin : ["__yoq__"];

  const natija = await db.$queryRaw<
    {
      id: string;
      refCode: string;
      title: string;
      organizationName: string;
      supporterCount: bigint;
      oxshashlik: number;
    }[]
  >`
    SELECT p.id,
           p."refCode",
           p.title,
           o.name AS "organizationName",
           count(s.id) AS "supporterCount",
           similarity(p.title, ${sarlavha}) AS oxshashlik
      FROM "Problem" p
      JOIN "Organization" o ON o.id = p."organizationId"
      LEFT JOIN "ProblemSupporter" s ON s."problemId" = p.id
     WHERE p."canonicalId" IS NULL
       AND p.status IN ('APPROVED', 'TAKEN', 'SOLUTION_OFFERED', 'RESOLVED')
       AND p.id <> ALL(${chiqarilsinRoyxati})
       AND similarity(p.title, ${sarlavha}) >= ${engKam}
     GROUP BY p.id, p."refCode", p.title, o.name
     ORDER BY oxshashlik DESC
     LIMIT ${soni}`;

  return natija.map((r) => ({
    ...r,
    supporterCount: Number(r.supporterCount),
    usul: "trigram" as const,
  }));
}

/**
 * Muammoning vektorini yangilaydi.
 *
 * Matn o'zgarmagan bo'lsa hech narsa qilmaydi — bu tekin emas, har bir
 * chaqiruv tashqi xizmatga so'rov.
 *
 * XATO TASHLAMAYDI. Bu funksiya muammo yuborilayotganda chaqiriladi va
 * embedding xizmati ishlamagani uchun rahbarning ishi to'xtab qolishi
 * mumkin emas. Muvaffaqiyatsiz bo'lsa vektor bo'sh qoladi va uni
 * keyinroq `npm run embedding` to'ldiradi.
 */
export async function muammoVektoriniYangila(muammoId: string): Promise<boolean> {
  if (!embeddingSozlanganmi()) return false;

  try {
    const muammo = await db.problem.findUnique({
      where: { id: muammoId },
      select: {
        title: true,
        description: true,
        currentProcess: true,
        embeddingHash: true,
        embeddingModel: true,
      },
    });
    if (!muammo) return false;

    const matn = muammoMatni(muammo);
    const belgi = matnBelgisi(matn);
    if (
      muammo.embeddingHash === belgi &&
      muammo.embeddingModel === embeddingSozlamalari.model
    ) {
      return false;
    }

    const [vektor] = await embeddinglarniOl([matn]);
    await db.problem.update({
      where: { id: muammoId },
      data: {
        embedding: baytga(vektor),
        embeddingModel: embeddingSozlamalari.model,
        embeddingHash: belgi,
      },
    });
    return true;
  } catch (e) {
    console.error("Vektorni yangilab bo'lmadi:", e instanceof Error ? e.message : e);
    return false;
  }
}
