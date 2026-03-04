CREATE TABLE `conversationMessage` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`role` text NOT NULL,
	`transcriptionId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`transcriptionId`) REFERENCES `transcription`(`id`) ON UPDATE no action ON DELETE cascade
);
