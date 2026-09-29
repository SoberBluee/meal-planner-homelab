import { asc } from "drizzle-orm";
import { db } from "./db";
import { CACHE_KEYS, cached } from "./redis";
import { essentialItems, ingredients, mealIngredients, meals } from "./schema";
import type {
  EssentialItemRecord,
  IngredientRecord,
  MealWithIngredients,
} from "./types";

export function getMealsWithIngredients(): Promise<MealWithIngredients[]> {
  return cached(CACHE_KEYS.meals, async () => {
    const [allMeals, allIngredients] = await Promise.all([
      db.select().from(meals).orderBy(asc(meals.title)),
      db.select().from(mealIngredients),
    ]);

    const byMeal = new Map<number, MealWithIngredients["ingredients"]>();
    for (const ingredient of allIngredients) {
      const list = byMeal.get(ingredient.mealId) ?? [];
      list.push(ingredient);
      byMeal.set(ingredient.mealId, list);
    }

    return allMeals.map((meal) => ({
      ...meal,
      ingredients: byMeal.get(meal.id) ?? [],
    }));
  });
}

export function getIngredients(): Promise<IngredientRecord[]> {
  return cached(CACHE_KEYS.ingredients, () =>
    db.select().from(ingredients).orderBy(asc(ingredients.name)),
  );
}

export function getEssentials(): Promise<EssentialItemRecord[]> {
  return cached(CACHE_KEYS.essentials, () =>
    db
      .select()
      .from(essentialItems)
      .orderBy(asc(essentialItems.sortOrder), asc(essentialItems.name)),
  );
}
