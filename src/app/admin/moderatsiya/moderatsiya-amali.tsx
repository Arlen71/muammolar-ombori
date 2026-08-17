"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { muammoniRadEt, muammoniTasdiqla } from "../actions";
import { KattaMatn, Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function Yuborish({
  matn,
  kutish,
  korinish,
}: {
  matn: string;
  kutish: string;
  korinish?: "asosiy" | "xavfli";
}) {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" korinish={korinish} olcham="kichik" disabled={pending}>
      {pending ? kutish : matn}
    </Tugma>
  );
}

export function ModeratsiyaAmali({ muammoId }: { muammoId: string }) {
  const [tasdiqHolati, tasdiqAmali] = useActionState<AmalNatijasi, FormData>(
    muammoniTasdiqla,
    {}
  );
  const [radHolati, radAmali] = useActionState<AmalNatijasi, FormData>(muammoniRadEt, {});
  const [radKorinsin, setRadKorinsin] = useState(false);

  if (tasdiqHolati.muvaffaqiyat) {
    return <Xabar turi="muvaffaqiyat">{tasdiqHolati.muvaffaqiyat}</Xabar>;
  }
  if (radHolati.muvaffaqiyat) {
    return <Xabar turi="malumot">{radHolati.muvaffaqiyat}</Xabar>;
  }

  return (
    <div className="space-y-3">
      {tasdiqHolati.xato && <Xabar turi="xato">{tasdiqHolati.xato}</Xabar>}
      {radHolati.xato && <Xabar turi="xato">{radHolati.xato}</Xabar>}

      {radKorinsin ? (
        <form action={radAmali} className="space-y-2">
          <input type="hidden" name="muammoId" value={muammoId} />
          <KattaMatn
            name="sabab"
            rows={2}
            required
            placeholder="Nima yetishmayapti? Rahbar nimani tuzatishi kerak?"
          />
          <div className="flex gap-2">
            <Yuborish matn="Rad etib qaytarish" kutish="Yuborilmoqda…" korinish="xavfli" />
            <Tugma
              type="button"
              korinish="shaffof"
              olcham="kichik"
              onClick={() => setRadKorinsin(false)}
            >
              Bekor qilish
            </Tugma>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <form action={tasdiqAmali}>
            <input type="hidden" name="muammoId" value={muammoId} />
            <Yuborish matn="Tasdiqlash va omborga qo'shish" kutish="Tasdiqlanmoqda…" />
          </form>
          <Tugma
            type="button"
            korinish="ikkilamchi"
            olcham="kichik"
            onClick={() => setRadKorinsin(true)}
          >
            Rahbarga qaytarish
          </Tugma>
        </div>
      )}
    </div>
  );
}
