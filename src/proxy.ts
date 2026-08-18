import { NextResponse, type NextRequest } from "next/server";

import { SESSIYA_COOKIE, sessiyaTokeniniOqi } from "@/lib/session";
import { boshSahifa, bolimQoidasi, KIRISH_SAHIFASI, ochiqYolmi } from "@/lib/routes";

/**
 * Marshrut himoyasi.
 *
 * Next.js 16 da bu fayl `proxy.ts` deb ataladi (ilgari `middleware.ts` edi) va
 * Node.js runtime'da ishlaydi.
 *
 * Bu yerda faqat **qo'pol** tekshiruv bo'ladi: cookie imzosi va rol.
 * Bazaga murojaat qilinmaydi — bloklangan foydalanuvchi, tasdiqlanmagan
 * dasturchi va bekor qilingan sessiya sahifa/action darajasida
 * (`src/lib/auth.ts`) qayta tekshiriladi.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const sessiya = await sessiyaTokeniniOqi(
    request.cookies.get(SESSIYA_COOKIE)?.value
  );

  /*
    DIQQAT: kirgan foydalanuvchini kirish sahifasidan bosh sahifaga yo'naltirish
    ATAYLAB bu yerda emas, `/kirish` sahifasining o'zida qilinadi.

    Sababi: cookie imzosi to'g'ri bo'lsa ham sessiya yaroqsiz bo'lishi mumkin —
    foydalanuvchi o'chirilgan, bloklangan yoki admin sessiyalarni bekor qilgan.
    Agar proxy bu yerda yo'naltirsa, cheksiz halqa hosil bo'ladi:
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
