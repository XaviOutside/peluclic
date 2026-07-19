-- Create company_settings table — singleton row with company config
CREATE TABLE `company_settings` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `company_name`   VARCHAR(200) NOT NULL,
  `workdays`       JSON         NOT NULL COMMENT 'Array of integers 1–7 (Mon=1, Sun=7)',
  `work_start_time` VARCHAR(5)  NOT NULL COMMENT 'HH:MM format (e.g. 09:00)',
  `work_end_time`  VARCHAR(5)   NOT NULL COMMENT 'HH:MM format (e.g. 17:00)',
  `default_lang`   TINYINT      NOT NULL COMMENT '0=English, 1=Spanish',
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the singleton row with defaults
INSERT INTO `company_settings` (`company_name`, `workdays`, `work_start_time`, `work_end_time`, `default_lang`)
VALUES ('Bark & Bubbles', '[1, 2, 3, 4, 5]', '09:00', '17:00', 0);
