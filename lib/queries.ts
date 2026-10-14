import { asc, desc, isNotNull, isNull } from "drizzle-orm";
import { db } from "./db";
import { CACHE_KEYS, cached } from "./redis";
import {
  essentialItems,
  ingredients,
  mealIngredients,
  meals,
  people,
  shoppingTripDays,
  shoppingTrips,
  shopSections,
} from "./schema";
import type {
  DeletedMealRecord,
  EssentialItemRecord,
  IngredientRecord,
  MealWithIngredients,
  PersonRecord,
  ShopLayout,
  TripDayRecord,
  TripRecord,
} from "./types";
import { INGREDIENT_CATEGORIES, WEEKDAYS } from "./types";

export function getMealsWithIngredients(): Promise<MealWithIngredients[]> {
  return cached(CACHE_KEYS.meals, async () => {
    const [allMeals, allIngredients] = await Promise.all([
      db
        .select()
        .from(meals)
        .where(isNull(meals.deletedAt))
        .orderBy(asc(meals.title)),
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

export function getDeletedMeals(): Promise<DeletedMealRecord[]> {
  return cached(CACHE_KEYS.deletedMeals, async () => {
    const [deleted, allIngredients] = await Promise.all([
      db
        .select()
        .from(meals)
        .where(isNotNull(meals.deletedAt))
        .orderBy(desc(meals.deletedAt)),
      db.select({ mealId: mealIngredients.mealId }).from(mealIngredients),
    ]);

    const counts = new Map<number, number>();
    for (const { mealId } of allIngredients) {
      counts.set(mealId, (counts.get(mealId) ?? 0) + 1);
    }

    return deleted.map((meal) => ({
      id: meal.id,
      title: meal.title,
      deletedAt: meal.deletedAt ?? new Date(0),
      ingredientCount: counts.get(meal.id) ?? 0,
    }));
  });
}

export function getTrips(): Promise<TripRecord[]> {
  return cached(CACHE_KEYS.trips, async () => {
    const [trips, days] = await Promise.all([
      db.select().from(shoppingTrips).orderBy(desc(shoppingTrips.createdAt), desc(shoppingTrips.id)),
      db.select().from(shoppingTripDays),
    ]);

    const dayOrder = (day: string) => {
      const index = WEEKDAYS.indexOf(day as (typeof WEEKDAYS)[number]);
      return index === -1 ? WEEKDAYS.length : index;
    };

    const byTrip = new Map<number, TripDayRecord[]>();
    for (const day of days) {
      const list = byTrip.get(day.tripId) ?? [];
      list.push(day);
      byTrip.set(day.tripId, list);
    }

    return trips.map((trip) => ({
      ...trip,
      days: (byTrip.get(trip.id) ?? []).sort(
        (a, b) => dayOrder(a.day) - dayOrder(b.day),
      ),
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
