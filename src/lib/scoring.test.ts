import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  oylikYoqotilganSoat,
  toliqlikFoizi,
  toliqlikHolati,
  tasirBalli,
  soatMatni,
  TOLIQLIK_OGIRLIGI,
} from "./scoring";

describe("oylikYoqotilganSoat", () => {
  test("5 xodim, kuniga 3 marta, har biri 20 daqiqa = 110 soat", () => {
    // 3 × 22 ish kuni = 66 marta/oy; 66 × 20 daq = 1320 daq = 22 soat; × 5 xodim = 110
    const soat = oylikYoqotilganSoat({
      frequency: 3,
      frequencyUnit: "DAY",
      minutesPerCase: 20,
      peopleAffected: 5,
    });
    assert.equal(soat, 110);
  });

  test("haftalik va oylik birliklar to'g'ri hisoblanadi", () => {
    // haftasiga 1 marta, 60 daqiqa, 1 xodim = 4.33 soat
    assert.equal(
      oylikYoqotilganSoat({
        frequency: 1,
        frequencyUnit: "WEEK",
        minutesPerCase: 60,
        peopleAffected: 1,
      }),
      4.3
    );
    // oyiga 2 marta, 90 daqiqa, 3 xodim = 9 soat
    assert.equal(
      oylikYoqotilganSoat({
        frequency: 2,
        frequencyUnit: "MONTH",
        minutesPerCase: 90,
        peopleAffected: 3,
      }),
      9
    );
  });

  test("yillik birlik oyga bo'linadi", () => {
    // yiliga 12 marta, 60 daqiqa, 1 xodim = oyiga 1 soat
    assert.equal(
      oylikYoqotilganSoat({
        frequency: 12,
        frequencyUnit: "YEAR",
        minutesPerCase: 60,
        peopleAffected: 1,
      }),
      1
    );
  });

  test("xodimlar soni ko'rsatilmasa 1 kishi deb olinadi", () => {
    const bir = oylikYoqotilganSoat({
      frequency: 1,
      frequencyUnit: "MONTH",
      minutesPerCase: 60,
      peopleAffected: null,
    });
    assert.equal(bir, 1);
  });

  test("yetishmayotgan ma'lumotda 0 qaytaradi, xato bermaydi", () => {
    assert.equal(oylikYoqotilganSoat({}), 0);
    assert.equal(
      oylikYoqotilganSoat({ frequency: 5, frequencyUnit: null, minutesPerCase: 10 }),
      0
    );
    assert.equal(
      oylikYoqotilganSoat({ frequency: 5, frequencyUnit: "DAY", minutesPerCase: null }),
      0
    );
  });
});

describe("toliqlikFoizi", () => {
  const toliqKartochka = {
    title: "Ta'tilga chiqish arizasi qo'lda yoziladi",
    description: "a".repeat(120),
    categoryId: "cat_1",
    painTypes: ["PAPERWORK"],
    currentProcess: "b".repeat(50),
    toolsUsed: ["PAPER"],
    rolesInvolved: ["Kadrlar bo'limi mudiri"],
    attachmentsCount: 2,
    frequency: 3,
    frequencyUnit: "DAY" as const,
    minutesPerCase: 20,
    peopleAffected: 5,
    consequence: "TIME_LOST",
    dataVolume: "UNDER_100",
    usersCount: "FROM_5_TO_20",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY"],
    desiredOutcome: "c".repeat(40),
    successMetric: "1 soatda tasdiqlanadi",
    contactName: "Aliyev A.",
    contactPhone: "+998901234567",
  };

  test("og'irliklar yig'indisi aynan 100", () => {
    const jami = Object.values(TOLIQLIK_OGIRLIGI).reduce((a, b) => a + b, 0);
    assert.equal(jami, 100);
  });

  test("bo'sh kartochka = 0", () => {
    assert.equal(toliqlikFoizi({}), 0);
  });

  test("to'liq kartochka = 100", () => {
    assert.equal(toliqlikFoizi(toliqKartochka), 100);
  });

  test("qisqa tavsif hisobga olinmaydi", () => {
    // 100 belgidan qisqa tavsif to'ldirilgan deb hisoblanmaydi
    const holat = toliqlikHolati({ ...toliqKartochka, description: "juda qisqa" });
    assert.equal(holat.description, false);
    assert.equal(toliqlikFoizi({ ...toliqKartochka, description: "juda qisqa" }), 92);
  });

  test("fayl biriktirilmasa 10 ball yo'qoladi", () => {
    assert.equal(toliqlikFoizi({ ...toliqKartochka, attachmentsCount: 0 }), 90);
  });
});

describe("tasirBalli", () => {
  const asos = {
    monthlyHoursLost: 110,
    peopleAffected: 5,
    citizensAffected: 0,
    urgency: "MEDIUM" as const,
    supporterCount: 0,
    completeness: 100,
  };

  test("qo'llab-quvvatlovchi tashkilotlar ballni sezilarli oshiradi", () => {
    const yolgiz = tasirBalli(asos);
    const otuzYetti = tasirBalli({ ...asos, supporterCount: 37 });
    assert.ok(otuzYetti > yolgiz * 5, `37 ta qo'llab-quvvatlash ballni keskin oshirishi kerak: ${yolgiz} → ${otuzYetti}`);
  });

  test("shoshilinchlik ballni oshiradi", () => {
    assert.ok(tasirBalli({ ...asos, urgency: "CRITICAL" }) > tasirBalli({ ...asos, urgency: "LOW" }));
  });

  test("to'liqroq kartochka yuqoriroq turadi", () => {
    assert.ok(tasirBalli({ ...asos, completeness: 100 }) > tasirBalli({ ...asos, completeness: 40 }));
  });

  test("bitta ulkan raqam ro'yxatni egallab olmaydi (logarifm)", () => {
    const million = tasirBalli({ ...asos, citizensAffected: 1_000_000 });
    const ming = tasirBalli({ ...asos, citizensAffected: 1_000 });
    // 1000 barobar farq ballni 3 barobardan ko'p oshirmasligi kerak
    assert.ok(million < ming * 3, `logarifm ishlamayapti: ${ming} → ${million}`);
  });

  test("bo'sh ma'lumotda 0 qaytaradi", () => {
    assert.equal(tasirBalli({}), 0);
  });
});

describe("soatMatni", () => {
  test("turli oraliqlarni o'zbekcha ko'rsatadi", () => {
    assert.equal(soatMatni(0), "—");
    assert.equal(soatMatni(0.5), "30 daqiqa");
    assert.equal(soatMatni(3.5), "3,5 soat");
    assert.equal(soatMatni(12.5), "1 ish kuni 5 soat");
    assert.equal(soatMatni(16), "2 ish kuni");
  });
});
