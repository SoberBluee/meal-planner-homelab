export type IngredientFormRow = {
  name: string;
  quantity: string;
  unit: string;
};

export type MealWithIngredients = {
  id: number;
  title: string;
  price: number | null;
  createdAt: string | Date;
  ingredients: Array<{
    id: number;
    mealId: number;
    name: string;
    quantity: number | null;
    unit: string | null;
  }>;
};

export type EssentialItemRecord = {
  id: number;
  name: string;
  sortOrder: number;
};

export type IngredientRecord = {
  id: number;
  name: string;
  sortOrder: number;
  category: string;
  printName: string;
  price: number | null;
};

export type ShopSectionRecord = {
  id: number;
  name: string;
  sortOrder: number;
};

export type ShopLayout = {
  sections: ShopSectionRecord[];
  ingredients: IngredientRecord[];
};

export type PersonRecord = {
  id: number;
  name: string;
  sortOrder: number;
};

export const INGREDIENT_CATEGORIES = [
  "Fruit",
  "Vegetable",
  "Meat",
  "Fish",
  "Dairy",
  "Bakery",
  "Pantry",
  "Frozen",
  "Other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type WeekPlanDay = {
  day: Weekday;
  mealId: number | null;
  mealTitle: string | null;
  cookerId: number | null;
  cookerName: string | null;
};

export type ShoppingDraft = {
  selectedMealIds: number[];
  weekPlan: WeekPlanDay[];
  checkedEssentials: string[];
  extraEssentials: string[];
  mealCost: number | null;
  mergedList: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    display: string;
    sectionName?: string;
    sectionOrder?: number;
    itemOrder?: number;
  }>;
  listText: string;
};

export const SHOPPING_DRAFT_KEY = "meal-planner-shopping-draft";
