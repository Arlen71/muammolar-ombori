"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Copy,
  FolderOpen,
  Gauge,
  Handshake,
  LayoutList,
  Menu,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useOyna } from "@/components/oyna";
import { cn } from "@/lib/utils";

/** Menyu havolasi. `belgi` — ikonka nomi, komponent emas: u serverdan keladi. */
export type Havola = { yol: string; matn: string; belgi?: BelgiNomi };

export type BelgiNomi =
  | "boshqaruv"
  | "royxat"
  | "ombor"
  | "moderatsiya"
  | "dublikat"
  | "dasturchilar"
  | "tashkilotlar"
  | "foydalanuvchilar"
  | "qollab";

/*
  Ikonka komponentini serverdan client'ga prop sifatida uzatib bo'lmaydi —
  funksiya seriyalanmaydi. Shuning uchun layout faqat nom beradi, xarita
  esa shu yerda, brauzer tomonida.
*/
const BELGILAR: Record<BelgiNomi, LucideIcon> = {
  boshqaruv: Gauge,
  royxat: LayoutList,
  ombor: FolderOpen,
  moderatsiya: ShieldCheck,
  dublikat: Copy,
  dasturchilar: Users,
  tashkilotlar: Building2,
  foydalanuvchilar: Users,
  qollab: Handshake,
};

function faolmi(joriy: string, yol: string): boolean {
  return joriy === yol || (yol !== "/" && joriy.startsWith(`${yol}/`));
}

function Havolalar({ havolalar, yop }: { havolalar: Havola[]; yop?: () => void }) {
  const joriy = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Asosiy menyu">
      {havolalar.map((h) => {
        const faol = faolmi(joriy, h.yol);
        const Belgi = h.belgi ? BELGILAR[h.belgi] : null;

        return (
          <Link
            key={h.yol}
            href={h.yol}
            onClick={yop}
            aria-current={faol ? "page" : undefined}
            className={cn(
              // 44px balandlik — sensorli ekranda eng kam nishon o'lchami
              "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              faol
                ? "bg-asosiy-ochiq text-asosiy"
                : "text-matn-ikkilamchi hover:bg-yuza-2 hover:text-matn"
            )}
          >
            {Belgi && <Belgi size={18} className="shrink-0" aria-hidden="true" />}
            <span className="min-w-0 flex-1">{h.matn}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Panel ichi — desktopdagi ustunda ham, mobil tortmada ham bir xil. */
function PanelIchi({
  havolalar,
  poyloq,
  yop,
}: {
  havolalar: Havola[];
  poyloq: React.ReactNode;
  yop?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          href="/"
          onClick={yop}
          className="truncate font-semibold tracking-tight text-matn"
        >
          Muammolar ombori
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <Havolalar havolalar={havolalar} yop={yop} />
      </div>

      <div className="shrink-0 border-t border-chegara p-3">{poyloq}</div>
    </>
  );
}

/**
 * Yon panel.
 *
 * Katta ekranda — chapda doim turadigan ustun. Kichik ekranda u tortmaga
 * aylanadi va yuqoridagi tugma bilan ochiladi.
 *
 * Tortma `<dialog>` ustiga qurilgan: shunda fokus panel ichida qoladi,
 * `Esc` ishlaydi va orqa fon ekran o'quvchidan yashiriladi. Bularsiz
 * klaviatura bilan ishlaydigan foydalanuvchi ochiq tortmadan chiqib,
 * ko'rinmayotgan sahifa bo'ylab yurib ketardi.
 */
export function YonPanel({
  havolalar,
  poyloq,
  mobilPoyloq,
}: {
  havolalar: Havola[];
  poyloq: React.ReactNode;
  /** Tortma tepasidagi qism (mavzu tugmasi) */
  mobilPoyloq?: React.ReactNode;
}) {
  const [ochiq, ochiqQil] = React.useState(false);
  const yol = usePathname();

  const yop = React.useCallback(() => ochiqQil(false), []);
  const { oyna: tortma, fondaBosildi } = useOyna(ochiq, yop);

  /*
    Sahifa almashsa tortma yopiladi — aks holda u yangi sahifa ustida
    qolardi (masalan brauzerning "orqaga" tugmasidan keyin).

    Bu effektda emas, render paytida qilinadi: React'ning "prop o'zgarganda
    holatni tiklash" usuli. Effekt ishlatilsa, sahifa avval tortma ochiq
    holda bir marta chiziladi, keyin yopiq holda yana bir marta — ya'ni
    ko'z ilg'aydigan miltillash paydo bo'ladi.
  */
  const [oxirgiYol, oxirgiYolniYoz] = React.useState(yol);
  if (yol !== oxirgiYol) {
    oxirgiYolniYoz(yol);
    ochiqQil(false);
  }

  return (
    <>
      {/* ── Doimiy ustun: faqat katta ekranda ── */}
      <aside className="chop-etilmasin fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-chegara bg-yuza lg:flex">
        <PanelIchi havolalar={havolalar} poyloq={poyloq} />
      </aside>

      {/* ── Kichik ekrandagi yuqori qator ── */}
      <header className="chop-etilmasin sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-chegara bg-yuza px-3 lg:hidden">
        <button
          type="button"
          onClick={() => ochiqQil(true)}
          aria-label="Menyuni ochish"
          aria-expanded={ochiq}
          className="inline-flex size-11 items-center justify-center rounded-lg text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Link href="/" className="truncate font-semibold tracking-tight text-matn">
          Muammolar ombori
        </Link>

        <div className="ml-auto">{mobilPoyloq}</div>
      </header>

      {/* ── Tortma ── */}
      <dialog
        ref={tortma}
        onClick={fondaBosildi}
        aria-label="Menyu"
        className="oyna-chap m-0 h-full max-h-none w-72 max-w-[85vw] border-r border-chegara bg-yuza p-0 text-matn shadow-3 lg:hidden"
      >
        <div className="relative flex h-full flex-col">
          <button
            type="button"
            onClick={yop}
            aria-label="Menyuni yopish"
            className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-lg text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <PanelIchi havolalar={havolalar} poyloq={poyloq} yop={yop} />
        </div>
      </dialog>
    </>
  );
}
