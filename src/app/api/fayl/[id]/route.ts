import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { faylniOlish } from "@/lib/uploads";

/**
 * Biriktirilgan faylni beradi.
 *
 * Fayllar R2 da va bucket ochiq emas — har bir so'rovda ruxsat tekshiriladi:
 *   - o'z tashkiloti muammosi bo'lsa — rahbar;
 *   - ombordagi muammo bo'lsa — tasdiqlangan dasturchi;
 *   - har doim — admin.
 */
export async function GET(_soro: Request, ctx: RouteContext<"/api/fayl/[id]">) {
  const { id } = await ctx.params;

  const foydalanuvchi = await getJoriyFoydalanuvchi();
  if (!foydalanuvchi) {
    return new Response("Avtorizatsiya talab qilinadi", { status: 401 });
  }

  const biriktirma = await db.problemAttachment.findUnique({
    where: { id },
    include: { problem: { select: { id: true, status: true, organizationId: true } } },
  });
  if (!biriktirma) return new Response("Fayl topilmadi", { status: 404 });

  const { problem } = biriktirma;
  const omborda = ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"].includes(
    problem.status
  );

  const ruxsat =
    foydalanuvchi.role === "ADMIN" ||
    (foydalanuvchi.role === "LEADER" &&
      foydalanuvchi.organizationId === problem.organizationId) ||
    (foydalanuvchi.role === "DEVELOPER" && foydalanuvchi.status === "ACTIVE" && omborda);

  if (!ruxsat) {
    await auditYoz({
      actorId: foydalanuvchi.id,
      action: "fayl.ruxsatsiz_urinish",
      entity: "ProblemAttachment",
      entityId: id,
    });
    return new Response("Bu faylga ruxsatingiz yo'q", { status: 403 });
  }

  const fayl = await faylniOlish(biriktirma.storedName);
  if (!fayl) {
    // Bazada yozuv bor, lekin omborda fayl yo'q (masalan seed ma'lumoti)
    return new Response("Fayl omborda topilmadi", { status: 404 });
  }

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "fayl.yuklab_olindi",
    entity: "ProblemAttachment",
    entityId: id,
    meta: { problemId: problem.id },
  });

  return new Response(fayl.oqim, {
    headers: {
      "Content-Type": biriktirma.mimeType,
      "Content-Length": String(fayl.hajm),
      // `attachment` — brauzer faylni ochmasdan yuklab oladi.
      // Bu yuklangan HTML/SVG orqali XSS bo'lish ehtimolini yo'q qiladi.
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(biriktirma.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
