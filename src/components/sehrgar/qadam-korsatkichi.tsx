import Link from "next/link";

import { QADAMLAR, QADAM_NOMLARI, type QadamRaqami } from "@/lib/problem-schema";
import { cn } from "@/lib/utils";

/** Sehrgarning yuqorisidagi 5 qadamli ko'rsatkich. */
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
    <nav aria-label="Qadamlar" className="mb-8">
      <ol className="flex items-center gap-1 sm:gap-2">
        {QADAMLAR.map((q, i) => {
          const faol = q === joriy;
          const tayyor = tugallangan.has(q);
          return (
            <li key={q} className="flex flex-1 items-center gap-1 sm:gap-2">
              <Link
                href={`/rahbar/muammo/${muammoId}/${q}`}
                aria-current={faol ? "step" : undefined}
                className="group flex min-w-0 flex-1 flex-col gap-1.5"
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    faol
                      ? "bg-asosiy"
                      : tayyor
                        ? "bg-emerald-500"
                        : "bg-slate-200 group-hover:bg-slate-300"
                  )}
                />
                <span
                  className={cn(
                    "truncate text-xs",
                    faol ? "font-medium text-asosiy" : "text-matn-uchinchi"
                  )}
                >
                  <span className="tabular-nums">{q}.</span>{" "}
                  <span className="hidden sm:inline">{QADAM_NOMLARI[q].qisqa}</span>
                </span>
              </Link>
              {i < QADAMLAR.length - 1 && <span className="sr-only">keyin</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
