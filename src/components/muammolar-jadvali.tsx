import Link from "next/link";

import {
  Jadval,
  JadvalBosh,
  JadvalKatak,
  JadvalQator,
  JadvalSarlavha,
  JadvalTana,
  Nishoncha,
} from "@/components/ui";
import {
  MUAMMO_HOLATI,
  MUAMMO_HOLATI_RANGI,
  SHOSHILINCHLIK,
  SHOSHILINCHLIK_RANGI,
  sonMatni,
} from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { ProblemStatus, Urgency } from "@/generated/prisma/enums";

/**
 * Muammolar ro'yxati.
 *
 * Katta ekranda jadval, kichik ekranda kartochkalar. Ikkalasi bitta
 * komponentda: aks holda ustun qo'shilganda uni ikki joyda o'zgartirish
 * kerak bo'ladi va vaqt o'tib ular bir-biridan uzoqlashadi.
 *
 * Nega jadval: dasturchi ham, rahbar ham ro'yxatni **solishtirish** uchun
 * ochadi — qaysi muammo ko'proq vaqt yeyapti, qaysinisi ko'proq tashkilotda
 * uchraydi. Kartochkada raqamlar har xil joyda turadi va ko'z ular bo'ylab
 * yurishi kerak; jadvalda ular bitta ustunda tik saf tortadi.
 *
 * Telefonda esa jadval o'z ma'nosini yo'qotadi — beshta ustun ekranga
 * sig'maydi va gorizontal siljish boshlanadi. Shuning uchun u yerda
 * kartochka qoladi.
 */

export type JadvalMuammosi = {
  id: string;
  refCode: string;
  title: string;
  status: ProblemStatus;
  urgency: Urgency;
  monthlyHoursLost: number;
  citizensAffected?: number | null;
  category?: { name: string } | null;
  organization?: { name: string; district: string | null } | null;
  _count?: { supporters?: number; attachments?: number } | null;
  assignments?: { developer: { fullName: string } }[];
};

export type Ustun =
  | "holat"
  | "shoshilinchlik"
  | "tashkilot"
  | "soha"
  | "yoqotish"
  | "qollab"
  | "fuqaro"
  | "olgan";

type UstunTavsifi = {
  sarlavha: string;
  /** Raqamli ustunlar o'ngga tekislanadi — shunda razryadlar ustma-ust tushadi */
  ongga?: boolean;
  /**
   * Ustunning eng katta kengligi.
   *
   * Faqat uzun matn tushadigan ustunlarga qo'yiladi. Hammasiga qo'yib
   * bo'lmaydi: avtomatik joylashuvda `max-width` qisqa matnli ustunni ham
   * o'sha o'lchamga kengaytirib yuboradi va jadval ekrandan chiqib ketadi.
   */
  kenglik?: string;
  hujayra: (m: JadvalMuammosi) => React.ReactNode;
};

/** Qo'llab-quvvatlovchilar soni: muammo egasi + qo'shilganlar. */
function tashkilotSoni(m: JadvalMuammosi): number {
  return (m._count?.supporters ?? 0) + 1;
}

const USTUNLAR: Record<Ustun, UstunTavsifi> = {
  holat: {
    sarlavha: "Holat",
    hujayra: (m) => (
      <Nishoncha className={MUAMMO_HOLATI_RANGI[m.status]}>
        {MUAMMO_HOLATI[m.status]}
      </Nishoncha>
    ),
  },
  shoshilinchlik: {
    sarlavha: "Shoshilinchlik",
    hujayra: (m) => (
      <Nishoncha className={SHOSHILINCHLIK_RANGI[m.urgency]}>
        {SHOSHILINCHLIK[m.urgency]}
      </Nishoncha>
    ),
  },
  tashkilot: {
    sarlavha: "Tashkilot",
    // Tashkilot nomlari uzun ("Qashqadaryo viloyati sog'liqni saqlash
    // boshqarmasi") — cheklanmasa ustun jadvalning yarmini egallab oladi
    kenglik: "max-w-52",
    hujayra: (m) =>
      m.organization ? (
        <>
          <span className="block truncate text-matn">{m.organization.name}</span>
          {m.organization.district && (
            <span className="block truncate text-xs text-matn-uchinchi">
              {m.organization.district}
            </span>
          )}
        </>
      ) : (
        "—"
      ),
  },
  soha: {
    sarlavha: "Soha",
    hujayra: (m) => m.category?.name ?? "—",
  },
  yoqotish: {
    sarlavha: "Oyiga yo'qotish",
    ongga: true,
    hujayra: (m) => <span className="font-medium">{soatMatni(m.monthlyHoursLost)}</span>,
  },
  qollab: {
    // `tashkilot` ustuni bilan chalkashmasin: u kimniki ekanini, bu esa
    // nechta tashkilotda uchrashini bildiradi
    sarlavha: "Nechta tashkilotda",
    ongga: true,
    hujayra: (m) => {
      const soni = tashkilotSoni(m);
      return soni > 1 ? (
        <span className="font-medium text-muvaffaqiyat">{soni}</span>
      ) : (
        <span className="text-matn-uchinchi">1</span>
      );
    },
  },
  fuqaro: {
    sarlavha: "Fuqaro",
    ongga: true,
    hujayra: (m) =>
      m.citizensAffected ? sonMatni(m.citizensAffected) : <span className="text-matn-uchinchi">—</span>,
  },
  olgan: {
    sarlavha: "Kim oldi",
    hujayra: (m) => {
      const kim = m.assignments?.[0]?.developer.fullName;
      return kim ? (
        <span className="text-jarayon">{kim}</span>
      ) : (
        <span className="text-matn-uchinchi">—</span>
      );
    },
  },
};

