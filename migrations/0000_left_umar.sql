CREATE TABLE `speakerTurn` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`start` real,
	`end` real,
	`orderNo` integer,
	`transcriptionId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`transcriptionId`) REFERENCES `transcription`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transcription` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`status` text DEFAULT 'pending',
	`duration` real,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
