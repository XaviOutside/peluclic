-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `duration_minutes` INTEGER NULL,
    `price` INTEGER NOT NULL COMMENT 'cents (e.g. 2500 = $25.00)',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0=inactive, 1=active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    FULLTEXT INDEX `services_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
