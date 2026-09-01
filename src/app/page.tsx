import * as React from "react";
import Link from "next/link";

import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi, boshSahifa } from "@/lib/auth";
import { MavzuTugmasi } from "@/components/mavzu";
import { Naqsh } from "@/components/naqsh";
import { Sanoq } from "@/components/sanoq";
import { Nishoncha, Tugma } from "@/components/ui";

/*
  Sahifa har so'rovda qaytadan render qilinadi.

  Ikki sabab: ko'rsatilayotgan statistika jonli bo'lishi kerak va sahifa
  kirgan foydalanuvchini taniydi. Bunisiz Next uni build vaqtida statik
  render qilishga urinadi — build ishlab chiqarish bazasini talab qilib
  qoladi va toza muhitda yiqiladi.
*/
export const dynamic = "force-dynamic";

/** Omborda ko'rinadigan holatlar. */
const OMBORDAGI = ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] as const;

/**
 * Anonim statistika.
 *
 * Baza yetib bo'lmasa `null` qaytaradi va sahifa baribir ochiladi. Ochiq
 * sahifa statistika so'rovi tufayli qulab tushmasligi kerak: u tizim haqidagi
 * asosiy ma'lumotni ko'rsatadi va kirish tugmasini beradi — bularning ikkisi
 * ham bazaga bog'liq emas.
 */
