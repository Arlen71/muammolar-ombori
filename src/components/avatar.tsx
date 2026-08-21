import { cn } from "@/lib/utils";

/**
 * Foydalanuvchi rasmi.
 *
 * Rasm yuklanmagan bo'lsa bo'sh doira emas, ism bosh harflari ko'rsatiladi.
 * Bo'sh joy o'rniga ma'lumot: ro'yxatda odamlar bir-biridan farqlanib
 * turadi va rasm yuklamagan foydalanuvchi "nuqsonli" ko'rinmaydi.
 *
 * Fon rangi ism asosida tanlanadi — bir xil odam har doim bir xil rangda
 * chiqadi, ya'ni rang ham taniqlik belgisiga aylanadi. Tasodifiy bo'lsa,
 * har sahifa yangilanganda rang o'zgarib, aksincha chalkashtirardi.
 */

/** Bosh harflar: "Bekzod Tursunov" → "BT". */
function boshHarflar(ism: string): string {
  const qismlar = ism.trim().split(/\s+/).filter(Boolean);
  if (qismlar.length === 0) return "?";
  if (qismlar.length === 1) return qismlar[0].slice(0, 2).toUpperCase();
  return (qismlar[0][0] + qismlar[qismlar.length - 1][0]).toUpperCase();
}

/*
  Rang palitrasi. Holat ranglari (yashil/sariq/qizil) ataylab yo'q:
  avatar rangi hech qanday holatni bildirmaydi va ular bilan
  chalkashmasligi kerak.
*/
const RANGLAR = [
  "bg-asosiy-ochiq text-asosiy",
  "bg-jarayon-yuza text-jarayon",
  "bg-malumot-yuza text-malumot",
  "bg-muvaffaqiyat-yuza text-muvaffaqiyat",
  "bg-yuza-3 text-matn-ikkilamchi",
] as const;

/** Ism satridan barqaror indeks — bir xil ism har doim bir xil rang beradi. */
function rangIndeksi(ism: string): number {
  let yigindi = 0;
  for (let i = 0; i < ism.length; i += 1) yigindi = (yigindi + ism.charCodeAt(i)) % 9973;
  return yigindi % RANGLAR.length;
}

const OLCHAMLAR = {
  kichik: "size-8 text-xs",
  orta: "size-10 text-sm",
  katta: "size-20 text-xl",
} as const;

export function Avatar({
  ism,
  foydalanuvchiId,
  rasmVersiyasi,
  olcham = "orta",
  className,
}: {
  ism: string;
  foydalanuvchiId: string;
  /**
   * Rasm versiyasi; `null` bo'lsa rasm yo'q va so'rov yuborilmaydi.
   * Manzilga qo'shiladi — rasm almashganda brauzer keshi ham almashadi.
   */
  rasmVersiyasi: string | null;
  olcham?: keyof typeof OLCHAMLAR;
  className?: string;
}) {
  const asos = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    "font-display font-semibold ring-1 ring-inset ring-chegara",
    OLCHAMLAR[olcham],
    className
  );

  if (!rasmVersiyasi) {
    return (
      <span className={cn(asos, RANGLAR[rangIndeksi(ism)])} aria-hidden="true">
        {boshHarflar(ism)}
      </span>
    );
  }

  /*
    Oddiy `<img>`, `next/image` emas. Rasm himoyalangan marshrutdan
    keladi va Next optimizatsiyasi uni server tomonda qayta yuklashga
    urinardi — sessiya cookie'siz esa 401 oladi.

    `alt=""` — rasm bezak: yonida ismning o'zi matn bo'lib turadi.
    Bo'sh bo'lmagan `alt` ekran o'quvchiga ismni ikki marta o'qitardi.
  */
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/rasm/${foydalanuvchiId}?v=${rasmVersiyasi}`}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn(asos, "bg-yuza-2 object-cover")}
    />
  );
}
