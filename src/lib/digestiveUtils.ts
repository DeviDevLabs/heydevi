import { Recipe, RecipeIngredient } from "@/types/nutrition";
import { normalizeFoodName } from "@/lib/foodUtils";
import {
  FIBER_RICH,
  HIGH_FAT,
  LACTOSE,
  GLUTEN,
  LEGUMES,
  CRUCIFEROUS,
  SPICY,
} from "@/lib/digestiveKeywords";

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

/**
 * Match keywords against an ingredient name using normalization + token
 * sequence matching. Evita coincidencias por sub-substring (p.ej. no
 * considerar "lin" como coincidencia de "linaza").
 */
function ingredientMatches(
  ingredient: RecipeIngredient,
  keywords: string[],
): boolean {
  const name = normalizeFoodName(ingredient.name || "");
  const nameTokens = name.split(" ").filter(Boolean);

  return keywords.some((kw) => {
    const kwNorm = normalizeFoodName(kw);
    const kwTokens = kwNorm.split(" ").filter(Boolean);
    if (kwTokens.length === 0) return false;
    for (let i = 0; i <= nameTokens.length - kwTokens.length; i++) {
      let ok = true;
      for (let j = 0; j < kwTokens.length; j++) {
        if (nameTokens[i + j] !== kwTokens[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  });
}

export function getDigestiveTags(recipe: Recipe): DigestiveTags {
  const ings = recipe.ingredients;

  const fiberCount = ings.filter((i) =>
    ingredientMatches(i, FIBER_RICH),
  ).length;
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

  // Digestive score stabilizado usando puntuación entera (ponderada).
  // Base 10 (muy suave). Restamos puntos enteros por factores
  // que tienden a empeorar la tolerancia.
  const BASE_SCORE = 10;
  let score = BASE_SCORE;
  if (highFiber) score -= 2; // muchas fibras pueden ser irritantes para algunos
  if (highFat) score -= 1; // grasas pueden ralentizar la digestión
  if (hasLegumes) score -= 2; // legumbres: gas/flatulencia
  if (hasCruciferous) score -= 1; // crucíferas: pueden causar gases
  if (isSpicy) score -= 3; // picante fuerte
  if (hasLactose) score -= 1; // sensibilidad leve
  if (hasGluten) score -= 1; // sensibilidad leve

  score = Math.max(1, Math.min(10, Math.round(score)));

  return {
    highFiber,
    lowFiber,
    highFat,
    lowFat,
    hasLactose,
    hasGluten,
    hasLegumes,
    hasCruciferous,
    isSpicy,
    digestiveScore: score,
  };
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

export function digestiveScoreLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 8) return { label: "Muy suave", color: "text-green-600" };
  if (score >= 6) return { label: "Suave", color: "text-emerald-500" };
  if (score >= 4) return { label: "Moderada", color: "text-yellow-600" };
  return { label: "Puede irritar", color: "text-red-500" };
}
