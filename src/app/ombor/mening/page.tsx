import type { Metadata } from "next";

import { db } from "@/lib/db";
import { talabDasturchi } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { MuammolarJadvali } from "@/components/muammolar-jadvali";
import { BoshHolat } from "@/components/ui";
import { soatMatni } from "@/lib/scoring";

export const metadata: Metadata = { title: "Men olgan muammolar" };

export default async function MeningMuammolarim() {
  const dasturchi = await talabDasturchi();

  const topshiriqlar = await db.problemAssignment.findMany({
    where: { developerId: dasturchi.id },
    orderBy: [{ releasedAt: "asc" }, { takenAt: "desc" }],
    include: {
      problem: {
        include: {
          category: { select: { name: true } },
          organization: { select: { name: true, region: true } },
          _count: { select: { supporters: true, attachments: true } },
        },
      },
    },
  });

  const faol = topshiriqlar.filter((t) => t.releasedAt === null);
  const tugatilgan = topshiriqlar.filter((t) => t.releasedAt !== null);
  const jamiSoat = faol.reduce((s, t) => s + t.problem.monthlyHoursLost, 0);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Men olgan muammolar"
        izoh={
          faol.length > 0
            ? `${faol.length} ta faol muammo · ular birgalikda oyiga ${soatMatni(jamiSoat)} yo'qotmoqda`
            : undefined
        }
      />

      {faol.length === 0 && tugatilgan.length === 0 ? (
        <BoshHolat
          sarlavha="Siz hali birorta muammoni olmagansiz"
          izoh="Muammolar omboriga o'ting, o'zingizga mos muammoni tanlang va «Men olaman» tugmasini bosing."
        />
      ) : (
        <div className="space-y-8">
          {faol.length > 0 && (
            <section>
              <MuammolarJadvali
                muammolar={faol.map((t) => t.problem)}
                yol={(m) => `/ombor/${m.id}`}
                ustunlar={["tashkilot", "holat", "yoqotish"]}
              />
            </section>
          )}

          {tugatilgan.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
                Qo'yib yuborilganlar
              </h2>
              <div className="opacity-70">
                <MuammolarJadvali
                  muammolar={tugatilgan.map((t) => t.problem)}
                  yol={(m) => `/ombor/${m.id}`}
                  ustunlar={["tashkilot", "holat", "yoqotish"]}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
