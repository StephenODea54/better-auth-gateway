ALTER TABLE "sso_provider" ADD COLUMN "domain_verified" boolean DEFAULT false NOT NULL;
UPDATE "sso_provider" SET "domain_verified" = true;
