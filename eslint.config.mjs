import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // eslint-config-next standart ignorlari
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma generatsiya qiladigan kod — tekshirilmaydi
    "src/generated/**",
  ]),
  {
    rules: {
      /*
        O'zbek lotin yozuvida apostrof — bu HARF (o', g', ta'til), tinish belgisi emas.
        `react/no-unescaped-entities` ingliz tilidagi tirnoqlar uchun mo'ljallangan;
        bu yerda u har bir o'zbekcha so'zni `&apos;` bilan to'ldirishga majbur qilib,
        manba matnini o'qib bo'lmas holga keltiradi.
      */
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
