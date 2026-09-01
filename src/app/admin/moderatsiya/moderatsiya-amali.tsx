"use client";

import { useActionState, useState } from "react";

import { muammoniArxivla, muammoniTiklash } from "../actions";
import { KattaMatn, Tugma, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

/**
 * Administratorning muammo ustidagi amali.
 *
 * Moderatsiya olib tashlangach bu yerda "tasdiqlash" yo'q — muammo
 * allaqachon omborda. Qoladigan amal bitta: nomaqbul yoki takroriy
 * yozuvni arxivga olish, va kerak bo'lsa qaytarish.
 */
export function ModeratsiyaAmali({
  muammoId,
  arxivdami,
}: {
  muammoId: string;
  arxivdami: boolean;
}) {
  const [arxivHolati, arxivAmali] = useActionState<AmalNatijasi, FormData>(
    muammoniArxivla,
    {}
  );
  const [tiklashHolati, tiklashAmali] = useActionState<AmalNatijasi, FormData>(
    muammoniTiklash,
    {}
  );
  const [formaKorinsin, setFormaKorinsin] = useState(false);

  if (arxivdami) {
    return (
      <div className="space-y-2">
        {tiklashHolati.xato && <Xabar turi="xato">{tiklashHolati.xato}</Xabar>}
        <form action={tiklashAmali}>
          <input type="hidden" name="muammoId" value={muammoId} />
          <Yuborish kutish="Qaytarilmoqda…" korinish="ikkilamchi" olcham="kichik">
            Arxivdan qaytarish
          </Yuborish>
        </form>
      </div>
    );
  }

  if (!formaKorinsin) {
    return (
      <div className="space-y-2">
        {arxivHolati.muvaffaqiyat && (
          <Xabar turi="muvaffaqiyat">{arxivHolati.muvaffaqiyat}</Xabar>
        )}
        <Tugma
          type="button"
          korinish="ikkilamchi"
          olcham="kichik"
          onClick={() => setFormaKorinsin(true)}
        >
          Arxivga olish
        </Tugma>
      </div>
    );
  }

  return (
    <form action={arxivAmali} className="space-y-2">
      <input type="hidden" name="muammoId" value={muammoId} />

      {arxivHolati.xato && <Xabar turi="xato">{arxivHolati.xato}</Xabar>}

      {/*
        Sabab majburiy va u rahbarga ko'rinadi. Sababsiz arxivlash
        rahbar uchun tushunarsiz bo'lardi: muammosi ombordan yo'qolgan,
        nega — noma'lum.
      */}
      <KattaMatn
        name="sabab"
        rows={2}
        required
        placeholder="Nega arxivga olinmoqda? Bu izoh rahbarga ko'rinadi."
        aria-label="Arxivlash sababi"
        aria-invalid={Boolean(arxivHolati.maydonXatolari?.sabab)}
      />
      {arxivHolati.maydonXatolari?.sabab && (
        <p className="text-sm font-medium text-xato" role="alert">
          {arxivHolati.maydonXatolari.sabab}
        </p>
      )}

      <div className="flex gap-2">
        <Yuborish kutish="Arxivlanmoqda…" korinish="xavfli" olcham="kichik">
          Arxivga olish
        </Yuborish>
        <Tugma
          type="button"
          korinish="shaffof"
          olcham="kichik"
          onClick={() => setFormaKorinsin(false)}
        >
          Bekor qilish
        </Tugma>
      </div>
    </form>
  );
}
