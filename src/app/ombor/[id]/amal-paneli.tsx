"use client";

import { useActionState, useState } from "react";

import { muammoniOl, muammoniQoyibYubor, yechimTaqdimEtildi } from "../actions";
import { KattaMatn, Kiritish, Quti, Tugma, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";
import type { ProblemStatus } from "@/generated/prisma/enums";

/** Dasturchining muammo sahifasidagi amallar paneli. */
export function AmalPaneli({
  muammoId,
  status,
  menikimi,
  boshqaDasturchi,
}: {
  muammoId: string;
  status: ProblemStatus;
  /** Muammo shu dasturchiga biriktirilganmi */
  menikimi: boolean;
  /** Boshqa dasturchi olgan bo'lsa — uning ismi */
  boshqaDasturchi?: string | null;
}) {
  const [olishHolati, olishAmali] = useActionState<AmalNatijasi, FormData>(muammoniOl, {});
  const [yechimHolati, yechimAmali] = useActionState<AmalNatijasi, FormData>(
    yechimTaqdimEtildi,
    {}
  );
  const [qoyibHolati, qoyibAmali] = useActionState<AmalNatijasi, FormData>(
    muammoniQoyibYubor,
    {}
  );
  const [qoyibKorinsin, setQoyibKorinsin] = useState(false);

  if (status === "RESOLVED") {
    return (
      <Xabar turi="muvaffaqiyat" sarlavha="Muammo hal qilindi">
        Tashkilot rahbari yechimni qabul qildi va muammoni yopdi.
      </Xabar>
    );
  }

  if (!menikimi && boshqaDasturchi) {
    return (
      <Xabar turi="malumot" sarlavha={`Bu muammoni ${boshqaDasturchi} olgan`}>
        U qo'yib yuborsa, muammo yana omborga qaytadi.
      </Xabar>
    );
  }

  if (!menikimi) {
    return (
      <Quti>
        {olishHolati.xato && <Xabar turi="xato" className="mb-3">{olishHolati.xato}</Xabar>}
        <h2 className="font-medium text-matn">Bu muammo ustida ishlamoqchimisiz?</h2>
        <p className="mt-1 text-sm leading-relaxed text-matn-ikkilamchi">
          «Men olaman» tugmasini bossangiz, mas'ul shaxsning telefon raqami ochiladi va
          muammo boshqa dasturchilar uchun band bo'ladi. Fikringiz o'zgarsa, uni istalgan
          vaqtda qo'yib yuborishingiz mumkin.
        </p>
        <form action={olishAmali} className="mt-4">
          <input type="hidden" name="muammoId" value={muammoId} />
          <Yuborish kutish="Biriktirilmoqda…">Men olaman</Yuborish>
        </form>
      </Quti>
    );
  }

  return (
    <Quti>
      {yechimHolati.muvaffaqiyat && (
        <Xabar turi="muvaffaqiyat" className="mb-3">{yechimHolati.muvaffaqiyat}</Xabar>
      )}
      {yechimHolati.xato && <Xabar turi="xato" className="mb-3">{yechimHolati.xato}</Xabar>}
      {qoyibHolati.xato && <Xabar turi="xato" className="mb-3">{qoyibHolati.xato}</Xabar>}

      <h2 className="font-medium text-matn">Bu muammo sizga biriktirilgan</h2>

      {status === "SOLUTION_OFFERED" ? (
        <p className="mt-1 text-sm text-matn-ikkilamchi">
          Yechim taqdim etilgani qayd qilindi. Endi tashkilot rahbari uni qabul qilib,
          muammoni yopishi kerak.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm leading-relaxed text-matn-ikkilamchi">
            Mas'ul shaxs bilan telefon orqali bog'laning va yechimingizni taqdim eting.
            Suhbatdan keyin quyida qisqacha yozib qo'ying.
          </p>

          <form action={yechimAmali} className="mt-4 space-y-3">
            <input type="hidden" name="muammoId" value={muammoId} />
            <KattaMatn
              name="izoh"
              rows={3}
              placeholder="Kim bilan gaplashdingiz va nima taklif qildingiz?"
              required
            />
            <Yuborish kutish="Saqlanmoqda…">Yechim taqdim etildi</Yuborish>
          </form>
        </>
      )}

      <div className="mt-5 border-t border-chegara pt-4">
        {qoyibKorinsin ? (
          <form action={qoyibAmali} className="space-y-3">
            <input type="hidden" name="muammoId" value={muammoId} />
            <Kiritish name="sabab" placeholder="Nega qo'yib yuboryapsiz? (ixtiyoriy)" />
            <div className="flex gap-2">
              <Tugma type="submit" korinish="xavfli" olcham="kichik">
                Ha, qo'yib yuboraman
              </Tugma>
              <Tugma
                type="button"
                korinish="shaffof"
                olcham="kichik"
                onClick={() => setQoyibKorinsin(false)}
              >
                Bekor qilish
              </Tugma>
            </div>
          </form>
        ) : (
          <Tugma
            type="button"
            korinish="shaffof"
            olcham="kichik"
            onClick={() => setQoyibKorinsin(true)}
          >
            Muammoni qo'yib yuborish
          </Tugma>
        )}
      </div>
    </Quti>
  );
}
