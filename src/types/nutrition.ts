export type IngredientCategory =
  | "proteinas"
  | "lacteos"
  | "verduras"
  | "frutas"
  | "granos"
  | "semillas"
  | "condimentos";

export interface RecipeIngredient {
  name: string;
  grams: number;
  protein: number;
  calories: number;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  totalProtein: number;
  totalCalories: number;
  servings: number;
  prepTime: number;
  tags: string[];
}

export interface Meal {
  time: string;
  label: string;
  recipeId?: string;
  description: string;
  protein: number;
  calories: number;
  digestiveNote?: string;
}

export interface DayPlan {
  dayName: string;
  meals: Meal[];
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  time: string;
  schedule: string;
  notes?: string;
}
