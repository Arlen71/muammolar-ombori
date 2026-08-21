import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

/*
  Uch shrift — uch vazifa:

    Inter              matn va forma elementlari. Zich interfeysda eng
                       o'qilishli variant, tabular raqamlari jadvalda
                       ustma-ust tushadi.
    Schibsted Grotesk  sarlavhalar va yirik raqamlar. Skandinaviya
                       jamoat matbuoti uchun chizilgan — rasmiy, lekin
                       zamonaviy ohang beradi va sahifaga o'z yuzini
                       qo'shadi.
    JetBrains Mono     muammo kodlari (M-2026-0005) va texnik qiymatlar.
                       Nol va O harfi ajralib turadi — kod aynan kodday
                       ko'rinadi.

  Hammasi latin-ext bilan: o'zbek lotin yozuvidagi belgilar uchun shart.
*/
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Muammolar ombori",
    template: "%s — Muammolar ombori",
  },
  description:
    "Davlat tashkilotlari muammolarini yig'ish va dasturchilarga yetkazish tizimi",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Brauzer paneli sahifa foniga qo'shilib ketsin — mobil qurilmada
  // ranglar bir-biriga urishib turmasligi uchun
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

/*
  Mavzuni birinchi bo'yashdan OLDIN qo'yadi.

  React ishga tushguncha sahifa allaqachon ekranga chiqib bo'ladi. Agar
  mavzu React ichida qo'yilsa, qorong'i mavzudagi foydalanuvchi har bir
  o'tishda oq ekranning bir lahzalik chaqnashini ko'radi — kechqurun bu
  ko'zni qamashtiradi.

  Shu sababli bu kichik skript `<body>` ning eng boshida turadi va
  sinxron bajariladi. Tanlov bo'lmasa tizim sozlamasi olinadi.

  Kalit `mavzu.tsx` dagi MAVZU_KALITI bilan bir xil bo'lishi shart.
*/
const MAVZU_SKRIPTI = `
try {
  var t = localStorage.getItem("muammolar-ombori:mavzu");
  if (t === "qorongi" || (t === null && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /*
      `suppressHydrationWarning` — aynan shu holat uchun.

      Yuqoridagi skript React'dan oldin `<html>` ga `dark` sinfini qo'shadi,
      serverdan kelgan HTML'da esa u yo'q: server foydalanuvchining mavzu
      tanlovini bilmaydi, u faqat brauzerdagi `localStorage` da. React buni
      nomuvofiqlik deb hisoblaydi va ogohlantiradi.

      Belgi faqat SHU elementning atributlariga ta'sir qiladi, ichkariga
      o'tmaydi — ya'ni haqiqiy nomuvofiqliklar baribir ko'rinadi.
    */
    <html
      lang="uz"
      className={`${inter.variable} ${schibsted.variable} ${jbMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: MAVZU_SKRIPTI }} />
        <a
          href="#asosiy"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-yuza focus:ring-2 focus:ring-asosiy focus:px-4 focus:py-2 focus:shadow-lg"
        >
          Asosiy qismga o'tish
        </a>
        {children}
      </body>
    </html>
  );
}
