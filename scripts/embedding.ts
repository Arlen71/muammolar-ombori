/**
 * Muammolarning vektorlarini to'ldirish va chegarani kalibrlash.
 *
 *   npm run embedding                  — vektori yo'q muammolarni to'ldiradi
 *   npm run embedding -- --hammasi     — hammasini qayta hisoblaydi
 *   npm run embedding -- --kalibrlash  — juftliklar ballini ko'rsatadi
 *
 * NEGA ALOHIDA SKRIPT
 *
 * Vektor muammo yuborilganda avtomatik yoziladi, lekin uch holatda
 * qo'lda to'ldirish kerak bo'ladi: embedding keyinroq yoqilgan, xizmat
 * o'sha payt ishlamagan, yoki model almashgan (eski vektorlar yangisi
 * bilan solishtirib bo'lmaydi).
 *
 * KALIBRLASH
 *
 * `EMBEDDING_CHEGARASI` ni taxmin bilan tanlab bo'lmaydi. Kosinus balli
 * mutlaq ma'noga ega emas: bir sohada 0.7 «aynan bir xil» bo'lsa,
 * boshqasida «shunchaki yaqin» bo'lishi mumkin. `--kalibrlash` bazadagi
 * barcha juftliklarni ball bo'yicha tartiblab ko'rsatadi — real
 * kartochkalarni ko'zdan kechirib chegarani shu ro'yxatdan tanlaysiz.
 */
import "dotenv/config";

import { db } from "@/lib/db";
import {
  embeddingSozlamalari,
  embeddingSozlanganmi,
  embeddinglarniOl,
} from "@/lib/embedding";
import { baytdan, baytga, kosinus, matnBelgisi, muammoMatni } from "@/lib/vektor";

/** Bir so'rovda nechta matn yuboriladi. Provayderlar odatda 2048 tagacha ruxsat beradi. */
const TOPLAM = 50;

const argv = process.argv.slice(2);
const hammasi = argv.includes("--hammasi");
const kalibrlash = argv.includes("--kalibrlash");

function qisqa(matn: string, uzunlik = 46): string {
  return matn.length <= uzunlik ? matn.padEnd(uzunlik) : `${matn.slice(0, uzunlik - 1)}…`;
}

async function toldir() {
  const muammolar = await db.problem.findMany({
    where: {
      canonicalId: null,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
      ...(hammasi ? {} : { OR: [{ embedding: null }, { embeddingModel: { not: embeddingSozlamalari.model } }] }),
    },
    select: { id: true, refCode: true, title: true, description: true, currentProcess: true },
    orderBy: { createdAt: "asc" },
  });

  if (muammolar.length === 0) {
    console.log("Hamma vektor joyida — qiladigan ish yo'q.");
    return;
  }

  console.log(
    `${muammolar.length} ta muammo, model ${embeddingSozlamalari.model}, ` +
      `o'lcham ${embeddingSozlamalari.olcham}\n`
  );

  let yozildi = 0;
  for (let i = 0; i < muammolar.length; i += TOPLAM) {
    const bolak = muammolar.slice(i, i + TOPLAM);
    const matnlar = bolak.map(muammoMatni);
    const vektorlar = await embeddinglarniOl(matnlar);

    /*
      Ketma-ket yoziladi, `Promise.all` bilan emas. Baza HTTP orqali
      ulangan va ellikta bir vaqtdagi yozuv ulanishlar chegarasiga
      urilishi mumkin. To'ldirish kamdan-kam yuritiladi, tezlik muhim emas.
    */
    for (let j = 0; j < bolak.length; j++) {
      await db.problem.update({
        where: { id: bolak[j].id },
        data: {
          embedding: baytga(vektorlar[j]),
          embeddingModel: embeddingSozlamalari.model,
          embeddingHash: matnBelgisi(matnlar[j]),
        },
      });
      yozildi++;
      console.log(`  ${bolak[j].refCode}  ${qisqa(bolak[j].title)}`);
    }
  }

  console.log(`\n${yozildi} ta vektor yozildi.`);
}

async function kalibrla() {
  const muammolar = await db.problem.findMany({
    where: {
      canonicalId: null,
      embedding: { not: null },
      embeddingModel: embeddingSozlamalari.model,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
    },
    select: {
      id: true,
      refCode: true,
      title: true,
      embedding: true,
      organization: { select: { name: true } },
    },
    orderBy: { refCode: "asc" },
  });

  if (muammolar.length < 2) {
    console.log("Kalibrlash uchun kamida ikkita vektorli muammo kerak.");
    return;
  }

  const juftlar: { ball: number; a: (typeof muammolar)[number]; b: (typeof muammolar)[number] }[] = [];
  for (let i = 0; i < muammolar.length; i++) {
    for (let j = i + 1; j < muammolar.length; j++) {
      juftlar.push({
        ball: kosinus(baytdan(muammolar[i].embedding!), baytdan(muammolar[j].embedding!)),
        a: muammolar[i],
        b: muammolar[j],
      });
    }
  }
  juftlar.sort((x, y) => y.ball - x.ball);

  console.log(
    `${muammolar.length} ta muammo, ${juftlar.length} ta juftlik. ` +
      `Joriy chegara: ${embeddingSozlamalari.chegara}\n`
  );
  console.log("Eng yaqin 20 juftlik:\n");
  for (const j of juftlar.slice(0, 20)) {
    const belgi = j.ball >= embeddingSozlamalari.chegara ? "→" : " ";
    console.log(`${belgi} ${j.ball.toFixed(3)}  ${qisqa(j.a.title, 40)} | ${qisqa(j.b.title, 40)}`);
  }

  /*
    Taqsimot. Agar ballar bitta tor oraliqqa yig'ilgan bo'lsa (masalan
    hammasi 0.55–0.65), chegara tanlash ma'nosini yo'qotadi — bu model
    bu matnlarni ajrata olmayotganini bildiradi.
  */
  const ballar = juftlar.map((j) => j.ball);
  const foiz = (p: number) => ballar[Math.floor((ballar.length - 1) * (1 - p))].toFixed(3);
  console.log(
    `\nTaqsimot:  eng yuqori ${ballar[0].toFixed(3)}  ` +
      `90% ${foiz(0.9)}  50% ${foiz(0.5)}  10% ${foiz(0.1)}  ` +
      `eng past ${ballar[ballar.length - 1].toFixed(3)}`
  );
  console.log(
    `\nChegarani yuqoridagi ro'yxatdan tanlang: haqiqiy dublikatlar ` +
      `bilan begona juftliklar orasidagi uzilish qayerda bo'lsa, o'sha yer.\n` +
      `Tanlagan qiymatni EMBEDDING_CHEGARASI ga yozing.`
  );
}

async function asosiy() {
  if (!embeddingSozlanganmi()) {
    throw new Error(
      "EMBEDDING_API_KEY o'rnatilmagan. .env fayliga qo'shing (.env.example ga qarang)."
    );
  }
  if (kalibrlash) await kalibrla();
  else await toldir();
}

asosiy()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error("XATO:", e instanceof Error ? e.message : e);
    await db.$disconnect().catch(() => {});
    process.exit(1);
  });
