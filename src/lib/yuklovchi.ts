"use client";

import { upload } from "@vercel/blob/client";

/**
 * Brauzerdan omborga to'g'ridan-to'g'ri yuklash.
 *
 * Fayl baytlari serverdan o'tmaydi — Vercel serverless funksiyasiga
 * 4.5 MB dan katta tana kirmaydi (o'lchangan: 4 MB o'tadi, 4.4 MB da
 * 413). Server faqat `/api/yuklash` orqali qisqa muddatli token beradi.
 *
 * Bu yerdagi tekshiruvlar SERVERNIKINI ALMASHTIRMAYDI — ular faqat
 * foydalanuvchiga darhol javob berish uchun: 9 MB li faylni omborga
 * yuborib, keyin "juda katta" deyish uzoq va bekorga trafik yeydi.
 * Haqiqiy chegara token berishda qo'yiladi va uni brauzer aylanib
 * o'ta olmaydi.
 */

export type YuklashNatijasi =
  | { ok: true; yol: string; nomi: string; hajm: number; turi: string }
  | { ok: false; xato: string };

/** Baytni odam o'qiydigan ko'rinishga keltiradi. */
function hajmMatni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`;
}

function kengaytma(nom: string): string {
  const nuqta = nom.lastIndexOf(".");
  return nuqta > 0 ? nom.slice(nuqta).toLowerCase() : "";
}

/**
 * Bitta faylni yuklaydi.
 *
 * `papka` — omborda qayerga: `rasmlar/<foydalanuvchiId>` yoki
 * `biriktirmalar/<muammoId>`. Nom har doim yangi UUID: foydalanuvchi
 * bergan nom faqat bazada, ko'rsatish uchun saqlanadi.
 */
export async function faylniYukla({
  fayl,
  papka,
  yuklama,
  maksimalHajm,
  ruxsatEtilganTurlar,
  jarayon,
}: {
  fayl: File;
  papka: string;
  /** Serverga nima yuklanayotganini aytadi — token shunga qarab cheklanadi */
  yuklama: Record<string, unknown>;
  maksimalHajm: number;
  ruxsatEtilganTurlar: string[];
  /** 0–100 oralig'ida chaqiriladi */
  jarayon?: (foiz: number) => void;
}): Promise<YuklashNatijasi> {
  if (fayl.size === 0) return { ok: false, xato: `${fayl.name}: fayl bo'sh.` };

  if (fayl.size > maksimalHajm) {
    return {
      ok: false,
      xato: `${fayl.name}: ${hajmMatni(fayl.size)} — chegara ${hajmMatni(maksimalHajm)}.`,
    };
  }

  if (fayl.type && !ruxsatEtilganTurlar.includes(fayl.type)) {
    return { ok: false, xato: `${fayl.name}: bu turdagi fayl qabul qilinmaydi.` };
  }

  const yol = `${papka}/${crypto.randomUUID()}${kengaytma(fayl.name)}`;

  try {
    const natija = await upload(yol, fayl, {
      /*
        Ombor `private` rejimda: faylni internetdan havola bilan ochib
        bo'lmaydi, uni faqat token bilan server o'qiy oladi. Foydalanuvchi
        rasm va hujjatlarni `/api/rasm/[id]` va `/api/fayl/[id]` orqali,
        ruxsat tekshirilgandan keyin oladi.
      */
      access: "private",
      handleUploadUrl: "/api/yuklash",
      clientPayload: JSON.stringify(yuklama),
      /*
        Nom o'zgarmasin: yo'lni server prefiks bo'yicha tekshiradi va
        tasodifiy qo'shimcha uni buzardi.
      */
      multipart: fayl.size > 5 * 1024 * 1024,
      onUploadProgress: jarayon
        ? ({ percentage }) => jarayon(Math.round(percentage))
        : undefined,
    });

    return {
      ok: true,
      yol: natija.pathname,
      nomi: fayl.name.split(/[/\\]/).pop()!.slice(0, 180),
      hajm: fayl.size,
      turi: fayl.type || "application/octet-stream",
    };
  } catch (e) {
    /*
      Server tokenni bermasa (sessiya tugagan, muammo yopilgan, yo'l
      noto'g'ri) shu yerga tushamiz. Xabar serverdan keladi va u
      o'zbekcha — `/api/yuklash` shunday yozilgan.
    */
    const xabar = e instanceof Error ? e.message : "Yuklab bo'lmadi";
    return { ok: false, xato: `${fayl.name}: ${xabar}` };
  }
}
