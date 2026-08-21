/**
 * Sakkiz qirrali yulduz naqshi — Oqsaroy koshinlaridan.
 *
 * Qashqadaryoning eng tanilgan me'moriy yodgorligi — Shahrisabzdagi
 * Oqsaroy — Temuriylar davri koshinkorligining namunasi. Uning asosiy
 * motivi: ikki kvadratning 45° ga burab ustma-ust qo'yilishidan hosil
 * bo'ladigan sakkiz qirrali yulduz (xatam). Shu geometriya sahifaning
 * fon naqshi bo'lib xizmat qiladi — tizim qaysi hudud uchun qurilganini
 * so'zsiz aytib turadi.
 *
 * Texnik jihatlar:
 *   - Chiziqlar `currentColor` — rang ota elementdagi matn rangidan
 *     olinadi, ya'ni ikkala mavzuda ham alohida sozlash kerak emas.
 *   - `aria-hidden` — bu sof bezak, ekran o'quvchiga keraksiz.
 *   - Juda past shaffoflikda ishlatiladi (ota elementda `text-.../10`
 *     kabi) — naqsh sezilsin, lekin o'qishga xalaqit bermasin.
 */
export function Naqsh({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" role="presentation">
      <defs>
        <pattern id="xatam" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* To'g'ri kvadrat */}
          <path
            d="M 34 34 L 86 34 L 86 86 L 34 86 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* 45° ga burilgan kvadrat — birgalikda sakkiz qirrali yulduz */}
          <path
            d="M 60 23.2 L 96.8 60 L 60 96.8 L 23.2 60 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* Katak burchaklaridagi mayda romblar — panjara tuyg'usi */}
          <path
            d="M 0 -6 L 6 0 L 0 6 L -6 0 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M 120 114 L 126 120 L 120 126 L 114 120 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M 0 114 L 6 120 L 0 126 L -6 120 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M 120 -6 L 126 0 L 120 6 L 114 0 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#xatam)" />
    </svg>
  );
}
