import { useCallback, useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDateES, getMonthRange, getLocalDateStr } from "@/lib/dateUtils";
import { History, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DaySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  mealsCount: number;
}

const HistoryDrawer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DaySummary[]>([]);

  const todayStr = getLocalDateStr();
  const { start: monthStart, end: monthEnd } = getMonthRange();

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consumed_meals")
        .select("consumed_date, calories, protein")
        .eq("user_id", user.id)
        .gte("consumed_date", monthStart)
        .lte("consumed_date", monthEnd)
        .order("consumed_date", { ascending: false });

      if (error) throw error;

      // Group by date
      const map = new Map<string, DaySummary>();
      for (const row of data || []) {
        const d = row.consumed_date;
        if (!map.has(d)) {
          map.set(d, { date: d, totalCalories: 0, totalProtein: 0, mealsCount: 0 });
        }
        const s = map.get(d)!;
        s.totalCalories += Number(row.calories) || 0;
        s.totalProtein += Number(row.protein) || 0;
        s.mealsCount += 1;
      }

      setDays(Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date)));
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

    const header = "Fecha,Calorías,Proteína (g),Comidas registradas";
    const rows = days.map(
      (d) => `${d.date},${d.totalCalories},${d.totalProtein},${d.mealsCount}`
    );
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
          <Button variant="ghost" size="sm" className="gap-2 min-h-[44px]" onClick={downloadCSV}>
            <Download className="w-4 h-4" />
            Descargar CSV
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
            days.map((day) => (
              <div
                key={day.date}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  day.date === todayStr ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div>
                  <p className="text-sm font-medium capitalize">{formatDateES(day.date)}</p>
                  <p className="text-xs text-muted-foreground">{day.mealsCount} comidas</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{day.totalCalories} kcal</p>
                  <p className="text-xs text-muted-foreground">{day.totalProtein}g proteína</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HistoryDrawer;
