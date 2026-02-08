import { useCallback, useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDateES, getMonthRange, getLocalDateStr } from "@/lib/dateUtils";
import { History, Download, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface MealEntry {
  id: string;
  consumed_date: string;
  meal_label: string;
  meal_name?: string | null;
  meal_time?: string | null;
  description?: string | null;
  calories?: number | null;
  protein?: number | null;
  ingredients?: unknown;
  mood?: string | null;
  digestion_score?: number | null;
}

interface DaySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  mealsCount: number;
  meals: MealEntry[];
}

const HistoryDrawer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DaySummary[]>([]);

  const todayStr = getLocalDateStr();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const normalizeIngredients = (ingredients: unknown) => {
    if (!ingredients) return [] as string[];
    if (Array.isArray(ingredients)) {
      return ingredients
        .map((item) => {
          if (item && typeof item === "object") {
            const candidate =
              "name" in item
                ? (item as { name?: unknown }).name
                : "ingredient_name" in item
                  ? (item as { ingredient_name?: unknown }).ingredient_name
                  : "ingredient" in item
                    ? (item as { ingredient?: unknown }).ingredient
                    : item;
            return String(candidate ?? "").trim();
          }
          return String(item ?? "").trim();
        })
        .filter(Boolean);
    }
    if (typeof ingredients === "string") {
      return ingredients
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [] as string[];
  };

  const getDigestiveIndicator = (meal: MealEntry) => {
    const score = meal.digestion_score;
    if (typeof score === "number") {
      if (score >= 4) return "good";
      if (score <= 2) return "heavy";
      return "neutral";
    }
    const mood = meal.mood?.toLowerCase();
    if (mood?.includes("bien") || mood?.includes("liger") || mood?.includes("ok")) return "good";
    if (mood?.includes("pesad") || mood?.includes("mal") || mood?.includes("inflam")) return "heavy";
    return "neutral";
  };

  const getFeelGoodLabel = (meal: MealEntry) => {
    const indicator = getDigestiveIndicator(meal);
    if (indicator === "good") return "Ligero";
    if (indicator === "heavy") return "Pesado";
    return null;
  };

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consumed_meals")
        .select(
          "id, consumed_date, calories, protein, meal_label, meal_name, meal_time, description, ingredients, mood, digestion_score"
        )
        .eq("user_id", user.id)
        .gte("consumed_date", monthStart)
        .lte("consumed_date", monthEnd)
        .order("consumed_date", { ascending: false });

      if (error) throw error;

      // Group by date
      const map = new Map<string, DaySummary>();
      for (const row of (data || []) as MealEntry[]) {
        const d = row.consumed_date;
        if (!map.has(d)) {
          map.set(d, { date: d, totalCalories: 0, totalProtein: 0, mealsCount: 0, meals: [] });
        }
        const s = map.get(d)!;
        s.totalCalories += Number(row.calories) || 0;
        s.totalProtein += Number(row.protein) || 0;
        s.mealsCount += 1;
        s.meals.push(row);
      }

      setDays(
        Array.from(map.values())
          .map((day) => ({
            ...day,
            meals: day.meals.sort((a, b) => (a.meal_time || "").localeCompare(b.meal_time || "")),
          }))
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Error cargando historial", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, monthStart, monthEnd, toast]);

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  const downloadCSV = useCallback(() => {
    if (days.length === 0) {
      toast({ title: "Sin datos", description: "No hay registros para exportar este mes", variant: "destructive" });
      return;
    }

    const header = "Fecha,Calorías,Proteína (g),Comidas registradas,Ingredientes,Notas digestivas";
    const rows = days.map((d) => {
      const ingredients = Array.from(
        new Set(d.meals.flatMap((meal) => normalizeIngredients(meal.ingredients)))
      ).join(" | ");
      const notes = d.meals
        .map((meal) => {
          const name = meal.meal_name || meal.meal_label || "Comida";
          const score = typeof meal.digestion_score === "number" ? `score ${meal.digestion_score}` : "";
          const mood = meal.mood ? `mood ${meal.mood}` : "";
          const label = [score, mood].filter(Boolean).join(" ");
          return label ? `${name}: ${label}` : null;
        })
        .filter(Boolean)
        .join(" | ");
      return `${d.date},${d.totalCalories},${d.totalProtein},${d.mealsCount},"${ingredients}","${notes}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date();
    a.download = `reporte-nutricional-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Descargado", description: "Reporte mensual exportado como CSV" });
  }, [days, toast]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-h-[44px]">
          <History className="w-4 h-4" />
          Ver Historial
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between pb-2">
          <DrawerTitle className="text-lg">Historial del mes</DrawerTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 min-h-[44px]"
            onClick={downloadCSV}
            aria-label="Descargar CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar CSV</span>
          </Button>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay registros este mes
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {days.map((day) => (
                <AccordionItem key={day.date} value={day.date} className="border rounded-lg">
                  <AccordionTrigger
                    className={`px-3 py-3 rounded-lg ${
                      day.date === todayStr ? "bg-primary/5" : "bg-background"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-medium capitalize">{formatDateES(day.date)}</p>
                        <p className="text-xs text-muted-foreground">{day.mealsCount} comidas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{day.totalCalories} kcal</p>
                        <p className="text-xs text-muted-foreground">{day.totalProtein}g proteína</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-3">
                      {day.meals.map((meal) => {
                        const ingredients = normalizeIngredients(meal.ingredients);
                        const indicator = getDigestiveIndicator(meal);
                        const feelLabel = getFeelGoodLabel(meal);
                        const mealName = meal.meal_name || meal.meal_label || "Comida";
                        return (
                          <div key={meal.id} className="rounded-md border border-border/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold">{mealName}</p>
                                  {meal.meal_time ? (
                                    <span className="text-xs text-muted-foreground">{meal.meal_time}</span>
                                  ) : null}
                                  {feelLabel ? <Badge variant="secondary">{feelLabel}</Badge> : null}
                                </div>
                                {meal.description ? (
                                  <p className="text-xs text-muted-foreground mt-1">{meal.description}</p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                {indicator !== "neutral" ? (
                                  <span
                                    className={`inline-flex items-center text-xs ${
                                      indicator === "good" ? "text-emerald-600" : "text-rose-600"
                                    }`}
                                  >
                                    <Circle className="w-2.5 h-2.5 fill-current" />
                                  </span>
                                ) : null}
                                <div className="text-right">
                                  <p className="text-xs font-medium">{Number(meal.calories) || 0} kcal</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {Number(meal.protein) || 0}g proteína
                                  </p>
                                </div>
                              </div>
                            </div>
                            {ingredients.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {ingredients.map((ingredient) => (
                                  <Badge
                                    key={`${meal.id}-${ingredient}`}
                                    variant={indicator === "good" ? "default" : "outline"}
                                    className="text-[11px] px-2 py-0.5"
                                  >
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">Sin ingredientes registrados</p>
                            )}
                            {meal.mood || typeof meal.digestion_score === "number" ? (
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {typeof meal.digestion_score === "number" ? (
                                  <span>Digestión: {meal.digestion_score}/5</span>
                                ) : null}
                                {meal.mood ? <span>Ánimo: {meal.mood}</span> : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HistoryDrawer;
