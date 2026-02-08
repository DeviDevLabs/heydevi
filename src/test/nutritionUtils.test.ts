import { describe, it, expect } from "vitest";
import { generateShoppingList } from "@/lib/nutritionUtils";
import type { DayPlan, Recipe } from "@/types/nutrition";
import { buildFoodItemIndex } from "@/lib/foodUtils";

describe("nutritionUtils generateShoppingList", () => {
  it("normalizes and groups ingredient names differing only by case/spacing", () => {
    const r: Recipe = {
      id: "r1",
      name: "Test",
      prepTime: 5,
      servings: 1,
      tags: [],
      ingredients: [
        {
          name: "Tomate",
          grams: 50,
          protein: 0,
          calories: 10,
          category: "verduras",
        },
        {
          name: "tomate ",
          grams: 30,
          protein: 0,
          calories: 6,
          category: "verduras",
        },
      ],
      instructions: [],
      totalProtein: 0,
      totalCalories: 16,
    };

    const plan: DayPlan[] = [
      {
        dayName: "Lun",
        meals: [
          {
            time: "m",
            label: "m",
            recipeId: "r1",
            description: "",
            protein: 0,
            calories: 0,
          },
        ],
      },
    ];

    const grouped = generateShoppingList(plan, [r]);
    const items = grouped["verduras"];
    expect(items).toBeTruthy();
    expect(items.length).toBe(1);
    expect(items[0].totalGrams).toBeCloseTo(80);
  });

  it("protects against division by zero when recipe.totalProtein is 0", () => {
    const r: Recipe = {
      id: "r2",
      name: "ZeroProtein",
      prepTime: 5,
      servings: 2,
      tags: [],
      ingredients: [
        {
          name: "ProteinaXD",
          grams: 100,
          protein: 0,
          calories: 0,
          category: "proteinas",
        },
      ],
      instructions: [],
      totalProtein: 0, // problematic value
      totalCalories: 0,
    };

    const plan: DayPlan[] = [
      {
        dayName: "Mar",
        meals: [
          {
            time: "m",
            label: "m",
            recipeId: "r2",
            description: "",
            protein: 10,
            calories: 0,
          },
        ],
      },
    ];

    const grouped = generateShoppingList(plan, [r]);
    const items = grouped["proteinas"];
    expect(items).toBeTruthy();
    expect(items[0].totalGrams).toBeCloseTo(100);
  });

  it("applies minimal unit conversions for ml and caps", () => {
    const r: Recipe = {
      id: "r3",
      name: "Units",
      prepTime: 1,
      servings: 1,
      tags: [],
      ingredients: [
        // 250 ml -> assume 1 g/ml => 250 g
        {
          name: "Agua",
          grams: 250,
          protein: 0,
          calories: 0,
          category: "frutas",
          // unit removed - not in RecipeIngredient type
        },
        // 2 caps -> each 0.5 g => total 1 g
        {
          name: "VitC",
          grams: 2,
          protein: 0,
          calories: 0,
          category: "lacteos",
          // unit removed - not in RecipeIngredient type
        },
      ],
      instructions: [],
      totalProtein: 0,
      totalCalories: 0,
    };

    const plan: DayPlan[] = [
      {
        dayName: "Mie",
        meals: [
          {
            time: "m",
            label: "m",
            recipeId: "r3",
            description: "",
            protein: 0,
            calories: 0,
          },
        ],
      },
    ];

    const grouped = generateShoppingList(plan, [r], undefined, {
      mlToGrams: 1,
      capsToGrams: 0.5,
    });
    expect(grouped["frutas"][0].totalGrams).toBeCloseTo(250);
    expect(grouped["lacteos"][0].totalGrams).toBeCloseTo(1);
  });

  it("uses canonical_name from provided foodIndex when available", () => {
    const r: Recipe = {
      id: "r4",
      name: "Canon",
      prepTime: 1,
      servings: 1,
      tags: [],
      ingredients: [
        {
          name: "Avena fina",
          grams: 60,
          protein: 8,
          calories: 234,
          category: "granos",
        },
      ],
      instructions: [],
      totalProtein: 8,
      totalCalories: 234,
    };

    // build a fake food index where normalized("avena fina") => canonical_name
    const foodItems = [
      {
        id: "f1",
        name: "Avena",
        canonical_name: "Avena Integral",
        category: "granos",
        default_unit: "g",
        synonyms: ["avena fina"],
      },
    ];
    const idx = buildFoodItemIndex(foodItems as any);

    const plan: DayPlan[] = [
      {
        dayName: "Jue",
        meals: [
          {
            time: "m",
            label: "m",
            recipeId: "r4",
            description: "",
            protein: 8,
            calories: 0,
          },
        ],
      },
    ];

    const grouped = generateShoppingList(plan, [r], idx);
    expect(grouped["granos"][0].name).toBe("Avena Integral");
  });
});
