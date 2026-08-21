import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi } from "@/lib/auth";
import { faylniOlish } from "@/lib/uploads";

/**
 * Foydalanuvchining profil rasmini beradi.
 *
 * Biriktirmalardan farqi ikkita:
 *
 *   1. RUXSAT KENGROQ. Har qanday kirgan foydalanuvchi istalgan
 *      hamkasbning rasmini ko'ra oladi. Bu ataylab: dasturchi muammoni
 *      olgach mas'ul shaxsga qo'ng'iroq qiladi, va kim bilan gaplashayotganini
 *      ko'rish aloqani osonlashtiradi. Ombor baribir yopiq — tashqaridan
 *      hech kim bu marshrutga yeta olmaydi.
 *
 *   2. `inline` va keshlanadi. Rasm sahifa ichida ko'rsatilishi kerak,
 *      yuklab olinmasligi. Keshlash `private` — faqat brauzerda, oraliq
 *      proksilarda emas.
 *
 * Audit yozuvi yuritilmaydi: avatar har bir sahifada, har bir qatorda
 * so'raladi va jurnal foydali signalni ko'mib yuborardi. Biriktirmalar
 * boshqa masala — u yerda har bir yuklab olish qayd etiladi.
 */
export async function GET(_soro: Request, ctx: RouteContext<"/api/rasm/[id]">) {
  const { id } = await ctx.params;

  const foydalanuvchi = await getJoriyFoydalanuvchi();
  if (!foydalanuvchi) {
    return new Response("Avtorizatsiya talab qilinadi", { status: 401 });
  }

  const egasi = await db.user.findUnique({
    where: { id },
    select: { avatarPath: true },
  });
  if (!egasi?.avatarPath) return new Response("Rasm yo'q", { status: 404 });

  const rasm = await faylniOlish(egasi.avatarPath);
  if (!rasm) return new Response("Rasm omborda topilmadi", { status: 404 });

  /*
    MIME turi yo'ldagi kengaytmadan olinadi. Bazada saqlanmaydi, chunki
    yo'lni faqat `rasmniSaqla` yozadi va u kengaytma bilan turni
    allaqachon solishtirgan.
  */
  const keng = egasi.avatarPath.slice(egasi.avatarPath.lastIndexOf(".")).toLowerCase();
  const turi =
    keng === ".png" ? "image/png" : keng === ".webp" ? "image/webp" : "image/jpeg";

  return new Response(rasm.oqim, {
    headers: {
      "Content-Type": turi,
      "Content-Disposition": "inline",
      // Rasm o'zgarganda yo'l ham o'zgaradi (yangi UUID), shuning uchun
      // uzoq keshlash xavfsiz. `private` — faqat brauzer keshi.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
