import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { QadamKorsatkichi } from "@/components/sehrgar/qadam-korsatkichi";
import { Biriktirmalar } from "@/components/sehrgar/biriktirmalar";
import { Quti, Xabar } from "@/components/ui";
import {
  QADAMLAR,
  QADAM_NOMLARI,
  qadamSxemalari,
  type QadamRaqami,
} from "@/lib/problem-schema";
import {
  hajmMatni,
  maksimalHajm,
  omborUlanganmi,
  RUXSAT_ETILGAN_KENGAYTMALAR,
} from "@/lib/uploads";
import { SehrgarFormasi, type SehrgarMuammosi } from "./sehrgar-formasi";

export const metadata: Metadata = { title: "Muammoni tasvirlash" };

/** Sana maydonini <input type="date"> kutgan ko'rinishga keltiradi. */
function sanaMaydoni(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function SehrgarSahifasi(
  props: PageProps<"/rahbar/muammo/[id]/[qadam]">
) {
  const { id, qadam } = await props.params;
  const qadamRaqami = Number(qadam) as QadamRaqami;
  if (!QADAMLAR.includes(qadamRaqami)) notFound();

  const rahbar = await talabRahbar();
  const muammo = await db.problem.findFirst({
    where: { id, organizationId: rahbar.organizationId },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!muammo) notFound();

  // Yuborilgan muammoni tahrirlab bo'lmaydi
  if (muammo.status !== "DRAFT" && muammo.status !== "REJECTED") {
    redirect(`/rahbar/muammo/${id}/korish`);
  }

  // R2 Cloudflare hisobida yoqilmagan bo'lishi mumkin — u holda yuklash
  // blokini ko'rsatish o'rniga tushunarli xabar beramiz.
  const omborBor = qadamRaqami === 2 ? await omborUlanganmi() : false;

  const turkumlar = await db.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  // Qaysi qadamlar to'liq to'ldirilgan — ko'rsatkichda yashil bo'lib turadi
  const tugallangan = new Set(
    QADAMLAR.filter((q) => qadamSxemalari[q].safeParse(muammo).success)
  );

  const sehrgarMuammosi: SehrgarMuammosi = {
    id: muammo.id,
    title: muammo.title,
    description: muammo.description,
    categoryId: muammo.categoryId,
    painTypes: muammo.painTypes,
    currentProcess: muammo.currentProcess,
    toolsUsed: muammo.toolsUsed,
    toolsNote: muammo.toolsNote,
    rolesInvolved: muammo.rolesInvolved,
    frequency: muammo.frequency,
    frequencyUnit: muammo.frequencyUnit,
    minutesPerCase: muammo.minutesPerCase,
    peopleAffected: muammo.peopleAffected,
    citizensAffected: muammo.citizensAffected,
    consequence: muammo.consequence,
    urgency: muammo.urgency,
    deadline: sanaMaydoni(muammo.deadline),
    deadlineReason: muammo.deadlineReason,
    dataVolume: muammo.dataVolume,
    usersCount: muammo.usersCount,
    dataSensitivity: muammo.dataSensitivity,
    integrations: muammo.integrations,
    integrationsNote: muammo.integrationsNote,
    accessFrom: muammo.accessFrom,
    previousAttempt: muammo.previousAttempt,
    previousAttemptNote: muammo.previousAttemptNote,
    desiredOutcome: muammo.desiredOutcome,
    successMetric: muammo.successMetric,
    contactName: muammo.contactName,
    contactPosition: muammo.contactPosition,
    contactPhone: muammo.contactPhone,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/rahbar" className="text-matn-ikkilamchi hover:text-matn">
          ← Mening muammolarim
        </Link>
        <span className="text-matn-uchinchi">
          {muammo.refCode} · to'liqlik{" "}
          <strong className="tabular-nums text-matn">{muammo.completeness}%</strong>
        </span>
      </div>

      <QadamKorsatkichi
        muammoId={muammo.id}
        joriy={qadamRaqami}
        tugallangan={tugallangan}
      />

      {muammo.status === "REJECTED" && muammo.moderationNote && (
        <div className="mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
          <p className="font-semibold">Muammo rad etilgan</p>
          <p className="mt-1">{muammo.moderationNote}</p>
          <p className="mt-1">Kamchilikni tuzatib, qaytadan yuboring.</p>
        </div>
      )}

      <Quti className="p-5 sm:p-7">
        <SehrgarFormasi
          muammo={sehrgarMuammosi}
          qadam={qadamRaqami}
          turkumlar={turkumlar}
        />
      </Quti>

      {qadamRaqami === 2 && (
        <div className="mt-5">
          {omborBor ? (
            <Biriktirmalar
              muammoId={muammo.id}
              biriktirmalar={muammo.attachments.map((a) => ({
                id: a.id,
                fileName: a.fileName,
                size: a.size,
                mimeType: a.mimeType,
              }))}
              ruxsatEtilgan={RUXSAT_ETILGAN_KENGAYTMALAR}
              maksimalHajmMatni={hajmMatni(maksimalHajm())}
            />
          ) : (
            <Xabar turi="ogohlantirish" sarlavha="Fayl biriktirish hozircha ishlamaydi">
              Fayl ombori (R2) hali ulanmagan. Muammoni fayl biriktirmasdan ham
              yuborishingiz mumkin — keyinroq qo'shasiz. Administratorga xabar bering.
            </Xabar>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-matn-uchinchi">
        {qadamRaqami}-qadam / 5 · {QADAM_NOMLARI[qadamRaqami].qisqa}
      </p>
    </div>
  );
}
