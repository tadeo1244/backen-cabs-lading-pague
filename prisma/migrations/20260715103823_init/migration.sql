-- CreateTable
CREATE TABLE "google_maps_data" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "totalRatings" INTEGER,
    "reviews" JSONB,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_maps_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_scraping_data" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "data" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_scraping_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataHash" TEXT,
    "errorMessage" TEXT,
    "recordsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_maps_data_placeId_key" ON "google_maps_data"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "web_scraping_data_sourceUrl_key" ON "web_scraping_data"("sourceUrl");
