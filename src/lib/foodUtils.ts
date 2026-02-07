import { supabase } from "@/integrations/supabase/client";

/**
 * Normalize a food name for canonical matching:
 * lowercase, trim, remove accents, collapse spaces.
 */
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export interface FoodItem {
  id: string;
  name: string;
  canonical_name: string;
  category: string;
  default_unit: string;
  synonyms: string[];
}

/**
 * Find a canonical food_item matching the given name (exact or synonym).
 * Returns null if no match found.
 */
export function findCanonicalMatch(
  name: string,
  foodItems: FoodItem[]
): FoodItem | null {
  const normalized = normalizeFoodName(name);
  for (const item of foodItems) {
    if (normalizeFoodName(item.name) === normalized) return item;
    if (normalizeFoodName(item.canonical_name) === normalized) return item;
    if (item.synonyms?.some((s) => normalizeFoodName(s) === normalized))
      return item;
  }
  return null;
}

export interface WeeklyNeed {
  foodItemName: string;
  foodItemId: string | null;
  category: string;
  needed: number; // grams needed = plan - inventory
  planRequired: number;
  inventoryAvailable: number;
  suggestedQty: number | null; // from purchase history
  unit: string;
}

/**
 * Compute weekly shopping needs: plan_required - inventory_available.
 * Items where needed <= 0 are excluded.
 */
export function computeWeeklyNeeds(
  planItems: { name: string; totalGrams: number; category: string }[],
  inventoryItems: { ingredient_name: string; grams_available: number; food_item_id: string | null }[],
  foodItems: FoodItem[],
  purchaseSuggestions: Map<string, number> // food_item_id -> suggested qty
): WeeklyNeed[] {
  const needs: WeeklyNeed[] = [];

  for (const planItem of planItems) {
    const match = findCanonicalMatch(planItem.name, foodItems);
    const canonicalName = match?.canonical_name || planItem.name;

    // Find inventory for this item
    let inventoryAvailable = 0;
    for (const inv of inventoryItems) {
      const invMatch = inv.food_item_id && match
        ? inv.food_item_id === match.id
        : normalizeFoodName(inv.ingredient_name) === normalizeFoodName(planItem.name);
      if (invMatch) {
        inventoryAvailable += inv.grams_available;
      }
    }

    const needed = planItem.totalGrams - inventoryAvailable;
    if (needed <= 0) continue;

    const suggestedQty = match ? purchaseSuggestions.get(match.id) ?? null : null;

    needs.push({
      foodItemName: canonicalName,
      foodItemId: match?.id || null,
      category: planItem.category,
      needed: Math.round(needed),
      planRequired: Math.round(planItem.totalGrams),
      inventoryAvailable: Math.round(inventoryAvailable),
      suggestedQty: suggestedQty ? Math.round(suggestedQty) : null,
      unit: match?.default_unit || "g",
    });
  }

  return needs.sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Compute suggested weekly qty from purchase history:
 * Moving average of last 4 weeks with data (ignore weeks without purchases).
 */
export function computeSuggestedWeeklyQty(
  purchases: { food_item_id: string; qty: number; week_start: string }[]
): Map<string, number> {
  const byItem = new Map<string, Map<string, number>>();

  for (const p of purchases) {
    if (!byItem.has(p.food_item_id)) byItem.set(p.food_item_id, new Map());
    const weekMap = byItem.get(p.food_item_id)!;
    weekMap.set(p.week_start, (weekMap.get(p.week_start) || 0) + p.qty);
  }

  const result = new Map<string, number>();
  for (const [itemId, weekMap] of byItem) {
    const weeklyTotals = Array.from(weekMap.values())
      .sort((a, b) => b - a) // most recent first won't matter for average
      .slice(0, 4); // last 4 weeks with data
    if (weeklyTotals.length > 0) {
      const avg = weeklyTotals.reduce((s, v) => s + v, 0) / weeklyTotals.length;
      result.set(itemId, avg);
    }
  }

  return result;
}

/**
 * Fetch all food items from DB.
 */
export async function fetchFoodItems(): Promise<FoodItem[]> {
  const { data } = await supabase
    .from("food_items")
    .select("*")
    .order("name");
  return (data as FoodItem[]) || [];
}

/**
 * Fetch user's purchase history (last 8 weeks).
 */
export async function fetchRecentPurchases(userId: string) {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const { data } = await supabase
    .from("purchases")
    .select("food_item_id, qty, week_start")
    .eq("user_id", userId)
    .gte("week_start", eightWeeksAgo.toISOString().split("T")[0]);
  return data || [];
}
