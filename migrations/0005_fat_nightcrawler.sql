PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transcription` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`duration` real,
	`fileId` text,
	`detectedLanguage` text,
	`workflowInstanceId` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transcription`("id", "name", "status", "duration", "fileId", "detectedLanguage", "workflowInstanceId", "createdAt", "updatedAt") SELECT "id", "name", "status", "duration", "fileId", "detectedLanguage", "workflowInstanceId", "createdAt", "updatedAt" FROM `transcription`;--> statement-breakpoint
DROP TABLE `transcription`;--> statement-breakpoint
ALTER TABLE `__new_transcription` RENAME TO `transcription`;--> statement-breakpoint
PRAGMA foreign_keys=ON;