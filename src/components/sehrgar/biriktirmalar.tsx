"use client";

import { useRef, useState } from "react";

import {
  biriktirmaniOchir,
  fayllarniBiriktir,
  type YuklanganFayl,
} from "@/app/rahbar/actions";
import { Tugma, Xabar } from "@/components/ui";
import { HUJJAT_TURLARI, hajmMatni } from "@/lib/uploads-client";
import { faylniYukla } from "@/lib/yuklovchi";
import type { AmalNatijasi } from "@/lib/validation";

export type Biriktirma = {
  id: string;
  fileName: string;
  size: number;
  mimeType: string;
};

/**
 * Fayl biriktirish bloki.
 *
 * Alohida forma — sehrgarning asosiy formasi ichiga joylashtirib bo'lmaydi
 * (HTML formalarni ichma-ich qo'yishga ruxsat bermaydi).
 */
export function Biriktirmalar({
  muammoId,
  biriktirmalar,
  ruxsatEtilgan,
  maksimalHajmMatni,
  maksimalHajm,
}: {
  muammoId: string;
  biriktirmalar: Biriktirma[];
  ruxsatEtilgan: string[];
  maksimalHajmMatni: string;
  /** Baytda — brauzerda oldindan tekshirish uchun */
  maksimalHajm: number;
}) {
  const [holat, holatniYoz] = useState<AmalNatijasi>({});
  const [jarayon, jarayonniYoz] = useState<{ nomi: string; foiz: number } | null>(null);
  const kiritish = useRef<HTMLInputElement>(null);

  /*
    Fayllar brauzerdan omborga BEVOSITA ketadi, server action orqali
    emas: Vercel serverless funksiyasiga 4.5 MB dan katta tana kirmaydi.
    Ilgari 10 MB deb e'lon qilingan chegara amalda ~4.4 MB edi va undan
    katta Excel fayli tushunarsiz xato bilan yiqilardi.

    Fayllar ketma-ket yuklanadi, parallel emas: sekin internetda uchta
    katta faylni bir vaqtda yuborish har birini sekinlashtiradi va
    jarayon ko'rsatkichi ma'nosini yo'qotadi.
  */
  async function yukla() {
    const tanlangan = [...(kiritish.current?.files ?? [])];
    if (tanlangan.length === 0) {
      holatniYoz({ xato: "Fayl tanlanmadi." });
      return;
    }

    holatniYoz({});
    const tayyor: YuklanganFayl[] = [];
    const xatolar: string[] = [];

    for (const fayl of tanlangan) {
      jarayonniYoz({ nomi: fayl.name, foiz: 0 });
      const natija = await faylniYukla({
        fayl,
        papka: `biriktirmalar/${muammoId}`,
        yuklama: { turi: "biriktirma", muammoId },
        maksimalHajm: maksimalHajm,
        ruxsatEtilganTurlar: [...HUJJAT_TURLARI],
        jarayon: (foiz) => jarayonniYoz({ nomi: fayl.name, foiz }),
      });

      if (natija.ok) {
        tayyor.push({
          yol: natija.yol,
          nomi: natija.nomi,
          hajm: natija.hajm,
          turi: natija.turi,
        });
      } else {
        xatolar.push(natija.xato);
      }
    }

    jarayonniYoz(null);
    if (kiritish.current) kiritish.current.value = "";

    if (tayyor.length > 0) {
      const javob = await fayllarniBiriktir(muammoId, tayyor);
      // Ba'zi fayl yiqilgan bo'lsa, ikkala xabar ham ko'rsatiladi
      holatniYoz(
        xatolar.length > 0
          ? { ...javob, xato: xatolar.join("; ") }
          : javob
      );
      return;
    }

    holatniYoz({ xato: xatolar.join("; ") });
  }

  return (
    <section className="rounded-xl border border-chegara bg-yuza p-5">
      <h2 className="font-medium text-matn">Namuna fayllarni biriktiring</h2>
      <p className="mt-1 text-sm leading-relaxed text-matn-ikkilamchi">
        Hozir ishlatayotgan Excel jadvalingiz, qog'oz blanka rasmi yoki jurnal
        skrinshoti — dasturchi uchun bu uch sahifa matndan ko'ra ko'proq narsani
        aytadi. Bu eng foydali qadam.
      </p>

      {biriktirmalar.length > 0 && (
        <ul className="mt-4 space-y-2">
          {biriktirmalar.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-chegara px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-matn">{b.fileName}</p>
                <p className="text-xs text-matn-uchinchi">{hajmMatni(b.size)}</p>
              </div>
              <form action={biriktirmaniOchir.bind(null, b.id)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-md px-2 py-1 text-sm text-matn-ikkilamchi hover:bg-xato-yuza hover:text-xato"
                >
                  O'chirish
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3">
        {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
        {holat.muvaffaqiyat && <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={kiritish}
            type="file"
            multiple
            disabled={jarayon !== null}
            accept={ruxsatEtilgan.join(",")}
            className="block w-full max-w-md text-sm text-matn-ikkilamchi file:mr-3 file:rounded-lg file:border-0 file:bg-yuza-2 file:px-4 file:py-2 file:text-sm file:font-medium file:text-matn hover:file:bg-yuza-3 disabled:opacity-60"
          />
          <Tugma
            type="button"
            korinish="ikkilamchi"
            olcham="kichik"
            disabled={jarayon !== null}
            onClick={yukla}
          >
            {jarayon ? "Yuklanmoqda…" : "Yuklash"}
          </Tugma>
        </div>

        {jarayon && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-yuza-2">
              <div
                className="h-full rounded-full bg-asosiy transition-[width] duration-200"
                style={{ width: `${jarayon.foiz}%` }}
              />
            </div>
            <p className="mt-1 truncate text-xs text-matn-ikkilamchi" role="status">
              {jarayon.nomi} — {jarayon.foiz}%
            </p>
          </div>
        )}

        <p className="text-xs text-matn-uchinchi">
          Ruxsat etilgan: {ruxsatEtilgan.join(", ")} · eng katta hajm {maksimalHajmMatni} ·
          ko'pi bilan 10 ta fayl
        </p>
      </div>
    </section>
  );
}
