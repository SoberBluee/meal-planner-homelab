import assert from "node:assert/strict";
import { mergeIngredients, formatShoppingListText } from "../lib/merge-ingredients";

const merged = mergeIngredients([
  { name: "onion", quantity: 2 },
  { name: "Onion", quantity: 1 },
  { name: "chicken breast", quantity: 500, unit: "g" },
  { name: "chicken breast", quantity: 300, unit: "g" },
  { name: "milk" },
  { name: "Milk" },
]);

assert.equal(merged.find((item) => item.name === "onion")?.quantity, 3);
assert.equal(
  merged.find((item) => item.name === "chicken breast")?.quantity,
  800,
);
assert.equal(merged.filter((item) => item.name === "milk").length, 1);

const text = formatShoppingListText(merged, { mealCost: 24.5 });
assert.match(text, /Shopping list/);
assert.match(text, /£24.50/);

const withWeek = formatShoppingListText(merged, {
  mealCost: 24.5,
  weekPlan: [
    { day: "Monday", mealTitle: "Pizza" },
    { day: "Tuesday", mealTitle: "Stir fry" },
    { day: "Wednesday", mealTitle: null },
  ],
});
assert.match(withWeek, /This week/);
assert.match(withWeek, /Monday — Pizza/);
assert.match(withWeek, /Tuesday — Stir fry/);
assert.match(withWeek, /Wednesday —$/m);
assert.ok(withWeek.indexOf("This week") < withWeek.indexOf("Shopping list"));

console.log("merge-ingredients tests passed");
