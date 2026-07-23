-- CreateTable: companies
CREATE TABLE `companies` (
    `id`         INT         NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(200) NOT NULL,
    `status`     TINYINT     NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: users
CREATE TABLE `users` (
    `id`            INT          NOT NULL AUTO_INCREMENT,
    `company_id`    INT          NOT NULL COMMENT 'ref: companies.id',
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role`          TINYINT      NOT NULL DEFAULT 1 COMMENT '0=admin, 1=employee',
    `status`        TINYINT      NOT NULL DEFAULT 1 COMMENT '0=inactive, 1=active',
    `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at`    DATETIME(3)  NOT NULL,
    `deleted_at`    DATETIME(3)  NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `users_email_key` (`email`),
    INDEX `users_company_id_idx` (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: sessions
CREATE TABLE `sessions` (
    `id`         INT         NOT NULL AUTO_INCREMENT,
    `token`      VARCHAR(36) NOT NULL,
    `user_id`    INT         NOT NULL COMMENT 'ref: users.id',
    `company_id` INT         NOT NULL COMMENT 'ref: companies.id (denormalized)',
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `sessions_token_key` (`token`),
    INDEX `sessions_user_id_idx` (`user_id`),
    INDEX `sessions_company_id_idx` (`company_id`),
    INDEX `sessions_expires_at_idx` (`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: add company_id to existing tables (existing rows default to company_id=1)
ALTER TABLE `clients` ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 COMMENT 'ref: companies.id',
    ADD INDEX `clients_company_id_idx` (`company_id`);

ALTER TABLE `pets` ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 COMMENT 'ref: companies.id',
    ADD INDEX `pets_company_id_idx` (`company_id`);

ALTER TABLE `services` ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 COMMENT 'ref: companies.id',
    ADD INDEX `services_company_id_idx` (`company_id`);

ALTER TABLE `appointments` ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 COMMENT 'ref: companies.id',
    ADD INDEX `appointments_company_id_idx` (`company_id`);

ALTER TABLE `company_settings` ADD COLUMN `company_id` INT NOT NULL DEFAULT 1 COMMENT 'ref: companies.id',
    ADD INDEX `company_settings_company_id_idx` (`company_id`);
