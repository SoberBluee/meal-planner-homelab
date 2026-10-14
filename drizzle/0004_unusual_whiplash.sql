CREATE TABLE `shopping_trip_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trip_id` int NOT NULL,
	`day` varchar(16) NOT NULL,
	`meal_id` int,
	`meal_title` varchar(255) NOT NULL,
	`cooker_name` varchar(255),
	CONSTRAINT `shopping_trip_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`meal_cost` double,
	`item_count` int NOT NULL DEFAULT 0,
	CONSTRAINT `shopping_trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `meals` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `shopping_trip_days` ADD CONSTRAINT `shopping_trip_days_trip_id_shopping_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `shopping_trips`(`id`) ON DELETE cascade ON UPDATE no action;