"use client";

import { useActionState } from "react";

import { muammoniYop } from "@/app/rahbar/actions";
import { KattaMatn, Quti, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

/**
 * Siklni yopish — ataylab RAHBAR qiladi, dasturchi emas.
 * Aks holda muammo "hal qilindi" deb belgilanib, aslida tashkilotda
 * hech narsa o'zgarmagan bo'lishi mumkin edi.
 */
export function YopishFormasi({
  muammoId,
  dasturchiIzohi,
}: {
  muammoId: string;
  dasturchiIzohi?: string | null;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(muammoniYop, {});

  if (holat.muvaffaqiyat) {
    return <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>;
  }

  return (
    <Quti>
      <h2 className="font-medium text-matn">Dasturchi yechim taqdim etdi</h2>
      {dasturchiIzohi && (
        <p className="mt-2 rounded-lg bg-yuza px-3 py-2 text-sm text-matn-ikkilamchi">
          {dasturchiIzohi}
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-matn-ikkilamchi">
        Taklif qilingan yechim muammongizni hal qiladimi? Ha bo'lsa, muammoni yoping.
        Yo'q bo'lsa, hech narsa bosmang va dasturchi bilan bog'lanishda davom eting.
      </p>

      {holat.xato && <Xabar turi="xato" className="mt-3">{holat.xato}</Xabar>}

      <form action={amal} className="mt-4 space-y-3">
        <input type="hidden" name="muammoId" value={muammoId} />
        <KattaMatn
          name="izoh"
          rows={2}
          placeholder="Qisqacha izoh: nima o'zgardi? (ixtiyoriy)"
        />
        <Yuborish kutish="Saqlanmoqda…">Ha, muammo hal qilindi</Yuborish>
      </form>
    </Quti>
  );
}
