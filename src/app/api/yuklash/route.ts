import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { db } from "@/lib/db";
import { getJoriyFoydalanuvchi } from "@/lib/auth";
import { suhbatRoli, yozaOladimi } from "@/lib/suhbat";
import { maksimalHajm } from "@/lib/uploads";
import {
  HUJJAT_TURLARI,
  RASM_MAKSIMAL_HAJMI,
  RASM_TURLARI,
} from "@/lib/uploads-client";

/**
 * Brauzerdan to'g'ridan-to'g'ri omborga yuklash uchun token beradi.
 *
 * NEGA BUNDAY.
 *
 * Ilgari fayl server action orqali ketardi: brauzer → serverless
 * funksiya → ombor. Bu Vercel'da 4.5 MB da to'xtaydi — platformaning
 * so'rov tanasi cheklovi, `next.config.ts` dan sozlab bo'lmaydi
 * (o'lchab tekshirilgan: 4 MB o'tadi, 4.4 MB da 413
 * FUNCTION_PAYLOAD_TOO_LARGE). Kodda 10 MB deb yozilgani holda
 * amalda 4.4 MB dan katta fayl umuman o'tmasdi va foydalanuvchi
 * tushunarsiz "Kutilmagan xatolik" ekranini ko'rardi.
 *
 * Endi fayl baytlari serverdan umuman o'tmaydi: brauzer omborga
 * bevosita yozadi, server esa faqat qisqa muddatli token beradi.
 * Yon foyda — funksiya vaqti va trafik tejaladi.
 *
 * XAVFSIZLIK.
 *
 * Token cheklangan: u faqat chaqiruvchining O'Z papkasiga, faqat
 * ruxsat etilgan turlarga va faqat belgilangan hajmgacha amal qiladi.
 * Yo'lni mijoz taklif qiladi, lekin quyidagi tekshiruv uni tasdiqlaydi;
 * bundan tashqari faylni bazaga biriktiradigan amal prefiksni yana bir
 * marta tekshiradi. Ya'ni bitta tekshiruv o'tkazib yuborilsa ham,
 * ikkinchisi ushlab qoladi.
 */

/** Mijoz nima yuklayotganini aytadi — token shunga qarab cheklanadi. */
type Yuklama =
  | { turi: "rasm" }
  | { turi: "biriktirma"; muammoId: string }
  | { turi: "suhbat"; suhbatId: string };

/** Muammoga fayl biriktirish mumkin bo'lgan holatlar. */
const TAHRIRLANADIGAN = ["DRAFT", "REJECTED"];

export async function POST(soro: Request): Promise<Response> {
  const tana = (await soro.json()) as HandleUploadBody;

  try {
    const javob = await handleUpload({
      body: tana,
      request: soro,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const foydalanuvchi = await getJoriyFoydalanuvchi();
        if (!foydalanuvchi) throw new Error("Avtorizatsiya talab qilinadi");

        const yuklama = JSON.parse(clientPayload ?? "{}") as Yuklama;

        if (yuklama.turi === "rasm") {
          // Faqat o'z papkasiga
          if (!pathname.startsWith(`rasmlar/${foydalanuvchi.id}/`)) {
            throw new Error("Yo'l noto'g'ri");
          }
          return {
            allowedContentTypes: [...RASM_TURLARI],
            maximumSizeInBytes: RASM_MAKSIMAL_HAJMI,
            addRandomSuffix: false,
          };
        }

        if (yuklama.turi === "biriktirma") {
          if (foydalanuvchi.role !== "LEADER" || !foydalanuvchi.organizationId) {
            throw new Error("Faqat tashkilot rahbari fayl biriktira oladi");
          }

          /*
            Muammo shu rahbarning tashkilotiga tegishli va hali
            tahrirlanadigan holatda bo'lishi shart. Bu tekshiruv aynan
            shu yerda kerak: tokendan keyin fayl serverga umuman
            kelmaydi, ya'ni keyinroq tekshirishning imkoni yo'q.
          */
          const muammo = await db.problem.findFirst({
            where: {
              id: yuklama.muammoId,
              organizationId: foydalanuvchi.organizationId,
            },
            select: { status: true },
          });
          if (!muammo) throw new Error("Muammo topilmadi");
          if (!TAHRIRLANADIGAN.includes(muammo.status)) {
            throw new Error("Yuborilgan muammoga fayl qo'shib bo'lmaydi");
          }
          if (!pathname.startsWith(`biriktirmalar/${yuklama.muammoId}/`)) {
            throw new Error("Yo'l noto'g'ri");
          }

          return {
            allowedContentTypes: [...HUJJAT_TURLARI],
            maximumSizeInBytes: maksimalHajm(),
            addRandomSuffix: false,
          };
        }

        if (yuklama.turi === "suhbat") {
          /*
            Suhbat fayli — faqat yozish huquqi bor qatnashchi yuklaydi.
            Ruxsat mantig'i `suhbat.ts` da bir joyda: bu yerda ham,
            xabar yuborish amalida ham o'sha funksiya ishlatiladi.
          */
          const suhbat = await db.suhbat.findUnique({
            where: { id: yuklama.suhbatId },
            select: {
              developerId: true,
              problem: { select: { organizationId: true } },
            },
          });
          if (!suhbat) throw new Error("Suhbat topilmadi");

          if (!yozaOladimi(suhbatRoli(foydalanuvchi, suhbat))) {
            throw new Error("Bu suhbatga fayl yuborish huquqingiz yo'q");
          }
          if (!pathname.startsWith(`suhbat/${yuklama.suhbatId}/`)) {
            throw new Error("Yo'l noto'g'ri");
          }

          return {
            allowedContentTypes: [...HUJJAT_TURLARI],
            maximumSizeInBytes: maksimalHajm(),
            addRandomSuffix: false,
          };
        }

        throw new Error("Yuklama turi noma'lum");
      },

      /*
        Yuklash tugagach Vercel shu manzilga webhook yuboradi. Lekin u
        faqat ochiq domenda ishlaydi — localhost'ga yetib kelmaydi.
        Shu sababli bazaga yozish bu yerda EMAS, mijoz chaqiradigan
        alohida amalda qilinadi (`rasmniBiriktir`, `fayllarniBiriktir`,
        `xabarYubor`).
        Ular yo'l prefiksini qaytadan tekshiradi.
      */
      onUploadCompleted: async () => {},
    });

    return Response.json(javob);
  } catch (e) {
    const xabar = e instanceof Error ? e.message : "Yuklab bo'lmadi";
    return Response.json({ error: xabar }, { status: 400 });
  }
}
