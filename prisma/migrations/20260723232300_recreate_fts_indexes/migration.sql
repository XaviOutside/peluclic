-- Recreate FULLTEXT indexes on clients and pets that were dropped
-- when company_id columns were added via ALTER TABLE in migration 20260723222300.
-- MySQL InnoDB drops FULLTEXT indexes during certain ALTER TABLE operations.
-- The services FULLTEXT index survived; this migration only restores the two that were lost.
--
-- Idempotent: conditional DROP compatible with all MySQL 8.0 versions.

-- Clients: ngram FTS on 6 columns for substring search
SET @_tbl = 'clients', @_idx = 'clients_ngram_fts_idx';
SET @_cnt = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @_tbl AND index_name = @_idx);
SET @_sql = IF(@_cnt > 0, CONCAT('DROP INDEX `', @_idx, '` ON `', @_tbl, '`'), 'SELECT "skipping clients_ngram_fts_idx" AS _msg');
PREPARE _stmt FROM @_sql; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

CREATE FULLTEXT INDEX `clients_ngram_fts_idx` ON `clients` (`name`, `email`, `phone`, `phone2`, `address`, `notes`) WITH PARSER ngram;

-- Pets: ngram FTS on 3 columns for pet-name/breed/notes substring search
SET @_tbl = 'pets', @_idx = 'pets_ngram_fts_idx';
SET @_cnt = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = @_tbl AND index_name = @_idx);
SET @_sql = IF(@_cnt > 0, CONCAT('DROP INDEX `', @_idx, '` ON `', @_tbl, '`'), 'SELECT "skipping pets_ngram_fts_idx" AS _msg');
PREPARE _stmt FROM @_sql; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

CREATE FULLTEXT INDEX `pets_ngram_fts_idx` ON `pets` (`name`, `breed`, `notes`) WITH PARSER ngram;
