"use client";

import * as React from "react";

import { Tugma } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Modal oyna.
 *
 * Brauzerning o'z `<dialog>` elementi ustiga qurilgan. Sabab: `showModal()`
 * fokusni oyna ichida ushlab turadi, `Esc` ni o'zi qayta ishlaydi, orqa
 * fondagi kontentni ekran o'quvchidan yashiradi va elementni top-layer'ga
 * chiqaradi — ya'ni `z-index` bilan kurashish kerak emas. Bularning
 * hammasini qo'lda yozganda odatda kamida bittasi unutiladi.
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
  const oyna = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = oyna.current;
    if (!el) return;

    if (ochiq && !el.open) el.showModal();
    if (!ochiq && el.open) el.close();
  }, [ochiq]);

  // Orqadagi sahifa siljib ketmasligi uchun — `showModal()` buni o'zi qilmaydi
  React.useEffect(() => {
    if (!ochiq) return;
    const oldingi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldingi;
    };
  }, [ochiq]);

  /*
    Fon bosilganda yopiladi. `<dialog>` da fon — elementning o'zi, shuning
    uchun bosilgan nishon aynan dialog bo'lsa, demak kontentdan tashqari
    joy bosilgan.
  */
  function fondaBosildi(hodisa: React.MouseEvent<HTMLDialogElement>) {
    if (hodisa.target === oyna.current) yop();
  }

  return (
    <dialog
      ref={oyna}
      onClose={yop}
      onClick={fondaBosildi}
      aria-labelledby="modal-sarlavha"
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-xl border border-chegara bg-yuza p-0 text-matn shadow-3",
        "max-h-[calc(100dvh-4rem)] overflow-visible",
        kenglik
      )}
    >
      <div className="flex max-h-[calc(100dvh-4rem)] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-chegara px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-sarlavha" className="text-base font-semibold text-matn">
              {sarlavha}
            </h2>
            {izoh && <p className="mt-0.5 text-sm text-matn-ikkilamchi">{izoh}</p>}
          </div>
          <button
            type="button"
            onClick={yop}
            aria-label="Yopish"
            className="-mr-1.5 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
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
