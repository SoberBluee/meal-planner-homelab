CREATE TABLE `ingredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`category` varchar(255) NOT NULL,
	`print_name` varchar(255) NOT NULL,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
