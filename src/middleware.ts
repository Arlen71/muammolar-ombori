import { NextResponse, type NextRequest } from "next/server";

import { SESSIYA_COOKIE, sessiyaTokeniniOqi } from "@/lib/session";
import { boshSahifa, bolimQoidasi, KIRISH_SAHIFASI, ochiqYolmi } from "@/lib/routes";

/**
 * Marshrut himoyasi.
 *
 * NEGA `middleware.ts`, `proxy.ts` EMAS:
 * Next.js 16 bu faylni `proxy.ts` deb qayta nomladi, lekin `proxy` majburan
 * Node.js runtime'da ishlaydi va uni o'zgartirib bo'lmaydi. Cloudflare Workers
 * uchun mo'ljallangan OpenNext adapteri esa hozircha faqat edge runtime'dagi
 * middleware'ni qo'llab-quvvatlaydi. Next hujjatlari aynan shu holat uchun eski
 * `middleware` konvensiyasida qolishni tavsiya qiladi.
 *
 * Bu kod edge'da muammosiz ishlaydi: bazaga murojaat yo'q, faqat cookie imzosi
 * tekshiriladi (`jose` edge'da ishlaydi).
 *
 * Bu yerda faqat **qo'pol** tekshiruv bo'ladi: cookie imzosi va rol.
 * Bloklangan foydalanuvchi, tasdiqlanmagan dasturchi va bekor qilingan sessiya
 * sahifa/action darajasida (`src/lib/auth.ts`) qayta tekshiriladi.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessiya = await sessiyaTokeniniOqi(
    request.cookies.get(SESSIYA_COOKIE)?.value
  );

  /*
    DIQQAT: kirgan foydalanuvchini kirish sahifasidan bosh sahifaga yo'naltirish
    ATAYLAB bu yerda emas, `/kirish` sahifasining o'zida qilinadi.

    Sababi: cookie imzosi to'g'ri bo'lsa ham sessiya yaroqsiz bo'lishi mumkin —
    foydalanuvchi o'chirilgan, bloklangan yoki admin sessiyalarni bekor qilgan.
    Agar bu yerda yo'naltirsak, cheksiz halqa hosil bo'ladi:
      /rahbar → (baza: foydalanuvchi yo'q) → /kirish → (cookie bor) → /rahbar → …
    Bazani faqat sahifa qatlami ko'ra oladi, shuning uchun bu qaror o'sha yerda.
  */
  if (ochiqYolmi(pathname)) return NextResponse.next();

  const qoida = bolimQoidasi(pathname);
  if (!qoida) return NextResponse.next();

  if (!sessiya) {
    const url = new URL(KIRISH_SAHIFASI, request.url);
    // Kirgandan keyin foydalanuvchini o'zi so'ragan sahifaga qaytaramiz
    url.searchParams.set("keyingi", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!qoida.rollar.includes(sessiya.role)) {
    return NextResponse.redirect(new URL(boshSahifa(sessiya.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Statik fayllar va fayl kengaytmasi borlar tashqarida
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
