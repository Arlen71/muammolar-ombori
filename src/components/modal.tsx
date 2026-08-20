"use client";

import * as React from "react";

import { useOyna } from "@/components/oyna";
import { Tugma } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Modal oyna.
 *
 * Ochilish/yopilish mantig'i `useOyna` da — u tortma bilan bir xil.
 */
export function Modal({
  ochiq,
  yop,
  sarlavha,
  izoh,
  kenglik = "max-w-lg",
  children,
  poyloq,
}: {
  ochiq: boolean;
  yop: () => void;
  sarlavha: string;
  izoh?: React.ReactNode;
  /** Tailwind kenglik sinfi — keng formalar uchun `max-w-2xl` */
  kenglik?: string;
  children: React.ReactNode;
  /** Pastki qatordagi tugmalar */
  poyloq?: React.ReactNode;
}) {
  const { oyna, fondaBosildi } = useOyna(ochiq, yop);
  const sarlavhaId = React.useId();

  return (
    <dialog
      ref={oyna}
      onClick={fondaBosildi}
      aria-labelledby={sarlavhaId}
      className={cn(
        "oyna-markaz m-auto w-[calc(100vw-2rem)] rounded-xl border border-chegara bg-yuza p-0 text-matn shadow-3",
        "max-h-[calc(100dvh-4rem)]",
        kenglik
      )}
    >
      <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-chegara px-5 py-4">
          <div className="min-w-0">
            <h2 id={sarlavhaId} className="text-base font-semibold text-matn">
              {sarlavha}
            </h2>
            {izoh && <p className="mt-0.5 text-sm text-matn-ikkilamchi">{izoh}</p>}
          </div>
          <button
            type="button"
            onClick={yop}
            aria-label="Yopish"
            className="-mr-1.5 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
          >
            <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {poyloq && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-chegara bg-yuza-2 px-5 py-3">
            {poyloq}
          </div>
        )}
      </div>
    </dialog>
  );
}

/**
 * Tugma + modal bitta komponentda.
 *
 * `children` — funksiya: unga modalni yopadigan `yop` beriladi, shunda forma
 * muvaffaqiyatli yakunlangach oynani o'zi yopa oladi.
 */
export function ModalOchgich({
  yorliq,
  sarlavha,
  izoh,
  kenglik,
  korinish = "asosiy",
  olcham = "orta",
  children,
}: {
  yorliq: React.ReactNode;
  sarlavha: string;
  izoh?: React.ReactNode;
  kenglik?: string;
  korinish?: React.ComponentProps<typeof Tugma>["korinish"];
  olcham?: React.ComponentProps<typeof Tugma>["olcham"];
  children: (yop: () => void) => React.ReactNode;
}) {
  const [ochiq, ochiqQil] = React.useState(false);
  const yop = React.useCallback(() => ochiqQil(false), []);

  return (
    <>
      <Tugma type="button" korinish={korinish} olcham={olcham} onClick={() => ochiqQil(true)}>
        {yorliq}
      </Tugma>
      <Modal ochiq={ochiq} yop={yop} sarlavha={sarlavha} izoh={izoh} kenglik={kenglik}>
        {children(yop)}
      </Modal>
    </>
  );
}