async function statistika() {
  try {
    const [muammolar, tashkilotlar, sohalar, soatlar] = await Promise.all([
      db.problem.count({ where: { status: { in: [...OMBORDAGI] } } }),
      db.organization.count(),
      db.problem
        .groupBy({ by: ["categoryId"], where: { status: { in: [...OMBORDAGI] } } })
        .then((r) => r.length),
      db.problem
        .aggregate({
          _sum: { monthlyHoursLost: true },
          where: { status: { in: [...OMBORDAGI] } },
        })
        .then((r) => Math.round(r._sum.monthlyHoursLost ?? 0)),
    ]);
    return { muammolar, tashkilotlar, sohalar, soatlar };
  } catch (e) {
    console.error("Bosh sahifa statistikasi olinmadi:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Kirgan foydalanuvchi. Baza yetib bo'lmasa mehmon deb hisoblanadi. */
async function joriyFoydalanuvchiXavfsiz() {
  try {
    return await getJoriyFoydalanuvchi();
  } catch {
    return null;
  }
}

/**
 * Ochiq sahifa. Ombor yopiq bo'lgani uchun bu yerda faqat **anonim statistika**
 * ko'rsatiladi — muammo sarlavhalari ham, tashkilot nomlari ham chiqmaydi.
 */
export default async function BoshSahifa() {
  const [foydalanuvchi, son] = await Promise.all([
    joriyFoydalanuvchiXavfsiz(),
    statistika(),
  ]);

  const raqamlar = son === null ? [] : [
    { qiymat: son.muammolar, yorliq: "yig'ilgan muammo" },
    { qiymat: son.tashkilotlar, yorliq: "davlat tashkiloti" },
    { qiymat: son.sohalar, yorliq: "faoliyat sohasi" },
    { qiymat: son.soatlar, yorliq: "oyiga yo'qotilayotgan soat" },
  ];

  return (
    <>
      <header className="border-b border-chegara bg-yuza">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-display font-bold tracking-tight text-matn">Muammolar ombori</span>
          <div className="ml-auto flex items-center gap-2">
          <MavzuTugmasi />
          {foydalanuvchi ? (
            <Link href={boshSahifa(foydalanuvchi.role)}>
              <Tugma olcham="kichik" korinish="ikkilamchi">
                Ish stoliga o'tish
              </Tugma>
            </Link>
          ) : (
            <Link href="/kirish">
              <Tugma olcham="kichik">Kirish</Tugma>
            </Link>
          )}
          </div>
        </div>
      </header>

      <main id="asosiy" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {/*
          Gradientli panel — my.gov.uz bosh sahifasining o'zagi: ko'kdan
          yashilga o'tuvchi qiya to'rtburchak, ichida oq sarlavha.
          Yashil o'ng yuqori burchakda qoladi, matn esa chapda — ya'ni
          oq harflar doim to'q ko'k ustida turadi va kontrast pasaymaydi.

          Ichidagi naqsh — Oqsaroy koshinlarining sakkiz qirrali yulduzi.
          my.gov.uz o'sha joyda illyustratsiya qo'yadi; bizda uning
          o'rnini Qashqadaryoning me'moriy belgisi egallaydi va panelni
          tekis rangdan chiqaradi.
        */}
        <div className="jonlanish relative isolate overflow-hidden rounded-quti gradient-brend px-6 py-12 sm:px-10 sm:py-16">
          <Naqsh className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-white/[0.09]" />

          <div className="max-w-2xl lg:w-[68%] lg:max-w-none">
            {/*
              Pilot ko'lami darhol aytiladi. Boshqa viloyat rahbari kirib,
              o'z tashkilotini qidirib vaqt sarflamasin.
            */}
            <Nishoncha className="bg-yuza text-asosiy ring-transparent">
              Qashqadaryo viloyati · pilot bosqichi
            </Nishoncha>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Davlat tashkilotlaridagi real muammolar — bir joyda
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white">
              Tashkilot rahbarlari kundalik ishdagi muammolarini tizimga kiritadi.
              Tasdiqlangan dasturchilar shu ombordan real ehtiyojni ko'radi va
              yechim taklif qiladi.
            </p>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {raqamlar.map((r, i) => (
            <div
              key={r.yorliq}
              className="jonlanish rounded-quti bg-yuza px-5 py-6 ring-1 ring-inset ring-quti-chegara"
              style={{ "--jonlanish-tartib": i + 1 } as React.CSSProperties}
            >
              {/*
                `min-h-10` — ikki qator uchun joy. Yorliqlar har xil
                uzunlikda ("davlat tashkiloti" bir qator, "oyiga
                yo'qotilayotgan soat" ikki qator) va joy oldindan
                ajratilmasa, raqamlar turli balandlikda qolib ketadi.
                Qator esa aynan raqamlarni solishtirish uchun turibdi.
              */}
              <dt className="flex min-h-10 items-start text-sm leading-snug text-matn-ikkilamchi">
                {r.yorliq}
              </dt>
              <dd className="mt-1 font-display text-4xl font-bold tracking-tight text-matn">
                <Sanoq qiymat={r.qiymat} />
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              raqam: "1",
              sarlavha: "Rahbar muammoni yozadi",
              matn: "Texnik bilim talab qilinmaydi. Tizim oddiy savollar beradi: bu ishni hozir kim bajaradi, qancha vaqt ketadi, necha kishi jalb qilingan.",
            },
            {
              raqam: "2",
              sarlavha: "Muammo omborga tushadi",
              matn: "Tasdiq kutilmaydi — muammo yuborilishi bilan omborda ko'rinadi. Bir xil muammolar birlashtiriladi va qaysi muammo nechta tashkilotda uchrashi ko'rinadi.",
            },
            {
              raqam: "3",
              sarlavha: "Dasturchi yechim taklif qiladi",
              matn: "Tasdiqlangan dasturchi muammoni oladi, mas'ul shaxs bilan telefon orqali bog'lanadi va yechimni taqdim etadi.",
            },
          ].map((q) => (
            <div key={q.raqam}>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-asosiy-ochiq font-display text-sm font-bold text-asosiy ring-1 ring-inset ring-asosiy-chegara">
                {q.raqam}
              </span>
              <h2 className="mt-3 font-medium text-matn">{q.sarlavha}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-matn-ikkilamchi">
                {q.matn}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-16 rounded-quti gradient-yumshoq p-6 sm:p-8">
          <h2 className="font-medium text-matn">Ombor yopiq</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-matn-ikkilamchi">
            Muammolar davlat tashkilotlarining ichki ish jarayonlariga tegishli,
            shuning uchun ular faqat administrator tasdiqlagan dasturchilarga
            ko'rinadi. Tizimga kirish huquqini olish uchun administratorga murojaat qiling.
          </p>
        </div>
      </main>

      <footer className="border-t border-chegara bg-yuza">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-matn-uchinchi">
          Muammolar ombori · Qashqadaryo viloyati · Pilot loyiha
        </div>
      </footer>
    </>
  );
}
