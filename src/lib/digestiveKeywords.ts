/**
 * Digestive keyword lists
 *
 * Estos arrays contienen palabras/frases clave usadas para identificar
 * componentes dietarios que pueden influir en la digestión.
 * - Están pensados para ser normalizados con `normalizeFoodName` antes de
 *   compararlos (minúsculas, sin acentos, espacios colapsados).
 * - Mantenerlos en un archivo separado facilita su mantenimiento y pruebas.
 */
/** Ingredientes ricos en fibra (ejemplos) */
export const FIBER_RICH = [
  "avena",
  "lentejas",
  "garbanzos",
  "brócoli",
  "espinaca",
  "quinoa",
  "arroz integral",
  "linaza",
  "semillas",
];

/** Ingredientes y fuentes con alto contenido de grasa */
export const HIGH_FAT = [
  "aceite",
  "nueces",
  "tahini",
  "semillas de calabaza",
  "semillas de hemp",
  "mantequilla",
];

/** Fuentes de lactosa/lácteos */
export const LACTOSE = ["yogur", "leche", "queso", "crema"];

/** Fuentes de gluten */
export const GLUTEN = ["pan", "avena", "trigo", "cebada"];

/** Legumbres comunes */
export const LEGUMES = ["lentejas", "garbanzos", "edamame", "frijoles"];

/** Verduras crucíferas */
export const CRUCIFEROUS = ["brócoli", "coliflor", "col", "repollo", "kale"];

/** Palabras que indican picante */
export const SPICY = ["picante", "chile", "jalapeño", "sriracha", "cayena"];

/** Export por defecto para facilitar importaciones en tests */
export default {
  FIBER_RICH,
  HIGH_FAT,
  LACTOSE,
  GLUTEN,
  LEGUMES,
  CRUCIFEROUS,
  SPICY,
};
