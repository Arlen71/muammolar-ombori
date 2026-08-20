import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MavzuTugmasi } from "@/components/mavzu";
import { boshSahifa, getJoriyFoydalanuvchi } from "@/lib/auth";
import { KirishFormasi } from "./kirish-formasi";

export const metadata: Metadata = { title: "Kirish" };

export default async function KirishSahifasi(props: PageProps<"/kirish">) {
  // Bazadan tekshiramiz, cookie'dan emas: cookie imzosi to'g'ri bo'lsa ham
  // foydalanuvchi o'chirilgan yoki bloklangan bo'lishi mumkin. Shu tekshiruv
  // proxy'da bo'lganida yo'naltirish halqasi hosil bo'lardi.
  const foydalanuvchi = await getJoriyFoydalanuvchi();
  if (foydalanuvchi) redirect(boshSahifa(foydalanuvchi.role));

  const params = await props.searchParams;
  const keyingi = typeof params.keyingi === "string" ? params.keyingi : undefined;

  return (
    <main id="asosiy" className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Mavzu tugmasi burchakda — kirishdan oldin ham tanlash mumkin bo'lsin */}
      <div className="absolute right-3 top-3">
        <MavzuTugmasi />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-xl font-semibold tracking-tight text-matn">
              Muammolar ombori
            </span>
          </Link>
          <p className="mt-2 text-sm text-matn-ikkilamchi">
            Davlat tashkilotlari va dasturchilarni bog'lovchi tizim
          </p>
        </div>

        <div className="rounded-xl border border-chegara bg-yuza p-6 shadow-sm sm:p-8">
          <h1 className="mb-6 text-lg font-semibold text-matn">Tizimga kirish</h1>
          <KirishFormasi keyingi={keyingi} />
        </div>

        <p className="mt-6 text-center text-sm text-matn-ikkilamchi">
          Akkauntingiz yo'qmi? Tizimga kirish huquqini administrator beradi.
          <br />
          Tashkilotingizni qo'shish uchun administratorga murojaat qiling.
        </p>
      </div>
    </main>
  );
}
