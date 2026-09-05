import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { baytdan, baytga, kosinus, matnBelgisi, muammoMatni } from "./vektor";

/*
  Vektor matematikasi jimgina buziladigan turdagi kod: xato bo'lsa dastur
  yiqilmaydi, shunchaki qidiruv noto'g'ri javob beradi va buni ko'z bilan
  sezib bo'lmaydi. Shuning uchun testlar.
*/

/** Uzunligi 1 ga teng qilib beruvchi yordamchi (embedding.ts ichidagidek). */
function normalla(sonlar: number[]): Float32Array {
  const v = Float32Array.from(sonlar);
  const uzunlik = Math.sqrt(v.reduce((y, q) => y + q * q, 0));
  return v.map((q) => q / uzunlik);
}

describe("baytga / baytdan", () => {
  test("vektor baytga aylanib, o'zgarmasdan qaytadi", () => {
    const asl = Float32Array.from([0.5, -0.25, 0.125, 1, -1, 0]);
    const qaytgan = baytdan(baytga(asl));

    assert.equal(qaytgan.length, asl.length);
    for (let i = 0; i < asl.length; i++) {
      assert.equal(qaytgan[i], asl[i], `${i}-element mos kelmadi`);
    }
  });

  test("256 o'lchamli vektor 1024 bayt egallaydi", () => {
    // Bu hajm bejiz emas: qidiruvda barcha vektorlar HTTP orqali o'qiladi.
    // `Float[]` bo'lganida JSON'da besh barobar ko'p joy ketardi.
    const v = new Float32Array(256).fill(0.1);
    assert.equal(baytga(v).byteLength, 1024);
  });

  test("bo'sh vektor ham buzilmaydi", () => {
    assert.equal(baytdan(baytga(new Float32Array(0))).length, 0);
  });
});

describe("kosinus", () => {
  test("bir xil vektorlar 1 beradi", () => {
    const v = normalla([1, 2, 3, 4]);
    assert.ok(Math.abs(kosinus(v, v) - 1) < 1e-6);
  });

  test("perpendikulyar vektorlar 0 beradi", () => {
    assert.ok(Math.abs(kosinus(normalla([1, 0]), normalla([0, 1]))) < 1e-6);
  });

  test("qarama-qarshi vektorlar -1 beradi", () => {
    assert.ok(Math.abs(kosinus(normalla([1, 1]), normalla([-1, -1])) + 1) < 1e-6);
  });

  test("yaqin vektor uzoqdan yuqori ball oladi", () => {
    const soralgan = normalla([1, 0, 0]);
    const yaqin = normalla([0.9, 0.1, 0]);
    const uzoq = normalla([0.1, 0.9, 0.4]);
    assert.ok(kosinus(soralgan, yaqin) > kosinus(soralgan, uzoq));
  });

  test("o'lchamlar mos kelmasa xato tashlamaydi, 0 qaytaradi", () => {
    /*
      Bu model almashgan, lekin eski vektorlar hali qayta hisoblanmagan
      degani. Xato tashlansa butun sahifa yiqilardi — qidiruv esa
      shunchaki natija bermasligi kerak.
    */
    assert.equal(kosinus(Float32Array.from([1, 0]), Float32Array.from([1, 0, 0])), 0);
  });
});

describe("muammoMatni", () => {
  test("sarlavha, tavsif va jarayonni birlashtiradi", () => {
    const matn = muammoMatni({
      title: "Ariza qo'lda yoziladi",
      description: "Xodim qog'ozga yozadi",
      currentProcess: "1. Yozadi 2. Imzolatadi",
    });
    assert.ok(matn.includes("Ariza qo'lda yoziladi"));
    assert.ok(matn.includes("Xodim qog'ozga yozadi"));
    assert.ok(matn.includes("Imzolatadi"));
  });

  test("bo'sh maydonlarni tashlab ketadi", () => {
    const matn = muammoMatni({ title: "Sarlavha", description: null, currentProcess: "  " });
    assert.equal(matn, "Sarlavha");
  });

  test("sarlavha doim birinchi qatorda", () => {
    // Trigramga tushib qolganda `oxshashMuammolar` faqat birinchi qatorni
    // ishlatadi — sarlavha o'sha yerda turishi shart.
    const matn = muammoMatni({ title: "Sarlavha", description: "Tavsif" });
    assert.equal(matn.split("\n")[0], "Sarlavha");
  });

  test("juda uzun matn qirqiladi", () => {
    const matn = muammoMatni({ title: "S", description: "x".repeat(9000) });
    assert.ok(matn.length <= 4000);
  });
});

describe("matnBelgisi", () => {
  test("bir xil matn bir xil belgi beradi", () => {
    assert.equal(matnBelgisi("salom"), matnBelgisi("salom"));
  });

  test("o'zgargan matn boshqa belgi beradi", () => {
    // Shu tufayli tahrirlangan kartochka vektori qayta hisoblanadi
    assert.notEqual(matnBelgisi("salom"), matnBelgisi("salom "));
  });
});
