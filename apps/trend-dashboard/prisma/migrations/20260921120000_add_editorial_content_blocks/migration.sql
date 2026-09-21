-- CreateTable
CREATE TABLE "EditorialContentBlock" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "blockIndex" INTEGER NOT NULL,
    "blockType" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorialContentBlock_postId_blockIndex_key" ON "EditorialContentBlock"("postId", "blockIndex");

-- CreateIndex
CREATE INDEX "EditorialContentBlock_postId_idx" ON "EditorialContentBlock"("postId");

-- CreateIndex
CREATE INDEX "EditorialContentBlock_blockType_idx" ON "EditorialContentBlock"("blockType");

-- AddForeignKey
ALTER TABLE "EditorialContentBlock" ADD CONSTRAINT "EditorialContentBlock_postId_fkey" FOREIGN KEY ("postId") REFERENCES "EditorialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
