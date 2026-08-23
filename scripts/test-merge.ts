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

console.log("merge-ingredients tests passed");
