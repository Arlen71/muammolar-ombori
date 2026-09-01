import Link from "next/link";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Oqim, Ustunlar } from "@/components/grafik";
import { Quti, QutiSarlavha } from "@/components/ui";
import { MUAMMO_HOLATI, sanaVaqtMatni } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";

export default async function AdminBoshSahifa() {
  /*
    Muammolar bo'yicha barcha ko'rsatkich bitta `groupBy` bilan olinadi.
    Ilgari bu yerda 7 ta alohida `count`/`aggregate` bor edi — har biri baza
    bilan alohida aylanma. Bitta so'rov ham tezroq, ham ulanishlar hovuzini
    band qilmaydi.
  */
  const holatlarBoyicha = await db.problem.groupBy({
    by: ["status"],
    where: { canonicalId: null },
    _count: { _all: true },
    _sum: { monthlyHoursLost: true },
  });

  const soni = (...holatlar: string[]) =>
    holatlarBoyicha
      .filter((h) => holatlar.includes(h.status))
      .reduce((s, h) => s + h._count._all, 0);

  const omborda = soni("APPROVED", "TAKEN", "SOLUTION_OFFERED");
  const halQilingan = soni("RESOLVED");
  const jamiSoat = holatlarBoyicha
    .filter((h) => ["APPROVED", "TAKEN", "SOLUTION_OFFERED"].includes(h.status))
    .reduce((s, h) => s + (h._sum.monthlyHoursLost ?? 0), 0);

  const [
    tasdiqKutayotganDasturchilar,
    tashkilotlar,
    sonngiAmallar,
    tumanBoyicha,
    sohaBoyicha,
    toliqmaganlar,
  ] = await Promise.all([
    db.user.count({ where: { role: "DEVELOPER", status: "PENDING" } }),
    db.organization.count(),
    db.problemStatusHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { fullName: true } },
        problem: { select: { id: true, refCode: true, title: true } },
      },
    }),
    /*
      Tumanlar bo'yicha taqsimot. `groupBy` bevosita `organization.district`
      bo'yicha ishlamaydi (u bog'liq jadvalda), shuning uchun tashkilotlar
      olinadi va guruhlash kodda qilinadi — pilotda tashkilotlar soni
      o'nlab, ya'ni bu arzon.
    */
    db.organization.findMany({
      select: {
        district: true,
        _count: { select: { problems: { where: { status: { not: "DRAFT" } } } } },
      },
    }),
    db.problem.groupBy({
      by: ["categoryId"],
      where: { status: { not: "DRAFT" }, canonicalId: null },
      _count: { _all: true },
    }),
    db.problem.count({
      where: {
        status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED"] },
        completeness: { lt: 60 },
      },
    }),
  ]);

  // Tumanlar bo'yicha yig'indi — bir tumanda bir nechta tashkilot bo'lishi mumkin
  const tumanlar = new Map<string, number>();
  for (const t of tumanBoyicha) {
    if (!t.district || t._count.problems === 0) continue;
    tumanlar.set(t.district, (tumanlar.get(t.district) ?? 0) + t._count.problems);
  }
  const tumanUstunlari = [...tumanlar.entries()]
    .map(([yorliq, qiymat]) => ({ yorliq, qiymat }))
    .sort((a, b) => b.qiymat - a.qiymat);

  // Sohalar: turkum nomlarini alohida so'rov bilan olamiz
  const turkumlar = await db.category.findMany({ select: { id: true, name: true } });
  const turkumNomi = new Map(turkumlar.map((t) => [t.id, t.name]));
  const sohaUstunlari = sohaBoyicha
    .map((s) => ({
      yorliq: turkumNomi.get(s.categoryId) ?? "Boshqa",
      qiymat: s._count._all,
    }))
    .sort((a, b) => b.qiymat - a.qiymat)
    .slice(0, 6);

  /*
    Holatlar oqimi — muammoning zanjir bo'ylab harakati. Bu boshqaruv
    panelining asosiy savoliga javob beradi: jarayon qayerda tiqilib
    qolgan? Masalan "Dasturchi oldi" da katta son turib, "Hal qilindi"
    nol bo'lsa, demak dasturchilar boshlagan ishni tugatmayapti.
  */
  const oqim = [
    { yorliq: "Omborda", qiymat: soni("APPROVED"), rang: "text-malumot" },
    { yorliq: "Dasturchi oldi", qiymat: soni("TAKEN", "SOLUTION_OFFERED"), rang: "text-jarayon" },
    { yorliq: "Hal qilindi", qiymat: halQilingan, rang: "text-muvaffaqiyat" },
  ];

  /*
    Diqqat talab qiladigan ishlar.

    Moderatsiya navbati o'rniga — TO'LIQLIGI PAST kartochkalar. Muammo
    endi tasdiqsiz omborga tushadi, ya'ni sifatni tekshiradigan darvoza
    yo'q. Yarim to'ldirilgan kartochka esa dasturchi uchun foydasiz va
    u shunchaki omborda yotib qoladi. Administrator bunday yozuvlarni
    ko'rib, rahbarga eslatishi mumkin.
  */
  const ishlar = [
    {
      yol: "/admin/moderatsiya",
      matn: "To'liqligi 60% dan past muammo",
      soni: toliqmaganlar,
    },
    {
      yol: "/admin/dasturchilar",
      matn: "Tasdiq kutayotgan dasturchi",
      soni: tasdiqKutayotganDasturchilar,
    },
  ];

  return (
    <>
      <SahifaSarlavhasi sarlavha="Boshqaruv paneli" />

      {ishlar.some((i) => i.soni > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
            Sizning e'tiboringizni kutmoqda
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ishlar
              .filter((i) => i.soni > 0)
              .map((i) => (
                <Link
                  key={i.yol}
                  href={i.yol}
                  className="kotarilish flex items-center justify-between rounded-2xl border border-ogohlantirish-chegara bg-ogohlantirish-yuza px-5 py-4"
                >
                  <span className="text-sm font-medium text-ogohlantirish">{i.matn}</span>
                  <span className="font-display text-2xl font-bold tabular-nums text-ogohlantirish">
                    {i.soni}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { yorliq: "Omborda", qiymat: String(omborda) },
          { yorliq: "Hal qilingan", qiymat: String(halQilingan) },
          { yorliq: "Tashkilotlar", qiymat: String(tashkilotlar) },
          { yorliq: "Oyiga yo'qotish", qiymat: soatMatni(jamiSoat) },
        ].map((k) => (
          <div key={k.yorliq} className="rounded-2xl border border-chegara bg-yuza px-4 py-3">
            <p className="text-xs text-matn-ikkilamchi">{k.yorliq}</p>
            <p className="mt-0.5 font-display text-xl font-bold text-matn">{k.qiymat}</p>
          </div>
        ))}
      </div>

      <Quti className="mb-6">
        <QutiSarlavha
          sarlavha="Muammolar qayerda turibdi"
          izoh="Zanjir bo'ylab taqsimot — jarayon qayerda to'xtaganini ko'rsatadi."
          className="mb-4"
        />
        <Oqim bosqichlar={oqim} />
      </Quti>

      {(tumanUstunlari.length > 0 || sohaUstunlari.length > 0) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {tumanUstunlari.length > 0 && (
            <Quti>
              <QutiSarlavha
                sarlavha="Tumanlar bo'yicha"
                izoh="Qaysi tumandan ko'proq muammo kelyapti"
                className="mb-4"
              />
              <Ustunlar malumot={tumanUstunlari} />
            </Quti>
          )}

          {sohaUstunlari.length > 0 && (
            <Quti>
              <QutiSarlavha
                sarlavha="Sohalar bo'yicha"
                izoh="Eng ko'p uchraydigan oltita soha"
                className="mb-4"
              />
              <Ustunlar malumot={sohaUstunlari} />
            </Quti>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">So'nggi harakatlar</h2>
        {sonngiAmallar.length === 0 ? (
          <Quti className="text-sm text-matn-ikkilamchi">Hozircha harakat yo'q.</Quti>
        ) : (
          <ol className="space-y-2">
            {sonngiAmallar.map((h) => (
              <li key={h.id}>
                <Quti className="flex flex-wrap items-baseline justify-between gap-2 p-3.5 text-sm">
                  <span className="min-w-0 text-matn">
                    <strong>{MUAMMO_HOLATI[h.toStatus]}</strong> — {h.problem.title}
                  </span>
                  <span className="shrink-0 text-xs text-matn-uchinchi">
                    {h.actor.fullName} · {sanaVaqtMatni(h.createdAt)}
                  </span>
                </Quti>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
