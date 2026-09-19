import {
  double,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  price: double("price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealIngredients = mysqlTable("meal_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  mealId: int("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: double("quantity"),
  unit: varchar("unit", { length: 64 }),
});

export const essentialItems = mysqlTable("essential_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  category: varchar("category", { length: 255 }).notNull(),
  printName: varchar("print_name", { length: 255 }).notNull(),
  price: double("price"),
});

export type Meal = typeof meals.$inferSelect;
export type MealIngredient = typeof mealIngredients.$inferSelect;
export type EssentialItem = typeof essentialItems.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;

export type IngredientInput = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
};

export type MergedIngredient = {
  name: string;
  quantity?: number;
  unit?: string;
  display: string;
};
