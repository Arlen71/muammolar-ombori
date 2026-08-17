import Link from "next/link";

import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi, boshSahifa } from "@/lib/auth";
import { Tugma } from "@/components/ui";
import { sonMatni } from "@/lib/labels";

/**
 * Ochiq sahifa. Ombor yopiq bo'lgani uchun bu yerda faqat **anonim statistika**
 * ko'rsatiladi — muammo sarlavhalari ham, tashkilot nomlari ham chiqmaydi.
 */
export default async function BoshSahifa() {
  const [foydalanuvchi, muammolar, tashkilotlar, sohalar, soatlar] = await Promise.all([
    getJoriyFoydalanuvchi(),
    db.problem.count({
      where: { status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] } },
    }),
    db.organization.count(),
    db.problem
      .groupBy({
        by: ["categoryId"],
        where: { status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] } },
      })
      .then((r) => r.length),
    db.problem
      .aggregate({
        _sum: { monthlyHoursLost: true },
        where: { status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] } },
      })
      .then((r) => Math.round(r._sum.monthlyHoursLost ?? 0)),
  ]);

  const raqamlar = [
    { qiymat: muammolar, yorliq: "yig'ilgan muammo" },
    { qiymat: tashkilotlar, yorliq: "davlat tashkiloti" },
    { qiymat: sohalar, yorliq: "faoliyat sohasi" },
    { qiymat: soatlar, yorliq: "oyiga yo'qotilayotgan soat" },
  ];

  return (
    <>
      <header className="border-b border-chegara bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-semibold tracking-tight text-matn">Muammolar ombori</span>
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
      </header>

      <main id="asosiy" className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-matn sm:text-4xl">
            Davlat tashkilotlaridagi real muammolar — bir joyda
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-matn-ikkilamchi">
            Tashkilot rahbarlari kundalik ishdagi muammolarini tizimga kiritadi.
            Tasdiqlangan dasturchilar shu ombordan real ehtiyojni ko'radi va
            yechim taklif qiladi.
          </p>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {raqamlar.map((r) => (
            <div
              key={r.yorliq}
              className="rounded-xl border border-chegara bg-white px-5 py-6"
            >
              <dt className="text-sm text-matn-ikkilamchi">{r.yorliq}</dt>
              <dd className="mt-1 text-3xl font-semibold tabular-nums text-matn">
                {sonMatni(r.qiymat)}
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
              matn: "Administrator tekshiradi. Bir xil muammolar birlashtiriladi — shunda qaysi muammo nechta tashkilotda uchrashi ko'rinadi.",
            },
            {
              raqam: "3",
              sarlavha: "Dasturchi yechim taklif qiladi",
              matn: "Tasdiqlangan dasturchi muammoni oladi, mas'ul shaxs bilan telefon orqali bog'lanadi va yechimni taqdim etadi.",
            },
          ].map((q) => (
            <div key={q.raqam}>
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-asosiy-ochiq text-sm font-semibold text-asosiy">
                {q.raqam}
              </span>
              <h2 className="mt-3 font-medium text-matn">{q.sarlavha}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-matn-ikkilamchi">
                {q.matn}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-16 rounded-xl border border-chegara bg-white p-6 sm:p-8">
          <h2 className="font-medium text-matn">Ombor yopiq</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-matn-ikkilamchi">
            Muammolar davlat tashkilotlarining ichki ish jarayonlariga tegishli,
            shuning uchun ular faqat administrator tasdiqlagan dasturchilarga
            ko'rinadi. Tizimga kirish huquqini olish uchun administratorga murojaat qiling.
          </p>
        </div>
      </main>

      <footer className="border-t border-chegara bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-matn-uchinchi">
          Muammolar ombori · Davlat tashkilotlari uchun
        </div>
      </footer>
    </>
  );
}