export function MuammolarJadvali({
  muammolar,
  yol,
  ustunlar,
}: {
  muammolar: JadvalMuammosi[];
  yol: (m: JadvalMuammosi) => string;
  ustunlar: Ustun[];
}) {
  return (
    <>
      {/* ── Jadval: o'rta va katta ekran ── */}
      <div className="hidden md:block">
        <Jadval>
          <JadvalBosh>
            <JadvalQator className="hover:bg-transparent">
              <JadvalSarlavha className="w-full min-w-48">Muammo</JadvalSarlavha>
              {ustunlar.map((u) => (
                <JadvalSarlavha key={u} className={USTUNLAR[u].ongga ? "text-right" : undefined}>
                  {USTUNLAR[u].sarlavha}
                </JadvalSarlavha>
              ))}
            </JadvalQator>
          </JadvalBosh>

          <JadvalTana>
            {muammolar.map((m) => (
              <JadvalQator key={m.id}>
                <JadvalKatak>
                  {/*
                    Havola aynan sarlavhada — butun qator havola bo'lsa,
                    matnni belgilab nusxa olib bo'lmaydi va ekran o'quvchi
                    barcha hujayra matnini bitta uzun havola nomi qilib
                    o'qib beradi.
                  */}
                  <Link
                    href={yol(m)}
                    className="font-medium text-matn hover:text-asosiy hover:underline"
                  >
                    {m.title || "Nomsiz muammo"}
                  </Link>
                  <span className="mt-0.5 block text-xs text-matn-uchinchi">
                    {m.refCode}
                    {m._count?.attachments ? ` · ${m._count.attachments} ta fayl` : ""}
                  </span>
                </JadvalKatak>

                {ustunlar.map((u) => (
                  <JadvalKatak
                    key={u}
                    className={cn(
                      USTUNLAR[u].ongga && "whitespace-nowrap text-right",
                      USTUNLAR[u].kenglik
                    )}
                  >
                    {USTUNLAR[u].hujayra(m)}
                  </JadvalKatak>
                ))}
              </JadvalQator>
            ))}
          </JadvalTana>
        </Jadval>
      </div>

      {/* ── Kartochkalar: telefon ── */}
      <div className="space-y-2 md:hidden">
        {muammolar.map((m) => (
          <Link
            key={m.id}
            href={yol(m)}
            className="block rounded-xl border border-chegara bg-yuza p-4 shadow-1 transition-colors hover:border-asosiy"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 flex-1 font-medium leading-snug text-matn">
                {m.title || "Nomsiz muammo"}
              </h3>
              <Nishoncha className={MUAMMO_HOLATI_RANGI[m.status]}>
                {MUAMMO_HOLATI[m.status]}
              </Nishoncha>
            </div>

            {m.organization && (
              <p className="mt-1 text-sm text-matn-uchinchi">
                {m.organization.name}
                {m.organization.district ? ` · ${m.organization.district}` : ""}
              </p>
            )}

            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-matn-ikkilamchi">Oyiga:</dt>
                <dd className="font-medium text-matn">{soatMatni(m.monthlyHoursLost)}</dd>
              </div>

              {tashkilotSoni(m) > 1 && (
                <div className="flex gap-1.5">
                  <dt className="text-matn-ikkilamchi">Tashkilot:</dt>
                  <dd className="font-medium text-muvaffaqiyat">{tashkilotSoni(m)}</dd>
                </div>
              )}

              {m.category && (
                <div className="flex gap-1.5">
                  <dt className="text-matn-ikkilamchi">Soha:</dt>
                  <dd className="text-matn">{m.category.name}</dd>
                </div>
              )}
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}
