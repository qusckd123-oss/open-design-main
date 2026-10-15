-- Additive durable image reference for LOOK observations.
-- "imageUrl" is untouched and keeps the original (temporary) source URL as provenance.
-- Existing rows remain NULL = legacy / not yet recovered.
ALTER TABLE "LookObservation" ADD COLUMN "storedImageKey" TEXT;
ALTER TABLE "LookObservation" ADD COLUMN "storedImageUrl" TEXT;
ALTER TABLE "LookObservation" ADD COLUMN "storedImageAt" TIMESTAMPTZ(3);
