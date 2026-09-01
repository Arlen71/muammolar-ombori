"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X } from "lucide-react";

import { xabarYubor, type YuklanganSuhbatFayli } from "../actions";
import { KattaMatn, Tugma, Xabar } from "@/components/ui";
import { HUJJAT_TURLARI, hajmMatni } from "@/lib/uploads-client";
import { faylniYukla } from "@/lib/yuklovchi";

/**
 * Xabar yozish qatori.
 *
 * Yopishib turadi — yozishma uzayganda ham pastga aylantirmasdan javob
 * yozish mumkin bo'lsin.
 */
export function XabarFormasi({ suhbatId }: { suhbatId: string }) {
  const router = useRouter();
  const maydon = useRef<HTMLTextAreaElement>(null);
  const faylKirishi = useRef<HTMLInputElement>(null);

  const [tanlangan, tanlanganniYoz] = useState<File[]>([]);
  const [xato, xatoniYoz] = useState<string | null>(null);
  const [jarayon, jarayonniYoz] = useState<{ nomi: string; foiz: number } | null>(null);
  const [yuborilmoqda, yuborilmoqdaYoz] = useState(false);

  /*
    10 MB — muammo biriktirmalari bilan bir xil chegara. Aniq qiymat
    serverda `MAX_UPLOAD_BYTES` dan olinadi; bu yerdagisi faqat
    foydalanuvchiga darhol javob berish uchun.
  */
  const MAKSIMAL = 10 * 1024 * 1024;

  async function yubor() {
    const matn = maydon.current?.value.trim() ?? "";
    if (!matn && tanlangan.length === 0) {
      xatoniYoz("Xabar bo'sh — matn yozing yoki fayl biriktiring.");
      return;
    }

    xatoniYoz(null);
    yuborilmoqdaYoz(true);

    // Fayllar ketma-ket: sekin internetda parallel yuborish har birini
    // sekinlashtiradi va jarayon ko'rsatkichi ma'nosini yo'qotadi
    const tayyor: YuklanganSuhbatFayli[] = [];
    for (const fayl of tanlangan) {
      jarayonniYoz({ nomi: fayl.name, foiz: 0 });
      const natija = await faylniYukla({
        fayl,
        papka: `suhbat/${suhbatId}`,
        yuklama: { turi: "suhbat", suhbatId },
        maksimalHajm: MAKSIMAL,
        ruxsatEtilganTurlar: [...HUJJAT_TURLARI],
        jarayon: (foiz) => jarayonniYoz({ nomi: fayl.name, foiz }),
      });

      if (!natija.ok) {
        jarayonniYoz(null);
        yuborilmoqdaYoz(false);
        xatoniYoz(natija.xato);
        return;
      }
      tayyor.push({
        yol: natija.yol,
        nomi: natija.nomi,
        hajm: natija.hajm,
        turi: natija.turi,
      });
    }
    jarayonniYoz(null);

    const javob = await xabarYubor(suhbatId, matn, tayyor);
    yuborilmoqdaYoz(false);

    if (javob.xato) {
      xatoniYoz(javob.xato);
      return;
    }

    // Muvaffaqiyat — maydonni tozalab, yozishmani yangilaymiz
    if (maydon.current) maydon.current.value = "";
    tanlanganniYoz([]);
    if (faylKirishi.current) faylKirishi.current.value = "";
    router.refresh();
  }

  function fayllarTanlandi(hodisa: React.ChangeEvent<HTMLInputElement>) {
    const yangilar = [...(hodisa.target.files ?? [])];
    const kattalar = yangilar.filter((f) => f.size > MAKSIMAL);
    if (kattalar.length > 0) {
      xatoniYoz(
        `${kattalar[0].name}: ${hajmMatni(kattalar[0].size)} — chegara ${hajmMatni(MAKSIMAL)}.`
      );
      hodisa.target.value = "";
      return;
    }
    xatoniYoz(null);
    tanlanganniYoz((oldingi) => [...oldingi, ...yangilar].slice(0, 5));
    hodisa.target.value = "";
  }

  return (
    <div className="sticky bottom-0 -mx-4 mt-4 border-t border-chegara bg-yuza/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      {xato && (
        <Xabar turi="xato" className="mb-2">
          {xato}
        </Xabar>
      )}

      {tanlangan.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {tanlangan.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-yuza-2 px-2.5 py-1.5 text-sm"
            >
              <span className="max-w-48 truncate">{f.name}</span>
              <span className="text-xs text-matn-uchinchi">{hajmMatni(f.size)}</span>
              <button
                type="button"
                aria-label={`${f.name} — olib tashlash`}
                onClick={() => tanlanganniYoz((o) => o.filter((_, j) => j !== i))}
                className="rounded text-matn-uchinchi hover:text-xato"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {jarayon && (
        <div className="mb-2">
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

      <div className="flex items-end gap-2">
        <KattaMatn
          ref={maydon}
          rows={2}
          disabled={yuborilmoqda}
          placeholder="Savolingizni yozing…"
          aria-label="Xabar matni"
          className="min-h-11 flex-1 resize-y"
          onKeyDown={(e) => {
            // Ctrl/Cmd+Enter — yuborish. Oddiy Enter yangi qator qoldiradi:
            // savol ko'pincha bir necha jumladan iborat bo'ladi
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void yubor();
            }
          }}
        />

        <input
          ref={faylKirishi}
          type="file"
          multiple
          className="hidden"
          onChange={fayllarTanlandi}
        />

        <Tugma
          type="button"
          korinish="ikkilamchi"
          disabled={yuborilmoqda}
          onClick={() => faylKirishi.current?.click()}
          aria-label="Fayl biriktirish"
          className="px-3"
        >
          <Paperclip size={18} aria-hidden="true" />
        </Tugma>

        <Tugma type="button" disabled={yuborilmoqda} onClick={yubor}>
          {yuborilmoqda ? "Yuborilmoqda…" : "Yuborish"}
        </Tugma>
      </div>

      <p className="mt-1.5 text-xs text-matn-uchinchi">
        Ctrl+Enter — yuborish · ko&apos;pi bilan 5 ta fayl, har biri{" "}
        {hajmMatni(MAKSIMAL)} gacha
      </p>
    </div>
  );
}
