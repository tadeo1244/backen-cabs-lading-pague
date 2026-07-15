-- CreateTable
CREATE TABLE "google_reviews" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorImage" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "date" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_reviews_reviewId_key" ON "google_reviews"("reviewId");

-- CreateIndex
CREATE INDEX "google_reviews_placeId_idx" ON "google_reviews"("placeId");
