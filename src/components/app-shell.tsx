import Link from "next/link";

import { chiqishAmali } from "@/app/kirish/actions";
import { NavHavolalar, type Havola } from "@/components/nav-links";
import { ROL } from "@/lib/labels";
import type { JoriyFoydalanuvchi } from "@/lib/auth";

export type { Havola };

/**
 * Kirgan foydalanuvchilar uchun umumiy sahifa ramkasi:
 * yuqorida navigatsiya, o'ngda foydalanuvchi va chiqish tugmasi.
 */
export function AppShell({
  foydalanuvchi,
  havolalar = [],
  children,
}: {
  foydalanuvchi: JoriyFoydalanuvchi;
  havolalar?: Havola[];
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="chop-etilmasin border-b border-chegara bg-yuza">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/" className="shrink-0 font-semibold tracking-tight text-matn">
            Muammolar ombori
          </Link>

          {havolalar.length > 0 && (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Asosiy menyu">
              <NavHavolalar havolalar={havolalar} />
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-matn">
                {foydalanuvchi.fullName}
              </p>
              <p className="text-xs leading-tight text-matn-uchinchi">
                {foydalanuvchi.organizationName ?? ROL[foydalanuvchi.role]}
              </p>
            </div>
            <form action={chiqishAmali}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
              >
                Chiqish
              </button>
            </form>
          </div>
        </div>

        {havolalar.length > 0 && (
          <nav
            className="flex gap-1 overflow-x-auto border-t border-chegara px-4 py-2 sm:hidden"
            aria-label="Asosiy menyu"
          >
            <NavHavolalar havolalar={havolalar} mobil />
          </nav>
        )}
      </header>

      <main id="asosiy" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}

/** Sahifa sarlavhasi va o'ng tomonda amal tugmasi. */
export function SahifaSarlavhasi({
  sarlavha,
  izoh,
  amal,
}: {
  sarlavha: string;
  izoh?: string;
  amal?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-matn">{sarlavha}</h1>
        {izoh && <p className="mt-1 text-sm text-matn-ikkilamchi">{izoh}</p>}
      </div>
      {amal && <div className="shrink-0">{amal}</div>}
    </div>
  );
}
