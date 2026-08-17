import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Interfeysning asosiy g'ishtlari.
 *
 * Tayyor komponent kutubxonasi o'rniga o'zimiznikini yozdik: kerak bo'lgani
 * atigi 8 ta element, ular hammasi shu faylda va tashqi bog'liqlik yo'q.
 * Davlat loyihasida bu auditni ham, qo'llab-quvvatlashni ham osonlashtiradi.
 */

// ─── Tugma ───────────────────────────────────────────────────────────

type TugmaKorinishi = "asosiy" | "ikkilamchi" | "xavfli" | "shaffof";
type TugmaOlchami = "kichik" | "orta" | "katta";

const TUGMA_KORINISHI: Record<TugmaKorinishi, string> = {
  asosiy:
    "bg-asosiy text-white hover:bg-asosiy-quyuq disabled:bg-slate-300 disabled:text-slate-500",
  ikkilamchi:
    "bg-white text-matn ring-1 ring-chegara hover:bg-slate-50 disabled:text-slate-400",
  xavfli: "bg-xato text-white hover:bg-rose-800 disabled:bg-slate-300",
  shaffof: "bg-transparent text-matn-ikkilamchi hover:bg-slate-100 hover:text-matn",
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

const MAYDON_ASOSI =
  "w-full rounded-lg border border-chegara bg-white px-3 text-matn placeholder:text-matn-uchinchi " +
  "transition-colors focus:border-asosiy focus:outline-none focus:ring-2 focus:ring-asosiy/20 " +
  "disabled:bg-slate-50 disabled:text-matn-uchinchi " +
  "aria-[invalid=true]:border-xato aria-[invalid=true]:ring-xato/20";

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
        "bg-slate-100 text-slate-700 ring-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Qutilar ─────────────────────────────────────────────────────────

export function Quti({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-chegara bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type XabarTuri = "malumot" | "muvaffaqiyat" | "ogohlantirish" | "xato";

const XABAR_USLUBI: Record<XabarTuri, string> = {
  malumot: "bg-asosiy-ochiq text-asosiy-quyuq ring-blue-200",
  muvaffaqiyat: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ogohlantirish: "bg-amber-50 text-amber-900 ring-amber-200",
  xato: "bg-rose-50 text-rose-800 ring-rose-200",
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
    <div className="rounded-xl border border-dashed border-chegara bg-white px-6 py-14 text-center">
      <p className="text-base font-medium text-matn">{sarlavha}</p>
      {izoh && <p className="mx-auto mt-1.5 max-w-md text-sm text-matn-ikkilamchi">{izoh}</p>}
      {amal && <div className="mt-5 flex justify-center">{amal}</div>}
    </div>
  );
}
