import { sonMatni } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Diagrammalar.
 *
 * Tashqi kutubxonasiz, oddiy HTML va CSS bilan. Sabab uchta:
 *
 *   1. Bularning hammasi SERVER komponenti — brauzerga bir bayt ham
 *      JavaScript ketmaydi. Diagramma kutubxonalari (recharts, chart.js)
 *      client komponenti bo'lishga majbur va ~50–150 KB qo'shadi.
 *   2. Bizga kerak bo'lgani gorizontal ustunlar va oqim — ular uchun
 *      `div` va `width: %` yetarli. Egri chiziq yoki interaktiv tooltip
 *      kerak bo'lganda kutubxona haqida o'ylash mumkin.
 *   3. Davlat loyihasida har bir bog'liqlik audit va yangilanish yuki.
 *
 * Barcha diagrammalarda raqam ustunning YONIDA matn bo'lib turadi:
 * ma'no faqat uzunlik bilan berilmaydi (WCAG 1.4.1). Ekran o'quvchi
 * uchun esa ular oddiy ro'yxat bo'lib o'qiladi.
 */

export type UstunQiymati = { yorliq: string; qiymat: number };

/**
 * Gorizontal ustunli diagramma.
 *
 * Gorizontal, chunki yorliqlar uzun ("Qashqadaryo viloyati sog'liqni
 * saqlash boshqarmasi"). Vertikal ustunlarda bunday matn qiyshaytirib
 * yozilardi yoki qisqartirilardi — ikkalasi ham o'qishni qiyinlashtiradi.
 */
export function Ustunlar({
  malumot,
  className,
}: {
  malumot: UstunQiymati[];
  className?: string;
}) {
  if (malumot.length === 0) return null;

  // Nisbat eng katta qiymatga qarab, nolga bo'lishdan himoyalangan
  const eng = Math.max(...malumot.map((m) => m.qiymat), 1);

  return (
    <dl className={cn("space-y-2.5", className)}>
      {malumot.map((m) => {
        const foiz = (m.qiymat / eng) * 100;
        return (
          <div key={m.yorliq} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
            <dt className="truncate text-sm text-matn" title={m.yorliq}>
              {m.yorliq}
            </dt>
            <dd className="text-sm font-medium tabular-nums text-matn">
              {sonMatni(m.qiymat)}
            </dd>
            <div
              className="col-span-2 h-2 overflow-hidden rounded-full bg-yuza-2"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-asosiy"
                /*
                  Eng kichik qiymat ham ko'rinsin: 1% ustun ko'zga
                  ilinmaydi va "nol" bilan bir xil tuyuladi.
                */
                style={{ width: `${Math.max(foiz, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}

export type OqimBosqichi = {
  yorliq: string;
  qiymat: number;
  /** Tailwind matn rangi sinfi — bosqich holatiga mos */
  rang?: string;
};

/**
 * Holatlar oqimi.
 *
 * Muammo zanjir bo'ylab harakatlanadi: yuborildi → tasdiqlandi →
 * dasturchi oldi → hal qilindi. Har bosqichda qancha muammo turgani
 * jarayonning qayerda tiqilib qolganini ko'rsatadi — bu boshqaruv
 * paneli javob berishi kerak bo'lgan asosiy savol.
 *
 * Voronka (funnel) shakli EMAS, oddiy qatorlar: voronkada kenglik
 * miqdorni bildiradi va kichik sonlar ko'rinmay ketadi. Bu yerda esa
 * har bir bosqich teng joy oladi, farq raqamda.
 */
export function Oqim({
  bosqichlar,
  className,
}: {
  bosqichlar: OqimBosqichi[];
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {bosqichlar.map((b, i) => (
        <li
          key={b.yorliq}
          className="relative rounded-xl border border-chegara bg-yuza-2 px-4 py-3"
        >
          <p className="truncate text-xs text-matn-ikkilamchi">{b.yorliq}</p>
          <p
            className={cn(
              "mt-0.5 font-display text-2xl font-bold tabular-nums",
              b.rang ?? "text-matn"
            )}
          >
            {sonMatni(b.qiymat)}
          </p>

          {/*
            Bosqichlar orasidagi strelka. Faqat katta ekranda va faqat
            oxirgisidan tashqarida — tor ekranda kartochkalar ustma-ust
            tushadi va yon strelka ma'nosini yo'qotadi.
          */}
          {i < bosqichlar.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute -right-[9px] top-1/2 hidden -translate-y-1/2 text-matn-uchinchi lg:block"
            >
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Ulushlar chizig'i — bitta gorizontal chiziq, bo'laklarga bo'lingan.
 *
 * Doiraviy (pie) diagramma o'rniga: doirada burchaklarni ko'z bilan
 * solishtirish qiyin, tor bo'laklarning yorlig'i esa sig'maydi. Chiziq
 * esa bir qarashda "nima ko'p, nima kam" ni aytadi va yorliqlar ostida
 * ro'yxat bo'lib turadi.
 */
export function Ulushlar({
  malumot,
  className,
}: {
  malumot: (UstunQiymati & { rang: string })[];
  className?: string;
}) {
  const jami = malumot.reduce((s, m) => s + m.qiymat, 0);
  if (jami === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-3 overflow-hidden rounded-full bg-yuza-2" aria-hidden="true">
        {malumot.map((m) => (
          <div
            key={m.yorliq}
            className={m.rang}
            style={{ width: `${(m.qiymat / jami) * 100}%` }}
          />
        ))}
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-1.5">
        {malumot.map((m) => (
          <div key={m.yorliq} className="flex items-center gap-2 text-sm">
            <span className={cn("size-2.5 shrink-0 rounded-full", m.rang)} aria-hidden="true" />
            <dt className="text-matn-ikkilamchi">{m.yorliq}</dt>
            <dd className="font-medium tabular-nums text-matn">{sonMatni(m.qiymat)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
