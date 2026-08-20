import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  // latin-ext o'zbek lotin yozuvidagi belgilar uchun kerak
  subsets: ["latin", "latin-ext"],
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
    <html lang="uz" className={`${inter.variable} h-full`} suppressHydrationWarning>
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
