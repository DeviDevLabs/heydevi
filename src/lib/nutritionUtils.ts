import { DayPlan, Recipe, IngredientCategory } from "@/types/nutrition";
import { normalizeFoodName, FoodItem } from "@/lib/foodUtils";

export interface ShoppingItem {
  name: string;
  totalGrams: number;
  category: IngredientCategory;
}

export function generateShoppingList(
  plan: DayPlan[],
  recipeList: Recipe[],
  // optional index of canonical FoodItems to prefer canonical_name when available
  foodIndex?: Map<string, FoodItem>,
  // minimal unit conversion options
  options?: { mlToGrams?: number; capsToGrams?: number },
): Record<string, ShoppingItem[]> {
  const itemMap = new Map<string, ShoppingItem>();
  const mlToGrams = options?.mlToGrams ?? 1;
  const capsToGrams = options?.capsToGrams ?? 1;

  for (const day of plan) {
    for (const meal of day.meals) {
      if (meal.recipeId) {
        const recipe = recipeList.find((r) => r.id === meal.recipeId);
        if (recipe) {
          // protect against division by zero in totalProtein
          const portionFactor =
            recipe.servings > 1 &&
            recipe.totalProtein > 0 &&
            meal.protein < recipe.totalProtein
              ? meal.protein / recipe.totalProtein
              : 1;

          for (const ing of recipe.ingredients) {
            // handle minimal unit conversion: if ingredient has a unit property
            // (backwards-compatible: many ingredients simply use grams)
            // @ts-ignore allow optional unit on ingredient
            const unit: string | undefined = (ing as any).unit;

            let baseGrams = ing.grams ?? 0;
            if (unit === "ml") baseGrams = (ing.grams ?? 0) * mlToGrams;
            if (unit === "caps") baseGrams = (ing.grams ?? 0) * capsToGrams;

            const grams = baseGrams * portionFactor;

            // use normalized name as key to collapse duplicates
            const key = normalizeFoodName(ing.name || "");

            // prefer canonical name if provided via foodIndex
            const canonical = foodIndex?.get(key)?.canonical_name || undefined;
            const displayName = canonical || ing.name || key;

            const existing = itemMap.get(key);
            if (existing) {
              existing.totalGrams += grams;
            } else {
              itemMap.set(key, {
                name: displayName,
                totalGrams: grams,
                category: ing.category,
              });
            }
          }
        }
      }
    }
  }

  const grouped: Record<string, ShoppingItem[]> = {};
  for (const item of itemMap.values()) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  return grouped;
}

export function getDayTotalProtein(day: DayPlan): number {
  return day.meals.reduce((sum, m) => sum + m.protein, 0);
}

export function getDayTotalCalories(day: DayPlan): number {
  return day.meals.reduce((sum, m) => sum + m.calories, 0);
}
