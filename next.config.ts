import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
