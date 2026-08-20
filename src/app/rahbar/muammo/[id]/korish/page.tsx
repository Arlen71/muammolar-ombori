import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { MuammoKartochkasi } from "@/components/muammo-kartochkasi";
import { Quti, Tugma, Xabar } from "@/components/ui";
import { MUAMMO_HOLATI, sanaVaqtMatni } from "@/lib/labels";
import { QADAMLAR, qadamSxemalari } from "@/lib/problem-schema";
import { YuborishFormasi } from "./yuborish-formasi";
import { YopishFormasi } from "./yopish-formasi";

export const metadata: Metadata = { title: "Muammoni ko'rish" };

export default async function KorishSahifasi(
  props: PageProps<"/rahbar/muammo/[id]/korish">
) {
  const { id } = await props.params;
  const qidiruv = await props.searchParams;
  const yangiYuborildi = qidiruv.yuborildi === "1";

  const rahbar = await talabRahbar();
  const muammo = await db.problem.findFirst({
    where: { id, organizationId: rahbar.organizationId },
    include: {
      category: { select: { name: true } },
      organization: { select: { name: true, type: true, region: true, district: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      supporters: { include: { organization: { select: { name: true } } } },
      history: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { fullName: true } } },
      },
    },
  });
  if (!muammo) notFound();

  const tahrirlanadi = muammo.status === "DRAFT" || muammo.status === "REJECTED";
  const tayyor = QADAMLAR.every((q) => qadamSxemalari[q].safeParse(muammo).success);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/rahbar" className="text-sm text-matn-ikkilamchi hover:text-matn">
          ← Mening muammolarim
        </Link>
        {tahrirlanadi && (
          <Link href={`/rahbar/muammo/${muammo.id}/1`}>
            <Tugma korinish="ikkilamchi" olcham="kichik">
              Tahrirlash
            </Tugma>
          </Link>
        )}
      </div>

      {yangiYuborildi && (
        <Xabar turi="muvaffaqiyat" sarlavha="Muammo yuborildi" className="mb-5">
          Administrator uni ko'rib chiqadi. Tasdiqlangach muammo omborga tushadi va
          dasturchilarga ko'rinadi.
        </Xabar>
      )}

      {tahrirlanadi && (
        <Xabar turi="malumot" className="mb-5" sarlavha="Dasturchi buni shunday ko'radi">
          Quyida muammongiz dasturchi ekranida qanday ko'rinishi aks etgan.
          Yetishmayotgan joy bo'lsa, «Tahrirlash» tugmasi orqali to'ldiring.
        </Xabar>
      )}

      <Quti className="p-5 sm:p-7">
        <MuammoKartochkasi
          muammo={muammo}
          // Rahbar o'z tashkiloti muammosining aloqasini ko'rishi tabiiy
          aloqaKorsatilsin
          yuklabOlishMumkin
        />
      </Quti>

      {tahrirlanadi && (
        <div className="mt-6">
          <YuborishFormasi
            muammoId={muammo.id}
            tayyor={tayyor}
            qoralamami={muammo.status === "DRAFT"}
          />
        </div>
      )}

      {muammo.status === "SOLUTION_OFFERED" && (
        <div className="mt-6">
          <YopishFormasi
            muammoId={muammo.id}
            dasturchiIzohi={
              muammo.history.find((h) => h.toStatus === "SOLUTION_OFFERED")?.comment
            }
          />
        </div>
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
