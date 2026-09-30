-- Additive LOOK taxonomy. Historical observations, if any, remain unclassified (NULL).
ALTER TYPE "LookPlatform" ADD VALUE IF NOT EXISTS 'MUSINSA_STYLE';
ALTER TYPE "LookPlatform" ADD VALUE IF NOT EXISTS 'OTHER_WEB';
CREATE TYPE "LookObservationType" AS ENUM ('REAL_WEAR', 'CURATED_LOOK', 'STYLE_MEDIA');
ALTER TABLE "LookObservation" ADD COLUMN "observationType" "LookObservationType";
