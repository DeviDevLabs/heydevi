import { useMemo, useState } from "react";
import { weeklyPlan } from "@/data/mealPlan";
import { recipes } from "@/data/recipes";
import { generateShoppingList } from "@/lib/nutritionUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORY_LABELS: Record<string, string> = {
  proteinas: "Proteinas",
  lacteos: "Lacteos",
  verduras: "Verduras",
  frutas: "Frutas",
  granos: "Granos y cereales",
  semillas: "Semillas y grasas",
  condimentos: "Condimentos",
};

const CATEGORY_ORDER = [
  "proteinas",
  "lacteos",
  "verduras",
  "frutas",
  "granos",
  "semillas",
  "condimentos",
];

const ShoppingList = () => {
  const shoppingList = useMemo(
    () => generateShoppingList(weeklyPlan, recipes),
    []
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const categories = CATEGORY_ORDER.filter((c) => shoppingList[c]);
  const totalItems = Object.values(shoppingList).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Lista de compra</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {totalItems} ingredientes para la semana completa —{" "}
          {checked.size} marcados
        </p>
      </div>

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {CATEGORY_LABELS[cat] || cat}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shoppingList[cat].map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <Checkbox
                  checked={checked.has(item.name)}
                  onCheckedChange={() => toggle(item.name)}
                />
                <span
                  className={`text-sm flex-1 transition-colors ${
                    checked.has(item.name)
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                  {Math.round(item.totalGrams)}g
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShoppingList;
