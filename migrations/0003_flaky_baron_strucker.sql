PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_speakerTurn` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`start` real NOT NULL,
	`end` real NOT NULL,
	`orderNo` integer NOT NULL,
	`transcriptionId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`transcriptionId`) REFERENCES `transcription`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_speakerTurn`("id", "content", "start", "end", "orderNo", "transcriptionId", "createdAt", "updatedAt") SELECT "id", "content", "start", "end", "orderNo", "transcriptionId", "createdAt", "updatedAt" FROM `speakerTurn`;--> statement-breakpoint
DROP TABLE `speakerTurn`;--> statement-breakpoint
ALTER TABLE `__new_speakerTurn` RENAME TO `speakerTurn`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `transcription` ADD `detectedLanguage` text;