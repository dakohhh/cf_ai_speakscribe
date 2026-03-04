CREATE TABLE `file` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`size` integer,
	`etag` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
