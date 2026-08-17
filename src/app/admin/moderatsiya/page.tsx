import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { MuammoKartochkasi } from "@/components/muammo-kartochkasi";
import { BoshHolat, Quti } from "@/components/ui";
import { oxshashMuammolar } from "@/lib/similar";
import { ModeratsiyaAmali } from "./moderatsiya-amali";

export const metadata: Metadata = { title: "Moderatsiya" };

export default async function ModeratsiyaSahifasi() {
  const muammolar = await db.problem.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { submittedAt: "asc" },
    include: {
      category: { select: { name: true } },
      organization: { select: { name: true, type: true, region: true, district: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      supporters: { include: { organization: { select: { name: true } } } },
    },
  });

  // Har bir muammo uchun omborda o'xshashi bormi — moderatorga dublikatni
  // birlashtirish kerakligini oldindan ko'rsatadi
  const oxshashlar = await Promise.all(
    muammolar.map((m) => oxshashMuammolar(m.title, { chiqarilsin: [m.id], soni: 3 }))
  );

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Moderatsiya navbati"
        izoh={
          muammolar.length > 0
            ? `${muammolar.length} ta muammo ko'rib chiqilishi kerak`
            : undefined
        }
      />

      {muammolar.length === 0 ? (
        <BoshHolat
          sarlavha="Navbat bo'sh"
          izoh="Barcha yuborilgan muammolar ko'rib chiqilgan."
        />
      ) : (
        <div className="space-y-6">
          {muammolar.map((m, i) => (
            <Quti key={m.id} className="p-5 sm:p-7">
              <MuammoKartochkasi muammo={m} aloqaKorsatilsin yuklabOlishMumkin />

              <div className="mt-6 border-t border-chegara pt-5">
                {oxshashlar[i].length > 0 && (
                  <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm ring-1 ring-inset ring-amber-200">
                    <p className="font-medium text-amber-900">
                      Omborda o'xshash muammo bor — birlashtirishni ko'rib chiqing
                    </p>
                    <ul className="mt-1.5 space-y-1 text-amber-900/90">
                      {oxshashlar[i].map((o) => (
                        <li key={o.id}>
                          {o.title}{" "}
                          <span className="text-amber-800/70">
                            ({o.organizationName}, {Math.round(o.oxshashlik * 100)}% o'xshash)
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-800">
                      Birlashtirish «Dublikatlar» bo'limida amalga oshiriladi.
                    </p>
                  </div>
                )}

                <ModeratsiyaAmali muammoId={m.id} />
              </div>
            </Quti>
          ))}
        </div>
      )}
    </>
  );
}
