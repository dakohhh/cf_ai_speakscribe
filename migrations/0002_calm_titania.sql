ALTER TABLE `file` ADD `key` text NOT NULL;--> statement-breakpoint
ALTER TABLE `file` DROP COLUMN `content`;--> statement-breakpoint
ALTER TABLE `transcription` ADD `fileId` text REFERENCES file(id);