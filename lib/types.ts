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

export type ShoppingDraft = {
  selectedMealIds: number[];
  checkedEssentials: string[];
  extraEssentials: string[];
  mealCost: number | null;
  mergedList: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    display: string;
  }>;
  listText: string;
};

export const SHOPPING_DRAFT_KEY = "meal-planner-shopping-draft";
