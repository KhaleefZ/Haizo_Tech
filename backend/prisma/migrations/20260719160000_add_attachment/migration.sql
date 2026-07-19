-- Phase 6 (additive). Object-storage upload records.

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_key_key" ON "Attachment"("key");

-- CreateIndex
CREATE INDEX "Attachment_status_idx" ON "Attachment"("status");
