import { Skelet, SkeletJadval } from "@/components/ui";

/*
  DIQQAT: `loading.tsx` ni har qanday bo'limga qo'shib bo'lmaydi.

  Bu fayl butun segmentni oqim (streaming) rejimiga o'tkazadi: Next
  javob sarlavhasini va skeletni darhol jo'natadi, kontent esa keyin
  keladi. Ya'ni sarlavha allaqachon ketgan bo'ladi va shundan keyin
  chaqirilgan `notFound()` HTTP statusini o'zgartira olmaydi — sahifa
  404 o'rniga **200** qaytaradi.

  Yopiq omborda bu jiddiy: ruxsat yo'q resursga 200 javob berish
  "bunday sahifa bor" degani va u keshlarga tushib qolishi mumkin.

  Shu sababli `loading.tsx` faqat shu yerda — administrator bo'limida
  hech qaysi sahifa `notFound()` chaqirmaydi. `/ombor` va `/rahbar`
  ostida esa chaqiriladi (`/ombor/[id]`, `/rahbar/muammo/[id]/…`),
  shuning uchun u yerda skelet yo'q.

  Bu `npm run e2e` da tekshiriladi: "boshqa tashkilot muammosi 404
  beradi" va "qoralama omborda 404 beradi".
*/

/** Administrator bo'limlari yuklanayotgan paytdagi ekran. */
export default function Yuklanmoqda() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skelet className="h-8 w-48" />
          <Skelet className="h-4 w-80 max-w-full" />
        </div>
        <Skelet className="h-11 w-40" />
      </div>

      <SkeletJadval qatorlar={6} />
    </>
  );
}
