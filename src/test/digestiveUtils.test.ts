import { describe, it, expect } from "vitest";
import { getDigestiveTags } from "@/lib/digestiveUtils";
import type { Recipe } from "@/types/nutrition";

describe("digestive utils - edge cases", () => {
  it("high triggers -> very low digestive score and multiple flags", () => {
    const recipe: Recipe = {
      id: "r1",
      name: "Plato muy potencialmente irritante",
      ingredients: [
        {
          name: "Jalapeño picante",
          grams: 10,
          protein: 0,
          calories: 0,
          category: "condimentos",
        },
        {
          name: "Lentejas cocidas",
          grams: 100,
          protein: 9,
          calories: 116,
          category: "granos",
        },
        {
          name: "Linaza molida",
          grams: 10,
          protein: 2,
          calories: 55,
          category: "semillas",
        },
        {
          name: "Aceite de oliva",
          grams: 10,
          protein: 0,
          calories: 90,
          category: "condimentos",
        },
        {
          name: "Queso fresco",
          grams: 30,
          protein: 6,
          calories: 90,
          category: "lacteos",
        },
        {
          name: "Brócoli al vapor",
          grams: 80,
          protein: 3,
          calories: 34,
          category: "verduras",
        },
      ],
      instructions: [],
      totalProtein: 20,
      totalCalories: 385,
      servings: 2,
      prepTime: 20,
      tags: [],
    };

    const tags = getDigestiveTags(recipe);
    expect(tags.hasLegumes).toBe(true);
    expect(tags.isSpicy).toBe(true);
    expect(tags.hasLactose).toBe(true);
    expect(tags.hasCruciferous).toBe(true);
    expect(tags.highFiber).toBe(true);
    expect(tags.digestiveScore).toBeGreaterThanOrEqual(1);
    expect(tags.digestiveScore).toBeLessThanOrEqual(4);
  });

  it("low triggers -> high digestive score (gentle)", () => {
    const recipe: Recipe = {
      id: "r2",
      name: "Pollo y arroz suave",
      ingredients: [
        {
          name: "Pechuga de pollo",
          grams: 150,
          protein: 30,
          calories: 165,
          category: "proteinas",
        },
        {
          name: "Arroz blanco cocido",
          grams: 150,
          protein: 3,
          calories: 205,
          category: "granos",
        },
        {
          name: "Calabaza asada",
          grams: 80,
          protein: 1,
          calories: 40,
          category: "verduras",
        },
      ],
      instructions: [],
      totalProtein: 34,
      totalCalories: 410,
      servings: 2,
      prepTime: 30,
      tags: [],
    };

    const tags = getDigestiveTags(recipe);
    expect(tags.hasLegumes).toBe(false);
    expect(tags.isSpicy).toBe(false);
    expect(tags.hasLactose).toBe(false);
    expect(tags.hasCruciferous).toBe(false);
    expect(tags.highFiber).toBe(false);
    expect(tags.digestiveScore).toBeGreaterThanOrEqual(8);
  });

  it("mixed triggers -> medium digestive score", () => {
    const recipe: Recipe = {
      id: "r3",
      name: "Ensalada con garbanzos y nueces",
      ingredients: [
        {
          name: "Garbanzos",
          grams: 120,
          protein: 8,
          calories: 160,
          category: "granos",
        },
        {
          name: "Nueces picadas",
          grams: 30,
          protein: 4,
          calories: 200,
          category: "semillas",
        },
        {
          name: "Aceite de oliva",
          grams: 10,
          protein: 0,
          calories: 90,
          category: "condimentos",
        },
        {
          name: "Lechuga",
          grams: 50,
          protein: 1,
          calories: 8,
          category: "verduras",
        },
        {
          name: "Avena tostada",
          grams: 20,
          protein: 3,
          calories: 70,
          category: "granos",
        },
      ],
      instructions: [],
      totalProtein: 16,
      totalCalories: 438,
      servings: 2,
      prepTime: 10,
      tags: [],
    };

    const tags = getDigestiveTags(recipe);
    expect(tags.hasLegumes).toBe(true);
    expect(tags.highFat).toBe(true);
    // Expect a mid-range score (approx 6-8 given our integer weights)
    expect(tags.digestiveScore).toBeGreaterThanOrEqual(6);
    expect(tags.digestiveScore).toBeLessThanOrEqual(8);
  });
});
