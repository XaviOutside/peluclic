-- Recreate FULLTEXT indexes on clients and pets that were dropped
-- when company_id columns were added via ALTER TABLE in migration 20260723222300.
-- MySQL InnoDB drops FULLTEXT indexes during certain ALTER TABLE operations.
-- The services FULLTEXT index survived; this migration only restores the two that were lost.
--
-- Idempotent: uses DROP IF EXISTS before CREATE to handle both fresh DBs
-- (where indexes were never dropped) and existing DBs (where they were).

-- Clients: ngram FTS on 6 columns for substring search
DROP INDEX IF EXISTS `clients_ngram_fts_idx` ON `clients`;
CREATE FULLTEXT INDEX `clients_ngram_fts_idx` ON `clients` (`name`, `email`, `phone`, `phone2`, `address`, `notes`) WITH PARSER ngram;

-- Pets: ngram FTS on 3 columns for pet-name/breed/notes substring search
DROP INDEX IF EXISTS `pets_ngram_fts_idx` ON `pets`;
CREATE FULLTEXT INDEX `pets_ngram_fts_idx` ON `pets` (`name`, `breed`, `notes`) WITH PARSER ngram;
