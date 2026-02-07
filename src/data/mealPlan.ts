import { DayPlan } from "@/types/nutrition";

export const weeklyPlan: DayPlan[] = [
  {
    dayName: "Lunes",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua (sin calorias)", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "avena-proteica", description: "Avena proteica con yogur griego", protein: 38, calories: 480 },
      { time: "10:30", label: "Media manana", recipeId: "tostada-hummus", description: "Tostada integral con hummus y verduras", protein: 13, calories: 313 },
      { time: "14:00", label: "Comida", recipeId: "tofu-brocoli-quinoa", description: "Tofu salteado con brocoli y quinoa", protein: 36, calories: 534 },
      { time: "20:00", label: "Cena", recipeId: "sopa-lentejas", description: "Sopa de lentejas rojas con curcuma (1 porcion)", protein: 19, calories: 344, digestiveNote: "Comida cocida y ligera, ideal para la noche" },
    ],
  },
  {
    dayName: "Martes",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "bowl-yogur-semillas", description: "Bowl de yogur griego con semillas", protein: 27, calories: 366 },
      { time: "10:30", label: "Media manana", recipeId: "tostada-hummus", description: "Tostada integral con hummus y verduras", protein: 13, calories: 313 },
      { time: "14:00", label: "Comida", recipeId: "tempeh-arroz", description: "Tempeh a la plancha con arroz integral y verduras", protein: 35, calories: 492 },
      { time: "17:00", label: "Merienda", recipeId: "smoothie-proteico", description: "Smoothie proteico de bayas", protein: 25, calories: 280 },
      { time: "20:00", label: "Cena", description: "Yogur griego 150g con pepino y semillas de calabaza", protein: 18, calories: 230, digestiveNote: "Cena ligera, evitar fermentables" },
    ],
  },
  {
    dayName: "Miercoles",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "avena-proteica", description: "Avena proteica con yogur griego", protein: 38, calories: 480 },
      { time: "10:30", label: "Media manana", recipeId: "tostada-hummus", description: "Tostada integral con hummus y verduras", protein: 13, calories: 313 },
      { time: "14:00", label: "Comida", recipeId: "ensalada-edamame", description: "Ensalada tibia de edamame y quinoa", protein: 24, calories: 421 },
      { time: "20:00", label: "Cena", recipeId: "curry-garbanzos", description: "Curry de garbanzos con coliflor (1 porcion)", protein: 17, calories: 383, digestiveNote: "Porcion moderada de legumbre cocida" },
    ],
  },
  {
    dayName: "Jueves",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "bowl-yogur-semillas", description: "Bowl de yogur griego con semillas", protein: 27, calories: 366 },
      { time: "10:30", label: "Media manana", recipeId: "tostada-hummus", description: "Tostada integral con hummus y verduras", protein: 13, calories: 313 },
      { time: "14:00", label: "Comida", recipeId: "tofu-brocoli-quinoa", description: "Tofu salteado con brocoli y quinoa", protein: 36, calories: 534 },
      { time: "17:00", label: "Merienda", description: "Yogur griego 100g con nueces 15g", protein: 12, calories: 163 },
      { time: "20:00", label: "Cena", recipeId: "sopa-lentejas", description: "Sopa de lentejas rojas con curcuma (1 porcion)", protein: 19, calories: 344, digestiveNote: "Sopa cocida, facil digestion nocturna" },
    ],
  },
  {
    dayName: "Viernes",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "avena-proteica", description: "Avena proteica con yogur griego", protein: 38, calories: 480 },
      { time: "10:30", label: "Media manana", recipeId: "smoothie-proteico", description: "Smoothie proteico de bayas", protein: 25, calories: 280 },
      { time: "14:00", label: "Comida", recipeId: "tempeh-arroz", description: "Tempeh a la plancha con arroz integral y verduras", protein: 35, calories: 492 },
      { time: "20:00", label: "Cena", recipeId: "bowl-lentejas", description: "Bowl de lentejas con espinacas y arroz (porcion reducida)", protein: 20, calories: 420, digestiveNote: "Porcion moderada, verduras cocidas" },
    ],
  },
  {
    dayName: "Sabado",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "avena-proteica", description: "Avena proteica con yogur griego", protein: 38, calories: 480 },
      { time: "10:30", label: "Media manana", recipeId: "tostada-hummus", description: "Tostada integral con hummus y verduras", protein: 13, calories: 313 },
      { time: "14:00", label: "Comida", recipeId: "curry-garbanzos", description: "Curry de garbanzos con coliflor (1 porcion)", protein: 17, calories: 383 },
      { time: "17:00", label: "Merienda", recipeId: "bowl-yogur-semillas", description: "Bowl de yogur griego con semillas", protein: 27, calories: 366 },
      { time: "20:00", label: "Cena", description: "Tostada integral con aguacate y tomate", protein: 6, calories: 250, digestiveNote: "Cena ligera sin legumbres" },
    ],
  },
  {
    dayName: "Domingo",
    meals: [
      { time: "5:30", label: "Pre-entreno", description: "Platano mediano + 15g proteina vegetal en polvo con agua", protein: 14, calories: 165 },
      { time: "7:00", label: "Post-entreno", description: "Creatina 5g con agua", protein: 0, calories: 0 },
      { time: "7:30", label: "Desayuno", recipeId: "bowl-yogur-semillas", description: "Bowl de yogur griego con semillas", protein: 27, calories: 366 },
      { time: "11:00", label: "Batch cooking", description: "Preparacion semanal: granos, legumbres, verduras, porcionar en tuppers", protein: 0, calories: 0 },
      { time: "14:00", label: "Comida", recipeId: "ensalada-edamame", description: "Ensalada tibia de edamame y quinoa", protein: 24, calories: 421 },
      { time: "17:00", label: "Merienda", recipeId: "smoothie-proteico", description: "Smoothie proteico de bayas", protein: 25, calories: 280 },
      { time: "20:00", label: "Cena", recipeId: "sopa-lentejas", description: "Sopa de lentejas rojas con curcuma (1 porcion)", protein: 19, calories: 344, digestiveNote: "Sopa ligera para cerrar la semana" },
    ],
  },
];
