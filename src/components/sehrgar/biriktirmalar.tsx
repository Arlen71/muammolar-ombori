"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";

import { biriktirmaniOchir, fayllarniYukla } from "@/app/rahbar/actions";
import { Tugma, Xabar } from "@/components/ui";
import { hajmMatni } from "@/lib/uploads-client";
import type { AmalNatijasi } from "@/lib/validation";

export type Biriktirma = {
  id: string;
  fileName: string;
  size: number;
  mimeType: string;
};

function YuklashTugmasi() {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" korinish="ikkilamchi" olcham="kichik" disabled={pending}>
      {pending ? "Yuklanmoqda…" : "Yuklash"}
    </Tugma>
  );
}

/**
 * Fayl biriktirish bloki.
 *
 * Alohida forma — sehrgarning asosiy formasi ichiga joylashtirib bo'lmaydi
 * (HTML formalarni ichma-ich qo'yishga ruxsat bermaydi).
 */
export function Biriktirmalar({
  muammoId,
  biriktirmalar,
  ruxsatEtilgan,
  maksimalHajmMatni,
}: {
  muammoId: string;
  biriktirmalar: Biriktirma[];
  ruxsatEtilgan: string[];
  maksimalHajmMatni: string;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(fayllarniYukla, {});
  const kiritish = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-xl border border-chegara bg-white p-5">
      <h2 className="font-medium text-matn">Namuna fayllarni biriktiring</h2>
      <p className="mt-1 text-sm leading-relaxed text-matn-ikkilamchi">
        Hozir ishlatayotgan Excel jadvalingiz, qog'oz blanka rasmi yoki jurnal
        skrinshoti — dasturchi uchun bu uch sahifa matndan ko'ra ko'proq narsani
        aytadi. Bu eng foydali qadam.
      </p>

      {biriktirmalar.length > 0 && (
        <ul className="mt-4 space-y-2">
          {biriktirmalar.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-chegara px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-matn">{b.fileName}</p>
                <p className="text-xs text-matn-uchinchi">{hajmMatni(b.size)}</p>
              </div>
              <form action={biriktirmaniOchir.bind(null, b.id)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md px-2 py-1 text-sm text-matn-ikkilamchi hover:bg-rose-50 hover:text-xato"
                >
                  O'chirish
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={amal} className="mt-4 space-y-3">
        <input type="hidden" name="muammoId" value={muammoId} />

        {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
        {holat.muvaffaqiyat && <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={kiritish}
            type="file"
            name="fayllar"
            multiple
            accept={ruxsatEtilgan.join(",")}
            className="block w-full max-w-md text-sm text-matn-ikkilamchi file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-matn hover:file:bg-slate-200"
          />
          <YuklashTugmasi />
        </div>

        <p className="text-xs text-matn-uchinchi">
          Ruxsat etilgan: {ruxsatEtilgan.join(", ")} · eng katta hajm {maksimalHajmMatni} ·
          ko'pi bilan 10 ta fayl
        </p>
      </form>
    </section>
  );
}
