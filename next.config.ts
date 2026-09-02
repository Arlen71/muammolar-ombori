import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Har bir joylashtirishga o'z belgisi.

    Server action'lar URL bilan emas, yig'ish paytida hisoblangan xesh
    bilan chaqiriladi. Yangi versiya chiqqanda xeshlar almashadi,
    brauzerda ochiq turgan eski sahifa esa eskisini yuboradi va javob
    «Server action not found» bo'ladi — foydalanuvchi buni «Kutilmagan
    xatolik» ekrani sifatida ko'radi. Bu ayniqsa uzoq ochiq turadigan
    ish sahifalarida sezilarli: rahbar ertalab ochgan sahifa kun
    davomida shunday «buzilib» qolishi mumkin.

    Bu qiymat so'rovga qaysi versiyadan kelganini yozib qo'yadi.
    Vercel'da loyiha sozlamalarida «Skew Protection» yoqilgan bo'lsa
    (Settings → Advanced), platforma bunday so'rovni o'sha eski
    versiyaga yo'naltiradi va u ishlab ketaveradi.

    Chiqish tugmasi baribir bunga bog'liq emas: u oddiy forma bo'lib
    qat'iy manzilga POST qiladi (`src/app/chiqish/route.ts`).
  */
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,

  experimental: {
    serverActions: {
      /*
        Server action tanasi uchun chegara. Next'ning standarti 1 MB va
        u sehrgarning uzun matnli qadamlari uchun yetarli, lekin chegara
        ochiq yozilgani ma'qul — aks holda maydon qo'shilganda kutilmagan
        joyda yiqilardi.

        DIQQAT: bu qiymatni oshirib fayl yuklashni hal qilib bo'lmaydi.
        Vercel serverless funksiyasiga 4.5 MB dan katta tana umuman
        kirmaydi (o'lchangan: 4 MB o'tadi, 4.4 MB da 413
        FUNCTION_PAYLOAD_TOO_LARGE) va bu platforma cheklovi. Shuning
        uchun fayllar brauzerdan omborga BEVOSITA yuklanadi —
        `src/app/api/yuklash/route.ts` ga qarang.
      */
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
