-- CreateTable
CREATE TABLE "Suhbat" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "boshlovchiId" TEXT NOT NULL,
    "rahbarOqidi" TIMESTAMP(3),
    "dasturchiOqidi" TIMESTAMP(3),
    "oxirgiXabarAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suhbat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuhbatXabari" (
    "id" TEXT NOT NULL,
    "suhbatId" TEXT NOT NULL,
    "yuboruvchiId" TEXT NOT NULL,
    "matn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuhbatXabari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuhbatFayli" (
    "id" TEXT NOT NULL,
    "xabarId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuhbatFayli_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Suhbat_problemId_idx" ON "Suhbat"("problemId");

-- CreateIndex
CREATE INDEX "Suhbat_developerId_oxirgiXabarAt_idx" ON "Suhbat"("developerId", "oxirgiXabarAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Suhbat_problemId_developerId_key" ON "Suhbat"("problemId", "developerId");

-- CreateIndex
CREATE INDEX "SuhbatXabari_suhbatId_createdAt_idx" ON "SuhbatXabari"("suhbatId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SuhbatFayli_storedName_key" ON "SuhbatFayli"("storedName");

-- CreateIndex
CREATE INDEX "SuhbatFayli_xabarId_idx" ON "SuhbatFayli"("xabarId");

-- AddForeignKey
ALTER TABLE "Suhbat" ADD CONSTRAINT "Suhbat_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suhbat" ADD CONSTRAINT "Suhbat_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suhbat" ADD CONSTRAINT "Suhbat_boshlovchiId_fkey" FOREIGN KEY ("boshlovchiId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuhbatXabari" ADD CONSTRAINT "SuhbatXabari_suhbatId_fkey" FOREIGN KEY ("suhbatId") REFERENCES "Suhbat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuhbatXabari" ADD CONSTRAINT "SuhbatXabari_yuboruvchiId_fkey" FOREIGN KEY ("yuboruvchiId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuhbatFayli" ADD CONSTRAINT "SuhbatFayli_xabarId_fkey" FOREIGN KEY ("xabarId") REFERENCES "SuhbatXabari"("id") ON DELETE CASCADE ON UPDATE CASCADE;
