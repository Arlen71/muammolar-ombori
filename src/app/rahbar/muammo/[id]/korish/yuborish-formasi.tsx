"use client";

import { useActionState } from "react";

import { muammoniYubor, qoralamaniOchir } from "@/app/rahbar/actions";
import { Tugma, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

export function YuborishFormasi({
  muammoId,
  tayyor,
  qoralamami,
}: {
  muammoId: string;
  /** Barcha qadamlar to'ldirilganmi */
  tayyor: boolean;
  qoralamami: boolean;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(muammoniYubor, {});

  return (
    <div className="space-y-4">
      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}

      {!tayyor && (
        <Xabar turi="ogohlantirish" sarlavha="Kartochka hali to'liq emas">
          Yuborishdan oldin barcha majburiy maydonlarni to'ldiring. Yuqoridagi
          qadamlar ko'rsatkichida qaysi qadam qolganini ko'rishingiz mumkin.
        </Xabar>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <form action={amal}>
          <input type="hidden" name="muammoId" value={muammoId} />
          <Yuborish kutish="Yuborilmoqda…" olcham="katta" disabled={!tayyor}>
            Moderatsiyaga yuborish
          </Yuborish>
        </form>

        {qoralamami && (
          <form
            action={qoralamaniOchir}
            onSubmit={(e) => {
              if (!confirm("Qoralama butunlay o'chiriladi. Davom etasizmi?")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="muammoId" value={muammoId} />
            <Tugma type="submit" korinish="shaffof">
              Qoralamani o'chirish
            </Tugma>
          </form>
        )}
      </div>
    </div>
  );
}
