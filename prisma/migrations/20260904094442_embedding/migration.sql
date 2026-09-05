-- Semantik qidiruv uchun vektor maydonlari.
--
-- `bytea`, `double precision[]` emas: baza HTTP orqali ulangan va
-- massivdagi sonlar JSON matniga aylanib, baytlardan besh barobar ko'p
-- joy egallaydi. Qidiruvda barcha vektorlar o'qiladi, ya'ni bu farq
-- har bir so'rovda seziladi.
ALTER TABLE "Problem" ADD COLUMN "embedding" BYTEA;
ALTER TABLE "Problem" ADD COLUMN "embeddingModel" TEXT;
ALTER TABLE "Problem" ADD COLUMN "embeddingHash" TEXT;
