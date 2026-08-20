import Link from "next/link";

import { Tugma } from "@/components/ui";

/**
 * Topilmadi sahifasi.
 *
 * Bu ekran ruxsat yo'qligida ham chiqadi: masalan rahbar boshqa
 * tashkilotning muammosini ochmoqchi bo'lsa, tizim 403 emas, 404 beradi.
 * Farqi bor — 403 "bunday muammo bor, lekin sizga ko'rinmaydi" degani,
 * ya'ni yopiq ombor haqida ma'lumot sizib chiqadi. Shuning uchun matn
 * ham neytral: yo'q yoki ruxsat yo'q, qaysi biri ekani aytilmaydi.
 */
export default function Topilmadi() {
  return (
    <main
      id="asosiy"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <p className="text-sm font-medium text-matn-uchinchi">404</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-matn">
        Sahifa topilmadi
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-matn-ikkilamchi">
        Bunday sahifa yo'q yoki uni ko'rish uchun sizda ruxsat yo'q.
        Manzil to'g'ri yozilganini tekshiring.
      </p>

      <div className="mt-6">
        <Link href="/">
          <Tugma>Bosh sahifaga qaytish</Tugma>
        </Link>
      </div>
    </main>
  );
}
