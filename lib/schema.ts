import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  price: real("price"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const mealIngredients = sqliteTable("meal_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mealId: integer("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
});

export const essentialItems = sqliteTable("essential_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type Meal = typeof meals.$inferSelect;
export type MealIngredient = typeof mealIngredients.$inferSelect;
export type EssentialItem = typeof essentialItems.$inferSelect;

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
