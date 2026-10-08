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

const shopOrdered = mergeIngredients(
  [
    { name: "milk" },
    { name: "apples" },
    { name: "bread" },
    { name: "unknown item" },
  ],
  {
    sections: [
      { id: 1, name: "Bakery", sortOrder: 0 },
      { id: 2, name: "Fruit", sortOrder: 1 },
      { id: 3, name: "Dairy", sortOrder: 2 },
      { id: 4, name: "Other", sortOrder: 3 },
    ],
    ingredients: [
      {
        id: 1,
        name: "bread",
        printName: "Bread",
        category: "Bakery",
        sortOrder: 0,
        price: null,
      },
      {
        id: 2,
        name: "apples",
        printName: "Apples",
        category: "Fruit",
        sortOrder: 0,
        price: null,
      },
      {
        id: 3,
        name: "milk",
        printName: "Milk",
        category: "Dairy",
        sortOrder: 0,
        price: null,
      },
    ],
  },
);

assert.deepEqual(
  shopOrdered.map((item) => item.name),
  ["bread", "apples", "milk", "unknown item"],
);
assert.equal(shopOrdered.at(-1)?.sectionName, "Other");

const orderedText = formatShoppingListText(shopOrdered, {
  weekPlan: [
    {
      day: "Monday",
      mealTitle: "Pizza",
      cookerName: "Ethan",
    },
  ],
});
assert.match(orderedText, /Monday — Pizza · Ethan cooking/);
assert.ok(orderedText.indexOf("Bakery") < orderedText.indexOf("Fruit"));
assert.ok(orderedText.indexOf("Fruit") < orderedText.indexOf("Dairy"));

console.log("merge-ingredients tests passed");
