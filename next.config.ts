import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

/*
  `next dev` ichida Cloudflare bindinglarini (R2, rate limit) ochadi.

  Bu tufayli lokal muhit ishlab chiqarish bilan bir xil bo'ladi: fayllar
  lokalda ham R2 orqali saqlanadi (miniflare beradigan lokal taqlid),
  shuning uchun kodda "disk yoki R2" degan ikkinchi yo'l saqlanmaydi.

  Funksiya ishlab chiqarish buildida o'zi hech narsa qilmaydi. `await`
  ishlatilmaydi: Next konfiguratsiya faylini CJS orqali yuklaydi va
  top-level await uni buzadi.
*/
void initOpenNextCloudflareForDev();
