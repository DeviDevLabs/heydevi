import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchFoodItems, findCanonicalMatch, type FoodItem } from "@/lib/foodUtils";
import { Plus, Minus, Trash2, AlertTriangle } from "lucide-react";

interface InventoryItem {
  id: string;
  ingredient_name: string;
  category: string;
  grams_available: number;
  food_item_id: string | null;
  unit: string | null;
  item_type: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  proteinas: "Proteínas",
  lacteos: "Lácteos",
  verduras: "Verduras",
  frutas: "Frutas",
  granos: "Granos",
  semillas: "Semillas y grasas",
  condimentos: "Condimentos",
  suplementos: "Suplementos",
};

const normalizeUnit = (u?: string | null) => (u || "g").toLowerCase();

const formatAmount = (amount: number, unit?: string | null) => {
  const u = normalizeUnit(unit);
  const val = Number.isFinite(amount) ? amount : 0;
  if (u === "ui") return `${Math.round(val)} UI`;
  if (u === "mcg") return `${Math.round(val)} mcg`;
  if (u === "mg") return `${Math.round(val)} mg`;
  if (u === "caps") return `${Math.round(val)} caps`;
  if (u === "ml") return `${Math.round(val)} ml`;
  return `${Math.round(val)} g`;
};

const getStep = (item: InventoryItem) => {
  const type = (item.item_type || "ingredient").toLowerCase();
  const u = normalizeUnit(item.unit);
  if (type !== "supplement") return 50;
  if (u === "caps") return 1;
  if (u === "ui") return 500;
  if (u === "mcg") return 100;
  if (u === "mg") return 50;
  if (u === "g") return 1;
  if (u === "ml") return 5;
  return 1;
};

const getDefaultUnitForCategory = (category: string) => {
  if (category === "suplementos") return "caps";
  return "g";
};

const Inventory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("proteinas");
  const [newGrams, setNewGrams] = useState("");

  const fetchInventory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const [{ data }, fi] = await Promise.all([
      supabase
        .from("inventory")
        .select("*")
        .eq("user_id", user.id)
        .order("category", { ascending: true }),
      fetchFoodItems(),
    ]);
    setItems((data as InventoryItem[]) || []);
    setFoodItems(fi);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addItem = async () => {
    if (!user || !newName.trim() || !newGrams) return;
    const match = findCanonicalMatch(newName.trim(), foodItems);
    const canonicalName = match?.canonical_name || newName.trim();
    const category = match?.category || newCategory;

    const { error } = await supabase.from("inventory").upsert(
      {
        user_id: user.id,
        ingredient_name: canonicalName,
        category,
        grams_available: Number(newGrams),
        food_item_id: match?.id || null,
        item_type: category === "suplementos" ? "supplement" : "ingredient",
        unit: getDefaultUnitForCategory(category),
      },
      { onConflict: "user_id,ingredient_name" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      setNewGrams("");
      fetchInventory();
    }
  };

  const updateGrams = async (id: string, direction: -1 | 1) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const step = getStep(item);
    const delta = step * direction;
    const newVal = Math.max(0, item.grams_available + delta);
    await supabase.from("inventory").update({ grams_available: newVal }).eq("id", id);
    fetchInventory();
  };

  const markMissing = async (item: InventoryItem) => {
    await supabase.from("inventory").update({ grams_available: 0 }).eq("id", item.id);
    toast({ title: "Marcado como faltante", description: `${item.ingredient_name} ahora aparecerá en la lista de compras` });
    fetchInventory();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id);
    fetchInventory();
  };

  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) return <p className="text-muted-foreground text-sm p-4">Cargando inventario...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Inventario</h1>
        <p className="text-muted-foreground text-sm mt-1">Control de ingredientes disponibles</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agregar ingrediente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nombre del ingrediente" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Input type="number" placeholder="Cantidad" value={newGrams} onChange={(e) => setNewGrams(e.target.value)} />
          </div>
          <Button onClick={addItem} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </Button>
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{CATEGORY_LABELS[cat] || cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {catItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-sm flex-1">{item.ingredient_name}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateGrams(item.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Badge variant="secondary" className="min-w-[60px] justify-center tabular-nums">
                    {formatAmount(item.grams_available, item.unit)}
                  </Badge>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateGrams(item.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 text-orange-600"
                    onClick={() => markMissing(item)}
                    title="Me falta"
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Tu inventario está vacío. Agrega ingredientes para empezar.
        </p>
      )}
    </div>
  );
};

export default Inventory;
