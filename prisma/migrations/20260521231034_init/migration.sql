-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soal" (
    "id" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsi" JSONB NOT NULL,
    "jawaban" TEXT NOT NULL,
    "pembahasan" TEXT,
    "mapel" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LatihanSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mapel" TEXT NOT NULL,
    "skor" INTEGER,
    "selesai" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LatihanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JawabanSiswa" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "benar" BOOLEAN NOT NULL,

    CONSTRAINT "JawabanSiswa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "LatihanSession" ADD CONSTRAINT "LatihanSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LatihanSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
