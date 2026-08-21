import { chiqishAmali } from "@/app/kirish/actions";
import { MavzuTugmasi } from "@/components/mavzu";
import { YonPanel, type Havola } from "@/components/yon-panel";
import { ROL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { JoriyFoydalanuvchi } from "@/lib/auth";

export type { Havola };

/**
 * Kirgan foydalanuvchilar uchun umumiy sahifa ramkasi.
 *
 * Navigatsiya ilgari yuqori qatorda edi. Yon panelga o'tkazildi, chunki
 * bo'limlar soni o'sib bormoqda (administratorda oltita) va gorizontal
 * qatorda ular telefon ekranida siljitib ko'riladigan tasmaga aylanardi —
 * ya'ni bir vaqtning o'zida hamma bo'limni ko'rib bo'lmasdi. Chapdagi
 * ustunda esa ro'yxat vertikal o'sadi va joy yetadi.
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
  const poyloq = (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-matn">
            {foydalanuvchi.fullName}
          </p>
          <p className="truncate text-xs leading-tight text-matn-uchinchi">
            {foydalanuvchi.organizationName ?? ROL[foydalanuvchi.role]}
          </p>
        </div>
        <MavzuTugmasi className="shrink-0" />
      </div>

      <form action={chiqishAmali}>
        <button
          type="submit"
          className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
        >
          Chiqish
        </button>
      </form>
    </div>
  );

  const menyuBor = havolalar.length > 0;

  return (
    /*
      Chapdagi bo'shliq faqat yon panel mavjud bo'lganda qo'yiladi. Aks holda
      menyusiz ekranlar (masalan "arizangiz ko'rib chiqilmoqda") katta
      monitorda 256 piksel bo'sh joydan keyin boshlanardi.
    */
    <div className={cn("flex min-h-full w-full flex-col", menyuBor && "lg:pl-64")}>
      {menyuBor ? (
        <YonPanel
          havolalar={havolalar}
          poyloq={poyloq}
          mobilPoyloq={<MavzuTugmasi />}
        />
      ) : (
        /*
          Menyusiz ekranlar ham (masalan "arizangiz ko'rib chiqilmoqda")
          chiqish tugmasi va mavzu almashtirgichiga muhtoj — aks holda
          tasdiqlanmagan dasturchi tizimdan chiqa olmay qolardi.
        */
        <header className="chop-etilmasin flex h-14 items-center gap-3 border-b border-chegara bg-yuza px-4">
          <span className="font-semibold tracking-tight text-matn">
            Muammolar ombori
          </span>
          <div className="ml-auto flex items-center gap-1">
            <MavzuTugmasi />
            <form action={chiqishAmali}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-matn-ikkilamchi transition-colors hover:bg-yuza-2 hover:text-matn"
              >
                Chiqish
              </button>
            </form>
          </div>
        </header>
      )}

      {/*
        `min-w-0` — sirtdan keraksiz ko'rinadi, lekin usiz keng jadvallar
        sahifani kengaytirib yuboradi.

        Flex bolasining standart `min-width` qiymati `auto`, ya'ni u
        kontentidan tor bo'lishdan bosh tortadi. Jadval `overflow-x-auto`
        o'ram ichida bo'lsa ham, o'ramning o'zi shu sababli kengayib
        ketadi va siljish jadvalda emas, butun sahifada paydo bo'ladi —
        telefonda bu eng bezovta qiluvchi nuqson.
      */}
      <main
        id="asosiy"
        className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8"
      >
        {children}
      </main>
    </div>
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-matn">{sarlavha}</h1>
        {izoh && <p className="mt-1 text-sm text-matn-ikkilamchi">{izoh}</p>}
      </div>
      {amal && <div className="shrink-0">{amal}</div>}
    </div>
  );
}
