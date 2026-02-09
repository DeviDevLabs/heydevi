import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getLocalDateStr } from "@/lib/dateUtils";

interface ConsumedMealRow {
  id: string;
  meal_label: string;
  meal_time: string | null;
  protein: number;
  calories: number;
  consumed_date: string;
  description: string | null;
}

const HistoryDrawer = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ConsumedMealRow[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from("consumed_meals")
        .select("id, meal_label, meal_time, protein, calories, consumed_date, description")
        .eq("user_id", user.id)
        .order("consumed_date", { ascending: false })
        .limit(50);
      setHistory((data as ConsumedMealRow[]) ?? []);
    })();
  }, [open, user]);

  const grouped = history.reduce<Record<string, ConsumedMealRow[]>>((acc, row) => {
    (acc[row.consumed_date] ??= []).push(row);
    return acc;
  }, {});

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Historial">
          <History className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Historial de comidas</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sin registros aún</p>
          )}
          {Object.entries(grouped).map(([date, meals]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{date}</p>
              <div className="space-y-1">
                {meals.map((m) => (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span>{m.meal_label}</span>
                    <span className="text-muted-foreground">{m.protein}g prot · {m.calories} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HistoryDrawer;
