import { DayPlan, Recipe, IngredientCategory } from "@/types/nutrition";

export interface ShoppingItem {
  name: string;
  totalGrams: number;
  category: IngredientCategory;
}

export function generateShoppingList(
  plan: DayPlan[],
  recipeList: Recipe[]
): Record<string, ShoppingItem[]> {
  const itemMap = new Map<string, ShoppingItem>();

  for (const day of plan) {
    for (const meal of day.meals) {
      if (meal.recipeId) {
        const recipe = recipeList.find((r) => r.id === meal.recipeId);
        if (recipe) {
          const portionFactor =
            recipe.servings > 1 && meal.protein < recipe.totalProtein
              ? meal.protein / recipe.totalProtein
              : 1;

          for (const ing of recipe.ingredients) {
            const grams = ing.grams * portionFactor;
            const existing = itemMap.get(ing.name);
            if (existing) {
              existing.totalGrams += grams;
            } else {
              itemMap.set(ing.name, {
                name: ing.name,
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
