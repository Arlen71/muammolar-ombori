import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { talabDasturchi } from "@/lib/auth";
import { MuammoKartochkasi } from "@/components/muammo-kartochkasi";
import { MuammoQatori } from "@/components/muammo-qatori";
import { Quti } from "@/components/ui";
import { MUAMMO_HOLATI, sanaVaqtMatni } from "@/lib/labels";
import { AmalPaneli } from "./amal-paneli";
import { SavolTugmasi } from "./savol-tugmasi";

export const metadata: Metadata = { title: "Muammo" };

export default async function OmborMuammosi(props: PageProps<"/ombor/[id]">) {
  const { id } = await props.params;
  const foydalanuvchi = await talabDasturchi();

  const muammo = await db.problem.findFirst({
    where: {
      id,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
    },
    include: {
      category: { select: { name: true } },
      organization: { select: { name: true, type: true, region: true, district: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      supporters: { include: { organization: { select: { name: true } } } },
      assignments: {
        where: { releasedAt: null },
        include: { developer: { select: { id: true, fullName: true } } },
        take: 1,
      },
      history: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true } } },
      },
      duplicates: {
        include: {
          category: { select: { name: true } },
          organization: { select: { name: true, region: true } },
          _count: { select: { supporters: true, attachments: true } },
        },
      },
    },
  });
  if (!muammo) notFound();

  const faolTopshiriq = muammo.assignments[0];
  const menikimi = faolTopshiriq?.developer.id === foydalanuvchi.id;

  // Aloqa raqami faqat muammoni olgan dasturchiga (va adminga) ko'rinadi.
  // Bu tashkilot rahbarini keraksiz qo'ng'iroqlardan himoya qiladi.
  const aloqaKorsatilsin = menikimi || foydalanuvchi.role === "ADMIN";

  return (
    <div>
      <Link href="/ombor" className="mb-4 inline-block text-sm text-matn-ikkilamchi hover:text-matn">
        ← Muammolar ombori
      </Link>

      {/*
        Keng ekranda amallar o'ng ustunda va yopishib turadi.

        Muammo kartochkasi uzun — dasturchi uni to'liq o'qib chiqadi va
        aynan o'qish davomida "bu menikimi?" degan qarorga keladi.
        Tugma sahifa oxirida bo'lsa, qaror qabul qilingan payt bilan
        tugma o'rtasida butun bir aylantirish masofasi turadi.

        Tor ekranda ustunlar birlashadi va amal kartochka ostiga
        tushadi — bu yerda yopishtirish mumkin emas, panel ekranning
        yarmini egallab qo'yardi.
      */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0">
          <Quti className="p-5 sm:p-7">
            <MuammoKartochkasi
              muammo={muammo}
              aloqaKorsatilsin={aloqaKorsatilsin}
              yuklabOlishMumkin
            />
          </Quti>
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <AmalPaneli
            muammoId={muammo.id}
            status={muammo.status}
            menikimi={menikimi}
            boshqaDasturchi={
              faolTopshiriq && !menikimi ? faolTopshiriq.developer.fullName : null
            }
          />

          {/*
            Savol berish muammoni olishdan MUSTAQIL. Dasturchi kartochkani
            o'qib, tushunarsiz joyni ko'rsa — darhol so'raydi. Administrator
            uchun ko'rsatilmaydi: u suhbatni kuzatadi, boshlamaydi.
          */}
          {foydalanuvchi.role === "DEVELOPER" && <SavolTugmasi muammoId={muammo.id} />}
        </div>
      </div>

      {muammo.duplicates.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-sm font-semibold text-matn-ikkilamchi">
            Shu muammoga birlashtirilgan yozuvlar
          </h2>
          <p className="mb-3 text-sm text-matn-uchinchi">
            Boshqa tashkilotlar aynan shu muammoni alohida kiritgan — yechim ularga ham
            kerak bo'ladi.
          </p>
          <div className="space-y-2.5">
            {muammo.duplicates.map((d) => (
              <MuammoQatori key={d.id} muammo={d} yol={`/ombor/${d.id}`} />
            ))}
          </div>
        </section>
      )}

      {muammo.history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">Holat tarixi</h2>
          <ol className="space-y-2">
            {muammo.history.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-chegara bg-yuza px-4 py-2.5 text-sm"
              >
                <span className="text-matn">
                  <strong>{MUAMMO_HOLATI[h.toStatus]}</strong>
                  {h.comment ? ` — ${h.comment}` : ""}
                </span>
                <span className="text-xs text-matn-uchinchi">
                  {h.actor.fullName} · {sanaVaqtMatni(h.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
