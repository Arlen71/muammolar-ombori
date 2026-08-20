import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Interfeysning asosiy g'ishtlari.
 *
 * Tayyor komponent kutubxonasi o'rniga o'zimiznikini yozdik: kerak bo'lgani
 * bir hovuch element, ular hammasi shu faylda va tashqi bog'liqlik yo'q.
 * Davlat loyihasida bu auditni ham, qo'llab-quvvatlashni ham osonlashtiradi.
 *
 * IKKI QOIDA
 *
 *   1. Bu fayl **server komponenti bo'lib qoladi** — hech qanday hook yo'q.
 *      Hook kerak bo'lganda alohida `"use client"` fayl ochiladi
 *      (`yuborish.tsx`, `modal.tsx`). Aks holda `Quti` ni import qilgan har
 *      bir sahifa keraksiz JavaScript yuklab olardi.
 *   2. Xom rang yozilmaydi — faqat `globals.css` dagi semantik tokenlar.
 *      Shu tufayli qorong'i mavzu bu faylga tegmasdan ishlaydi.
 */

// ─── Tugma ───────────────────────────────────────────────────────────

type TugmaKorinishi = "asosiy" | "ikkilamchi" | "xavfli" | "shaffof";
type TugmaOlchami = "kichik" | "orta" | "katta";

/*
  `text-yuza` — kartochka foni matn rangi sifatida. To'ldirilgan tugmada
  ataylab shunday: yorug' mavzuda fon quyuq / matn oq, qorong'i mavzuda esa
  fon och / matn quyuq bo'ladi. Ya'ni bitta sinf ikkala mavzuda ham kontrast
  beradi va `dark:` variantiga hojat qolmaydi.
*/
const TUGMA_KORINISHI: Record<TugmaKorinishi, string> = {
  asosiy:
    "bg-asosiy text-asosiy-matn hover:bg-asosiy-quyuq " +
    "disabled:bg-yuza-3 disabled:text-matn-uchinchi",
  ikkilamchi:
    "bg-yuza text-matn ring-1 ring-inset ring-chegara hover:bg-yuza-2 " +
    "disabled:text-matn-uchinchi",
  xavfli: "bg-xato text-yuza hover:opacity-90 disabled:bg-yuza-3 disabled:text-matn-uchinchi",
  shaffof: "bg-transparent text-matn-ikkilamchi hover:bg-yuza-2 hover:text-matn",
};

const TUGMA_OLCHAMI: Record<TugmaOlchami, string> = {
  // 44px balandlik — sensorli ekranda barmoq bilan bosish uchun eng kam o'lcham
  kichik: "h-9 px-3 text-sm gap-1.5",
  orta: "h-11 px-4 text-sm gap-2",
  katta: "h-12 px-6 text-base gap-2",
};

export function Tugma({
  korinish = "asosiy",
  olcham = "orta",
  className,
  ...props
}: React.ComponentProps<"button"> & {
  korinish?: TugmaKorinishi;
  olcham?: TugmaOlchami;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed",
        TUGMA_KORINISHI[korinish],
        TUGMA_OLCHAMI[olcham],
        className
      )}
      {...props}
    />
  );
}

// ─── Kiritish maydonlari ─────────────────────────────────────────────

/*
  `chegara-kuchli` — `chegara` emas. Forma maydonining konturi fondan kamida
  3:1 ajralishi kerak (WCAG 1.4.11): aks holda maydon qayerda boshlanib
  qayerda tugashi ko'rinmaydi. Kartochka konturi bezak, unga bu talab tegmaydi.
*/
const MAYDON_ASOSI =
  "w-full rounded-lg border border-chegara-kuchli bg-yuza px-3 text-matn placeholder:text-matn-uchinchi " +
  "transition-colors focus:border-asosiy focus:outline-none focus:ring-2 focus:ring-asosiy/25 " +
  "disabled:bg-yuza-2 disabled:text-matn-uchinchi " +
  "aria-[invalid=true]:border-xato aria-[invalid=true]:ring-xato/25";

export function Kiritish({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(MAYDON_ASOSI, "h-11", className)} {...props} />;
}

