import Link from "next/link";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { MuammolarJadvali } from "@/components/muammolar-jadvali";
import { BoshHolat, KPIKartochka, Nishoncha, Quti, Tugma, Xabar } from "@/components/ui";
import { MUAMMO_HOLATI_RANGI, sanaMatni } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { yangiMuammoYarat } from "./actions";

export default async function RahbarBoshSahifa() {
  const rahbar = await talabRahbar();

  const muammolar = await db.problem.findMany({
    where: { organizationId: rahbar.organizationId },
    include: {
      category: { select: { name: true } },
      _count: { select: { supporters: true, attachments: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const qoralamalar = muammolar.filter((m) => m.status === "DRAFT");
  const yuborilganlar = muammolar.filter((m) => m.status !== "DRAFT");
  const radEtilganlar = yuborilganlar.filter(
    (m) => m.status === "REJECTED" && m.moderationNote
  );
  const halQilingan = muammolar.filter((m) => m.status === "RESOLVED").length;
  const jamiSoat = muammolar.reduce((s, m) => s + m.monthlyHoursLost, 0);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Mening muammolarim"
        izoh={rahbar.organizationName ?? undefined}
        amal={
          <form action={yangiMuammoYarat}>
            <Tugma type="submit">Yangi muammo qo'shish</Tugma>
          </form>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIKartochka yorliq="Jami muammo" qiymat={muammolar.length} />
        <KPIKartochka
          yorliq="Qoralama"
          qiymat={qoralamalar.length}
          izoh={qoralamalar.length > 0 ? "Yuborilmagan — dasturchilarga ko'rinmaydi" : undefined}
        />
        <KPIKartochka yorliq="Hal qilindi" qiymat={halQilingan} />
        <KPIKartochka
          yorliq="Oyiga yo'qotish"
          qiymat={<span className="text-2xl">{soatMatni(jamiSoat)}</span>}
          izoh="Barcha muammolar bo'yicha jami"
        />
      </div>

      {muammolar.length === 0 ? (
        <BoshHolat
          sarlavha="Hali birorta muammo kiritilmagan"
          izoh="Tashkilotingizdagi kundalik ishni sekinlashtirayotgan biror jarayonni tasvirlab bering. Texnik bilim kerak emas — tizim sizga oddiy savollar beradi."
          amal={
            <form action={yangiMuammoYarat}>
              <Tugma type="submit">Birinchi muammoni qo'shish</Tugma>
            </form>
          }
        />
      ) : (
        <div className="space-y-8">
          {qoralamalar.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
                Tugallanmagan qoralamalar
              </h2>
              <div className="space-y-2">
                {qoralamalar.map((m) => (
                  <Link
                    key={m.id}
                    href={`/rahbar/muammo/${m.id}/1`}
                    className="kotarilish block rounded-2xl"
                  >
                    <Quti className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-matn">
                          {m.title || "Nomsiz qoralama"}
                        </p>
                        <p className="mt-0.5 text-sm text-matn-uchinchi">
                          {m.refCode} · oxirgi o'zgarish {sanaMatni(m.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-28">
                          <div className="mb-1 flex justify-between text-xs text-matn-ikkilamchi">
                            <span>To'liqlik</span>
                            <span className="tabular-nums">{m.completeness}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-yuza-2">
                            <div
                              className="h-full rounded-full bg-asosiy transition-all"
                              style={{ width: `${m.completeness}%` }}
                            />
                          </div>
                        </div>
                        <Nishoncha className={MUAMMO_HOLATI_RANGI.DRAFT}>
                          Davom ettirish
                        </Nishoncha>
                      </div>
                    </Quti>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {yuborilganlar.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
                Yuborilgan muammolar
              </h2>

              <MuammolarJadvali
                muammolar={yuborilganlar}
                yol={(m) => `/rahbar/muammo/${m.id}/korish`}
                ustunlar={["holat", "soha", "yoqotish", "qollab"]}
              />

              {/*
                Rad etish sababi jadval ichida ko'rsatilmaydi — u uzun matn
                va hujayraga sig'maydi. Lekin rahbar uchun bu ro'yxatdagi
                eng muhim ma'lumot: nima tuzatish kerakligi shu yerda
                yozilgan. Shuning uchun u jadval ostida alohida chiqadi.
              */}
              {radEtilganlar.map((m) => (
                <Xabar
                  key={m.id}
                  turi="xato"
                  className="mt-3"
                  sarlavha={`Rad etildi: ${m.title}`}
                >
                  <p className="mt-1">{m.moderationNote}</p>
                  <Link
                    href={`/rahbar/muammo/${m.id}/korish`}
                    className="mt-2 inline-block font-medium underline"
                  >
                    Muammoni ochish
                  </Link>
                </Xabar>
              ))}
            </section>
          )}
        </div>
      )}
    </>
  );
}
