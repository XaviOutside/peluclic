-- Add consent_given_at column to clients for GDPR Art. 7 compliance
-- Nullable: existing clients created before GDPR implementation have NULL
ALTER TABLE `clients` ADD COLUMN `consent_given_at` DATETIME(3) NULL;
