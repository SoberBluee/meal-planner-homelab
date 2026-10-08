CREATE TABLE `people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `people_id` PRIMARY KEY(`id`),
	CONSTRAINT `people_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `shop_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `shop_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_sections_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
INSERT INTO `shop_sections` (`name`, `sort_order`) VALUES
	('Fruit', 0),
	('Vegetable', 1),
	('Meat', 2),
	('Fish', 3),
	('Dairy', 4),
	('Bakery', 5),
	('Pantry', 6),
	('Frozen', 7),
	('Other', 8);
