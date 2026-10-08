import { asc } from "drizzle-orm";
import { db } from "./db";
import { CACHE_KEYS, cached } from "./redis";
import {
  essentialItems,
  ingredients,
  mealIngredients,
  meals,
  people,
  shopSections,
} from "./schema";
import type {
  EssentialItemRecord,
  IngredientRecord,
  MealWithIngredients,
  PersonRecord,
  ShopLayout,
} from "./types";
import { INGREDIENT_CATEGORIES } from "./types";

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

export function getShopLayout(): Promise<ShopLayout> {
  return cached(CACHE_KEYS.shopLayout, async () => {
    const [initialSections, allIngredients] = await Promise.all([
      db
        .select()
        .from(shopSections)
        .orderBy(asc(shopSections.sortOrder), asc(shopSections.name)),
      db
        .select()
        .from(ingredients)
        .orderBy(asc(ingredients.sortOrder), asc(ingredients.name)),
    ]);
    let sections = initialSections;

    if (sections.length === 0) {
      await db
        .insert(shopSections)
        .ignore()
        .values(
          INGREDIENT_CATEGORIES.map((name, sortOrder) => ({
            name,
            sortOrder,
          })),
        );
      sections = await db
        .select()
        .from(shopSections)
        .orderBy(asc(shopSections.sortOrder), asc(shopSections.name));
    }

    return { sections, ingredients: allIngredients };
  });
}

export function getPeople(): Promise<PersonRecord[]> {
  return cached(CACHE_KEYS.people, () =>
    db
      .select()
      .from(people)
      .orderBy(asc(people.sortOrder), asc(people.name)),
  );
}
