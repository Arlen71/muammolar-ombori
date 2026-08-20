"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type Havola = { yol: string; matn: string };

/** Joriy sahifani belgilab turuvchi navigatsiya. */
export function NavHavolalar({
  havolalar,
  mobil = false,
}: {
  havolalar: Havola[];
  mobil?: boolean;
}) {
  const yol = usePathname();

  return (
    <>
      {havolalar.map((h) => {
        const faol = yol === h.yol || (h.yol !== "/" && yol.startsWith(`${h.yol}/`));
        return (
          <Link
            key={h.yol}
            href={h.yol}
            aria-current={faol ? "page" : undefined}
            className={cn(
              "rounded-lg font-medium transition-colors",
              mobil ? "shrink-0 px-3 py-1.5 text-sm" : "px-3 py-2 text-sm",
              faol
                ? "bg-asosiy-ochiq text-asosiy"
                : "text-matn-ikkilamchi hover:bg-yuza-2 hover:text-matn"
            )}
          >
            {h.matn}
          </Link>
        );
      })}
    </>
  );
}
