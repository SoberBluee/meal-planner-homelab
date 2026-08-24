CREATE TABLE `essential_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `essential_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` double,
	`unit` varchar(64),
	CONSTRAINT `meal_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`price` double,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `meal_ingredients` ADD CONSTRAINT `meal_ingredients_meal_id_meals_id_fk` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE cascade ON UPDATE no action;