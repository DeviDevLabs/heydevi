import { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { weeklyPlan } from "@/data/mealPlan";
import { recipes } from "@/data/recipes";
import { generateShoppingList } from "@/lib/nutritionUtils";
import {
  fetchFoodItems,
  fetchRecentPurchases,
  computeWeeklyNeeds,
  computeSuggestedWeeklyQty,
  findCanonicalMatch,
  buildFoodItemIndex,
  type FoodItem,
  type WeeklyNeed,
} from "@/lib/foodUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Check } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  proteinas: "Proteínas",
  lacteos: "Lácteos",
  verduras: "Verduras",
  frutas: "Frutas",
  granos: "Granos y cereales",
  semillas: "Semillas y grasas",
  condimentos: "Condimentos",
};

const CATEGORY_ORDER = [
  "proteinas", "lacteos", "verduras", "frutas", "granos", "semillas", "condimentos",
];

const ShoppingList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [needs, setNeeds] = useState<WeeklyNeed[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // plan items are generated during data load to allow using canonical names

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [items, purchaseData, { data: inventory }] = await Promise.all([
      fetchFoodItems(),
      fetchRecentPurchases(user.id),
      supabase
        .from("inventory")
        .select("ingredient_name, grams_available, food_item_id")
        .eq("user_id", user.id),
    ]);

    setFoodItems(items);
    const suggestions = computeSuggestedWeeklyQty(purchaseData);
    // build index to prefer canonical names when generating shopping list
    const idx = buildFoodItemIndex(items as any);
    const raw = generateShoppingList(weeklyPlan, recipes, idx);
    const flat: { name: string; totalGrams: number; category: string }[] = [];
    for (const arr of Object.values(raw)) {
      for (const item of arr) {
        flat.push({ name: item.name, totalGrams: item.totalGrams, category: item.category });
      }
    }

    const computed = computeWeeklyNeeds(
      flat,
      (inventory || []) as any,
      items,
      suggestions
    );
    setNeeds(computed);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const markPurchased = async (need: WeeklyNeed) => {
    if (!user) return;
    const qty = need.suggestedQty || need.needed;

    // Record purchase
    const purchasePayload: any = {
      user_id: user.id,
      qty,
      unit: need.unit,
    };
    if (need.foodItemId) {
      purchasePayload.food_item_id = need.foodItemId;
    } else {
      // Create food_item first
      const { data: newItem } = await supabase
        .from("food_items")
        .insert({ name: need.foodItemName, canonical_name: need.foodItemName, category: need.category })
        .select("id")
        .single();
      if (newItem) purchasePayload.food_item_id = newItem.id;
      else return;
    }

    await supabase.from("purchases").insert(purchasePayload);

    // Update inventory
    await supabase.from("inventory").upsert(
      {
        user_id: user.id,
        ingredient_name: need.foodItemName,
        category: need.category,
        grams_available: qty + need.inventoryAvailable,
        food_item_id: purchasePayload.food_item_id,
      },
      { onConflict: "user_id,ingredient_name" }
    );

    toast({ title: "Comprado", description: `${need.foodItemName}: +${qty}${need.unit}` });
    toggle(need.foodItemName);
    loadData();
  };

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, WeeklyNeed[]> = {};
    for (const n of needs) {
      if (!g[n.category]) g[n.category] = [];
      g[n.category].push(n);
    }
    return g;
  }, [needs]);

  const categories = CATEGORY_ORDER.filter((c) => grouped[c]);

  if (loading) return <p className="text-muted-foreground text-sm p-4">Calculando lista...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Lista de compra</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {needs.length} faltantes para la semana — {checked.size} comprados
        </p>
      </div>

      {needs.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            🎉 Tienes todo lo necesario en inventario
          </CardContent>
        </Card>
      )}

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{CATEGORY_LABELS[cat] || cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped[cat].map((need) => (
              <div key={need.foodItemName} className="flex items-center gap-2">
                <Checkbox
                  checked={checked.has(need.foodItemName)}
                  onCheckedChange={() => toggle(need.foodItemName)}
                />
                <span
                  className={`text-sm flex-1 ${
                    checked.has(need.foodItemName)
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {need.foodItemName}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {need.needed}{need.unit}
                </span>
                {need.suggestedQty && (
                  <Badge variant="outline" className="text-xs">
                    ~{need.suggestedQty}{need.unit}/sem
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => markPurchased(need)}
                  title="Marcar comprado"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShoppingList;