export function KattaMatn({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(MAYDON_ASOSI, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />
  );
}

export function Tanlov({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(MAYDON_ASOSI, "h-11 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

// ─── Maydon o'ramasi: yorliq + izoh + xato ───────────────────────────

export function Maydon({
  yorliq,
  izoh,
  namuna,
  xato,
  majburiy,
  htmlFor,
  children,
  className,
}: {
  yorliq: string;
  /** Savolni tushuntiruvchi qisqa izoh */
  izoh?: React.ReactNode;
  /** To'ldirilgan namuna javob — rahbarlarga nima yozishni ko'rsatadi */
  namuna?: string;
  xato?: string;
  majburiy?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-matn">
        {yorliq}
        {majburiy && (
          <span className="ml-1 text-xato" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {izoh && <p className="text-sm text-matn-ikkilamchi">{izoh}</p>}
      {children}
      {namuna && (
        <p className="text-xs text-matn-uchinchi">
          <span className="font-medium">Namuna:</span> {namuna}
        </p>
      )}
      {xato && (
        <p className="text-sm font-medium text-xato" role="alert">
          {xato}
        </p>
      )}
    </div>
  );
}

// ─── Nishoncha ───────────────────────────────────────────────────────

export function Nishoncha({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        "bg-yuza-2 text-matn-ikkilamchi ring-chegara",
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Qutilar ─────────────────────────────────────────────────────────

export function Quti({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-chegara bg-yuza p-5 shadow-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Kartochka sarlavhasi: chapda nom va izoh, o'ngda amal tugmasi.
 *
 * Ilgari har bir sahifa buni o'zicha yozardi va oraliqlar bir-biriga
 * to'g'ri kelmasdi.
 */
export function QutiSarlavha({
  sarlavha,
  izoh,
  amal,
  className,
}: {
  sarlavha: React.ReactNode;
  izoh?: React.ReactNode;
  amal?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-matn">{sarlavha}</h2>
        {izoh && <p className="mt-0.5 text-sm text-matn-ikkilamchi">{izoh}</p>}
      </div>
      {amal && <div className="shrink-0">{amal}</div>}
    </div>
  );
}

type XabarTuri = "malumot" | "muvaffaqiyat" | "ogohlantirish" | "xato";

const XABAR_USLUBI: Record<XabarTuri, string> = {
  malumot: "bg-malumot-yuza text-malumot ring-malumot-chegara",
  muvaffaqiyat: "bg-muvaffaqiyat-yuza text-muvaffaqiyat ring-muvaffaqiyat-chegara",
  ogohlantirish: "bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara",
  xato: "bg-xato-yuza text-xato ring-xato-chegara",
};

export function Xabar({
  turi = "malumot",
  sarlavha,
  children,
  className,
}: {
  turi?: XabarTuri;
  sarlavha?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={turi === "xato" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-4 py-3 text-sm ring-1 ring-inset",
        XABAR_USLUBI[turi],
        className
      )}
    >
      {sarlavha && <p className="font-semibold">{sarlavha}</p>}
      {children}
    </div>
  );
}

// ─── KPI kartochkasi ─────────────────────────────────────────────────

/**
 * Boshqaruv panelidagi bitta raqam.
 *
 * Tuzilishi ataylab qat'iy: yorliq tepada kichik, raqam pastda yirik.
 * Teskarisi bo'lsa ko'z avval raqamni emas, matnni o'qiydi va bir qatorda
 * turgan to'rtta kartochkani solishtirish qiyinlashadi.
 */
export function KPIKartochka({
  yorliq,
  qiymat,
  izoh,
  belgi,
  havola,
  className,
}: {
  yorliq: string;
  qiymat: React.ReactNode;
  izoh?: React.ReactNode;
  /** Chap tomondagi ikonka (ixtiyoriy) */
  belgi?: React.ReactNode;
  /** Kartochka o'ng burchagidagi havola yoki tugma */
  havola?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-chegara bg-yuza px-5 py-4 shadow-1",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {belgi && <span className="shrink-0 text-matn-uchinchi">{belgi}</span>}
          <p className="truncate text-sm text-matn-ikkilamchi">{yorliq}</p>
        </div>
        {havola}
      </div>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-matn">
        {qiymat}
      </p>
      {izoh && <p className="mt-1 text-xs text-matn-uchinchi">{izoh}</p>}
    </div>
  );
}

// ─── Jadval ──────────────────────────────────────────────────────────

/**
 * Jadval o'z ichida gorizontal siljiydi.
 *
 * Sahifaning o'zi hech qachon yon tomonga siljimasligi kerak — telefonda bu
 * eng bezovta qiluvchi nuqson. Shuning uchun `overflow-x-auto` aynan shu
 * o'ramda turadi.
 */
export function Jadval({
  className,
  children,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-chegara bg-yuza shadow-1">
      <table className={cn("w-full min-w-[40rem] border-collapse text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function JadvalBosh({ className, children, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead className={cn("bg-yuza-2", className)} {...props}>
      {children}
    </thead>
  );
}

export function JadvalTana({ className, children, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody className={cn("divide-y divide-chegara", className)} {...props}>
      {children}
    </tbody>
  );
}

export function JadvalQator({ className, children, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("transition-colors hover:bg-yuza-2/70", className)} {...props}>
      {children}
    </tr>
  );
}

export function JadvalSarlavha({
  className,
  children,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-matn-ikkilamchi",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function JadvalKatak({ className, children, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("px-4 py-3 align-middle text-matn", className)} {...props}>
      {children}
    </td>
  );
}

// ─── Skelet (yuklanayotgan holat) ────────────────────────────────────

/**
 * Yuklanayotgan joyni band qilib turadi.
 *
 * Vazifasi — kontent kelganda sahifa sakramasligi. Shuning uchun skelet
 * o'lchami real element o'lchamiga yaqin bo'lishi kerak.
 */
export function Skelet({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-yuza-3", className)}
    />
  );
}

/** Jadval yuklanayotganda ko'rsatiladigan qatorlar. */
export function SkeletJadval({ qatorlar = 5 }: { qatorlar?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-chegara bg-yuza shadow-1">
      <div className="border-b border-chegara bg-yuza-2 px-4 py-3">
        <Skelet className="h-4 w-40" />
      </div>
      <div className="divide-y divide-chegara">
        {Array.from({ length: qatorlar }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skelet className="h-4 flex-1" />
            <Skelet className="h-4 w-24 shrink-0" />
            <Skelet className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
      <span className="faqat-oquvchi" role="status">
        Yuklanmoqda
      </span>
    </div>
  );
}

// ─── Bo'sh holat ─────────────────────────────────────────────────────

export function BoshHolat({
  sarlavha,
  izoh,
  amal,
}: {
  sarlavha: string;
  izoh?: string;
  amal?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-chegara bg-yuza px-6 py-14 text-center">
      <p className="text-base font-medium text-matn">{sarlavha}</p>
      {izoh && <p className="mx-auto mt-1.5 max-w-md text-sm text-matn-ikkilamchi">{izoh}</p>}
      {amal && <div className="mt-5 flex justify-center">{amal}</div>}
    </div>
  );
}
