import { Recipe, RecipeIngredient } from "@/types/nutrition";

export interface DigestiveTags {
  highFiber: boolean;
  lowFiber: boolean;
  highFat: boolean;
  lowFat: boolean;
  hasLactose: boolean;
  hasGluten: boolean;
  hasLegumes: boolean;
  hasCruciferous: boolean;
  isSpicy: boolean;
  digestiveScore: number; // 1-10, higher = gentler
}

const FIBER_RICH = ["avena", "lentejas", "garbanzos", "brocoli", "espinaca", "quinoa", "arroz integral", "linaza", "semillas"];
const HIGH_FAT = ["aceite", "nueces", "tahini", "semillas de calabaza", "semillas de hemp"];
const LACTOSE = ["yogur", "leche", "queso", "crema"];
const GLUTEN = ["pan integral", "avena", "trigo", "cebada"];
const LEGUMES = ["lentejas", "garbanzos", "edamame", "frijoles"];
const CRUCIFEROUS = ["brocoli", "coliflor", "col", "repollo", "kale"];
const SPICY = ["picante", "chile", "jalapeño", "sriracha", "cayena"];

function ingredientMatches(ingredient: RecipeIngredient, keywords: string[]): boolean {
  const name = ingredient.name.toLowerCase();
  return keywords.some((kw) => name.includes(kw.toLowerCase()));
}

export function getDigestiveTags(recipe: Recipe): DigestiveTags {
  const ings = recipe.ingredients;

  const fiberCount = ings.filter((i) => ingredientMatches(i, FIBER_RICH)).length;
  const fatCount = ings.filter((i) => ingredientMatches(i, HIGH_FAT)).length;
  const hasLactose = ings.some((i) => ingredientMatches(i, LACTOSE));
  const hasGluten = ings.some((i) => ingredientMatches(i, GLUTEN));
  const hasLegumes = ings.some((i) => ingredientMatches(i, LEGUMES));
  const hasCruciferous = ings.some((i) => ingredientMatches(i, CRUCIFEROUS));
  const isSpicy = ings.some((i) => ingredientMatches(i, SPICY));

  const highFiber = fiberCount >= 3;
  const lowFiber = fiberCount <= 1;
  const highFat = fatCount >= 2;
  const lowFat = fatCount === 0;

  // Digestive score: 10 = very gentle, 1 = potentially irritating
  let score = 10;
  if (highFiber) score -= 2;
  if (highFat) score -= 1.5;
  if (hasLegumes) score -= 1.5;
  if (hasCruciferous) score -= 1;
  if (isSpicy) score -= 2;
  if (hasLactose) score -= 0.5;
  if (hasGluten) score -= 0.5;
  score = Math.max(1, Math.min(10, Math.round(score)));

  return { highFiber, lowFiber, highFat, lowFat, hasLactose, hasGluten, hasLegumes, hasCruciferous, isSpicy, digestiveScore: score };
}

export const SYMPTOM_OPTIONS = [
  "Hinchazón",
  "Acidez",
  "Dolor abdominal",
  "Gases",
  "Estreñimiento",
  "Diarrea",
  "Náuseas",
  "Reflujo",
] as const;

export const TRIGGER_OPTIONS = [
  "Picante",
  "Frituras",
  "Alcohol",
  "Café",
  "Legumbres",
  "Crucíferas",
  "Lácteos",
  "Gluten",
  "Alta fibra",
  "Alta grasa",
  "Cacao",
  "Frutas secas",
] as const;

export function digestiveScoreLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: "Muy suave", color: "text-green-600" };
  if (score >= 6) return { label: "Suave", color: "text-emerald-500" };
  if (score >= 4) return { label: "Moderada", color: "text-yellow-600" };
  return { label: "Puede irritar", color: "text-red-500" };
}
