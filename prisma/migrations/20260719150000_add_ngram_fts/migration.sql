-- Drop old word-based FTS indexes if they exist (from legacy Prisma @@fulltext, now removed).
-- Uses idempotent conditional DROP compatible with all MySQL 8.0 versions.

-- Helper: drop an index if it exists on a table
SET @_tbl = 'clients', @_idx = 'clients_name_email_idx';
SET @_cnt = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @_tbl AND index_name = @_idx);
SET @_sql = IF(@_cnt > 0, CONCAT('DROP INDEX `', @_idx, '` ON `', @_tbl, '`'), 'SELECT "skipping clients_name_email_idx" AS _msg');
PREPARE _stmt FROM @_sql; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

SET @_tbl = 'pets', @_idx = 'pets_name_breed_notes_idx';
SET @_cnt = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @_tbl AND index_name = @_idx);
SET @_sql = IF(@_cnt > 0, CONCAT('DROP INDEX `', @_idx, '` ON `', @_tbl, '`'), 'SELECT "skipping pets_name_breed_notes_idx" AS _msg');
PREPARE _stmt FROM @_sql; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- Convert clients table to accent-insensitive collation for accent folding (ñ=n, é=e, etc.)
ALTER TABLE `clients` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create ngram FTS on clients (6 columns) for substring search
CREATE FULLTEXT INDEX `clients_ngram_fts_idx` ON `clients` (`name`, `email`, `phone`, `phone2`, `address`, `notes`) WITH PARSER ngram;

-- Create ngram FTS on pets (3 columns) for pet-name/breed/notes substring search
CREATE FULLTEXT INDEX `pets_ngram_fts_idx` ON `pets` (`name`, `breed`, `notes`) WITH PARSER ngram;
