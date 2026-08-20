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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
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
