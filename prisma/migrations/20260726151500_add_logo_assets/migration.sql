-- AlterTable: add logo_filename to company_settings
ALTER TABLE `company_settings`
  ADD COLUMN `logo_filename` VARCHAR(255) NULL AFTER `default_lang`;

-- CreateTable: logo_assets stores uploaded logo binaries (distributed-friendly)
CREATE TABLE `logo_assets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL DEFAULT 1,
  `filename` VARCHAR(255) NOT NULL,
  `data` LONGBLOB NOT NULL,
  `mime_type` VARCHAR(50) NOT NULL,
  `size` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `logo_assets_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
