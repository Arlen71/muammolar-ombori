import { NextResponse, type NextRequest } from "next/server";

import { SESSIYA_COOKIE } from "@/lib/session";
import { KIRISH_SAHIFASI } from "@/lib/routes";

/**
 * Tizimdan chiqish.
 *
 * NEGA SERVER ACTION EMAS
 *
 * Ilgari bu server action edi va u ishonchsiz bo'lib chiqdi. Next server
 * action'ni URL bilan emas, yig'ish paytida hisoblangan xesh bilan
 * chaqiradi. Yangi versiya joylashtirilganda xeshlar almashadi, ochiq
 * turgan sahifa esa brauzerda eskisicha qoladi — bosilgan tugma
 * serverga endi mavjud bo'lmagan xeshni yuboradi va javob
 * «Server action not found» (404) bo'ladi. Foydalanuvchi buni
 * «Kutilmagan xatolik yuz berdi» ekrani sifatida ko'radi.
 *
 * Chiqish tugmasi — aynan odam nimadir noto'g'ri ketganda bosadigan
 * tugma. Shuning uchun u ilovaning eng ishonchli qismi bo'lishi kerak:
 * oddiy HTML forma, qat'iy manzilga POST. Bu yerda JavaScript ham,
 * xesh ham, klient holati ham ishtirok etmaydi — bundle butunlay
 * buzilgan bo'lsa ham chiqish ishlaydi.
 *
 * FAQAT POST. GET bo'lsa boshqa saytdagi `<img src="…/chiqish">` odamni
 * tizimdan chiqarib yuborardi. Cookie `SameSite=Lax` bo'lgani uchun
 * begona saytdan yuborilgan POST bilan sessiya cookie'si umuman
 * ketmaydi, ya'ni bunday so'rov hech kimni chiqara olmaydi.
 */
export async function POST(request: NextRequest) {
  /*
    303 — 307 emas. 307 da brauzer yo'naltirilgan manzilga ham POST
    qiladi va `/kirish` sahifasi POST so'rovini oladi. 303 esa
    «endi GET bilan bor» degani.
  */
  const javob = NextResponse.redirect(new URL(KIRISH_SAHIFASI, request.url), {
    status: 303,
  });
  javob.cookies.delete(SESSIYA_COOKIE);
  return javob;
}
