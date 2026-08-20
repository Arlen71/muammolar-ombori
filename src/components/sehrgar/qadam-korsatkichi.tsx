import Link from "next/link";
import { Check } from "lucide-react";

import { QADAMLAR, QADAM_NOMLARI, type QadamRaqami } from "@/lib/problem-schema";
import { cn } from "@/lib/utils";

/**
 * Sehrgarning yuqorisidagi 5 qadamli ko'rsatkich.
 *
 * Rahbar bu formani ~15 daqiqada to'ldiradi va o'rtada to'xtab, keyin
 * qaytishi mumkin. Shuning uchun ko'rsatkich uchta savolga bir qarashda
 * javob berishi kerak: qayerdaman, nimani tugatdim, yana qancha qoldi.
 *
 * Ilgari bu faqat ingichka rangli chiziq edi — tugallangan qadam
 * tugallanmaganidan atigi rang bilan farq qilardi. Rang ko'rmaydigan
 * odam uchun bu hech qanday ma'lumot bermasdi (WCAG 1.4.1: ma'no faqat
 * rang bilan berilmasin). Endi tugallangan qadamda belgi turadi.
 */
export function QadamKorsatkichi({
  muammoId,
  joriy,
  tugallangan,
}: {
  muammoId: string;
  joriy: QadamRaqami;
  /** Qaysi qadamlar to'liq to'ldirilgan */
  tugallangan: Set<number>;
}) {
  return (
    <nav aria-label="Qadamlar" className="mb-6">
      <ol className="flex gap-1.5 sm:gap-2">
        {QADAMLAR.map((q) => {
          const faol = q === joriy;
          const tayyor = tugallangan.has(q);

          return (
            <li key={q} className="min-w-0 flex-1">
              <Link
                href={`/rahbar/muammo/${muammoId}/${q}`}
                aria-current={faol ? "step" : undefined}
                className="group flex flex-col gap-2 rounded-lg py-1"
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    faol
                      ? "bg-asosiy"
                      : tayyor
                        ? "bg-muvaffaqiyat"
                        : "bg-yuza-3 group-hover:bg-chegara-kuchli"
                  )}
                />

                <span className="flex min-w-0 items-center gap-1.5">
                  {/*
                    Raqam yoki belgi — 20px doira. Tugallangan qadamda
                    belgi turadi, ya'ni holat rangsiz ham o'qiladi.
                  */}
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                      faol
                        ? "bg-asosiy text-asosiy-matn"
                        : tayyor
                          ? "bg-muvaffaqiyat text-yuza"
                          : "bg-yuza-3 text-matn-ikkilamchi"
                    )}
                  >
                    {tayyor && !faol ? (
                      <>
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                        <span className="sr-only">tugallandi</span>
                      </>
                    ) : (
                      q
                    )}
                  </span>

                  <span
                    className={cn(
                      "hidden truncate text-xs sm:inline",
                      faol ? "font-medium text-matn" : "text-matn-ikkilamchi"
                    )}
                  >
                    {QADAM_NOMLARI[q].qisqa}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
