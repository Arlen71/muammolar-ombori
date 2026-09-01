import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { suhbatRoli } from "@/lib/suhbat";
import { faylniOlish } from "@/lib/uploads";

/**
 * Suhbatga biriktirilgan faylni beradi.
 *
 * Muammo biriktirmalaridan farqi: bu yerda ruxsat TOR. Muammo fayli
 * ombordagi barcha tasdiqlangan dasturchilarga ochiq, suhbat fayli esa
 * faqat o'sha yozishmaning qatnashchilariga — dasturchi bir-birining
 * yozishmasini ko'rmasligi kerak. Ruxsat mantig'i `suhbat.ts` da,
 * bitta joyda.
 */
export async function GET(
  _soro: Request,
  ctx: RouteContext<"/api/suhbat-fayl/[id]">
) {
  const { id } = await ctx.params;

  const foydalanuvchi = await getJoriyFoydalanuvchi();
  if (!foydalanuvchi) {
    return new Response("Avtorizatsiya talab qilinadi", { status: 401 });
  }

  const fayl = await db.suhbatFayli.findUnique({
    where: { id },
    select: {
      fileName: true,
      storedName: true,
      mimeType: true,
      size: true,
      xabar: {
        select: {
          suhbat: {
            select: {
              id: true,
              developerId: true,
              problem: { select: { organizationId: true } },
            },
          },
        },
      },
    },
  });
  if (!fayl) return new Response("Fayl topilmadi", { status: 404 });

  const suhbat = fayl.xabar.suhbat;
  if (suhbatRoli(foydalanuvchi, suhbat) === null) {
    await auditYoz({
      actorId: foydalanuvchi.id,
      action: "suhbat_fayl.ruxsatsiz_urinish",
      entity: "SuhbatFayli",
      entityId: id,
    });
    return new Response("Bu faylga ruxsatingiz yo'q", { status: 403 });
  }

  const oqim = await faylniOlish(fayl.storedName);
  if (!oqim) return new Response("Fayl omborda topilmadi", { status: 404 });

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "suhbat_fayl.yuklab_olindi",
    entity: "SuhbatFayli",
    entityId: id,
    meta: { suhbatId: suhbat.id },
  });

  return new Response(oqim.oqim, {
    headers: {
      "Content-Type": fayl.mimeType,
      // `attachment` — brauzer faylni ochmasdan yuklab oladi. Bu
      // yuklangan HTML/SVG orqali XSS bo'lish ehtimolini yo'q qiladi.
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fayl.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
