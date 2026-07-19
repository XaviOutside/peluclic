-- Drop old word-based FTS indexes (managed via Prisma @@fulltext, now removed)
DROP INDEX `clients_name_email_idx` ON `clients`;
DROP INDEX `pets_name_breed_notes_idx` ON `pets`;

-- Convert clients table to accent-insensitive collation for accent folding (ñ=n, é=e, etc.)
ALTER TABLE `clients` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create ngram FTS on clients (6 columns) for substring search
CREATE FULLTEXT INDEX `clients_ngram_fts_idx` ON `clients` (`name`, `email`, `phone`, `phone2`, `address`, `notes`) WITH PARSER ngram;

-- Create ngram FTS on pets (3 columns) for pet-name/breed/notes substring search
CREATE FULLTEXT INDEX `pets_ngram_fts_idx` ON `pets` (`name`, `breed`, `notes`) WITH PARSER ngram;
