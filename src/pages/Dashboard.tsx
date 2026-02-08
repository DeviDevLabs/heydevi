import { useMemo, useState, useEffect, useCallback } from "react";
import { weeklyPlan } from "@/data/mealPlan";
import { getDayTotalProtein, getDayTotalCalories } from "@/lib/nutritionUtils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import useConsumedMeals from "@/hooks/useConsumedMeals";
import ProteinBar from "@/components/nutrition/ProteinBar";
import MealCard from "@/components/nutrition/MealCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const DEFAULT_PROTEIN_TARGET = 100;

// ── Supplement types (mirrors Supplements.tsx) ─────────
interface UserSupplement {
  id: string;
  name: string;
  form: string;
  default_unit: string;
  notes: string | null;
  active: boolean;
}
interface Regimen {
  id: string;
  supplement_id: string;
  start_date: string;
  end_date: string | null;
  dose_value: number;
  dose_unit: string;
  frequency: string;
  time_of_day: string | null;
}
const normName = (n: string) => n.trim().toLowerCase();

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const dayName = DAYS[new Date().getDay()];
  const todayStr = new Date().toISOString().split("T")[0];

  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN_TARGET);
  const [consumedMealIds, setConsumedMealIds] = useState<Set<string>>(new Set());

  // Supplement state
  const [rawSupplements, setRawSupplements] = useState<UserSupplement[]>([]);
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [takenSupIds, setTakenSupIds] = useState<Set<string>>(new Set());

  const todayPlan = useMemo(
    () => weeklyPlan.find((d) => d.dayName === dayName) || weeklyPlan[0],
    [dayName]
  );

  // Load user protein target
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("protein_target")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
          return;
        }
        if (!mounted) return;
        if (data?.protein_target) setProteinTarget(data.protein_target);
      } catch (e: any) {
        toast({ title: "Error", description: e?.message ?? "Error cargando perfil", variant: "destructive" });
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // ── Load supplements + regimens + today's history ────
  const loadSupplements = useCallback(async () => {
    if (!user) return;
    const [{ data: sups }, { data: regs }, { data: hist }] = await Promise.all([
      supabase.from("user_supplements").select("*").eq("user_id", user.id).order("active", { ascending: false }),
      supabase.from("supplement_regimens").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("supplement_histories").select("supplement_id").eq("user_id", user.id).eq("taken_at", todayStr),
    ]);
    setRawSupplements((sups as UserSupplement[]) || []);
    setRegimens((regs as Regimen[]) || []);
    setTakenSupIds(new Set((hist || []).map((h: any) => h.supplement_id)));
  }, [user, todayStr]);

  useEffect(() => { loadSupplements(); }, [loadSupplements]);

  // ── Deduplicate & sort supplements (same logic as Supplements.tsx) ──
  const sortedSupplements = useMemo(() => {
    const seen = new Map<string, UserSupplement>();
    for (const s of rawSupplements) {
      const key = normName(s.name);
      if (!seen.has(key)) seen.set(key, s);
      else {
        const existing = seen.get(key)!;
        if (!existing.active && s.active) seen.set(key, s);
      }
    }
    const unique = Array.from(seen.values());
    const latestDate = new Map<string, string>();
    for (const r of regimens) {
      const cur = latestDate.get(r.supplement_id);
      if (!cur || r.start_date > cur) latestDate.set(r.supplement_id, r.start_date);
    }
    return unique.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const dA = latestDate.get(a.id) || "0000";
      const dB = latestDate.get(b.id) || "0000";
      return dB.localeCompare(dA);
    });
  }, [rawSupplements, regimens]);

  // ── Get active regimen for a supplement (handles duplicates) ──
  const getActiveRegimen = useCallback(
    (supId: string, supName: string): Regimen | undefined => {
      const allIds = new Set(
        rawSupplements.filter((s) => normName(s.name) === normName(supName)).map((s) => s.id)
      );
      allIds.add(supId);
      return regimens.find((r) => allIds.has(r.supplement_id) && !r.end_date);
    },
    [regimens, rawSupplements]
  );

  // ── Toggle supplement taken today ────────────────────
  const toggleSupplementTaken = useCallback(async (sup: UserSupplement) => {
    if (!user) return;
    const wasTaken = takenSupIds.has(sup.id);

    // Optimistic update
    setTakenSupIds((prev) => {
      const next = new Set(prev);
      wasTaken ? next.delete(sup.id) : next.add(sup.id);
      return next;
    });

    try {
      if (wasTaken) {
        const { error } = await supabase
          .from("supplement_histories")
          .delete()
          .eq("user_id", user.id)
          .eq("supplement_id", sup.id)
          .eq("taken_at", todayStr);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("supplement_histories")
          .upsert(
            { user_id: user.id, supplement_id: sup.id, taken_at: todayStr, source: "dashboard" },
            { onConflict: "user_id,supplement_id,taken_at" }
          );
        if (error) throw error;
      }
    } catch (e: any) {
      // Revert optimistic update
      setTakenSupIds((prev) => {
        const next = new Set(prev);
        wasTaken ? next.add(sup.id) : next.delete(sup.id);
        return next;
      });
      toast({ title: "Error", description: e?.message ?? "Error guardando suplemento", variant: "destructive" });
    }
  }, [user, todayStr, takenSupIds, toast]);

  // consumed meals hook (fetch + optimistic toggle)
  const { consumedMealIds: consumedFromHook, loading: consumedLoading, toggleMeal } = useConsumedMeals(
    user?.id,
    todayStr
  );

  // Keep a local reference for fast rendering; sync when hook updates
  useEffect(() => {
    setConsumedMealIds(consumedFromHook);
  }, [consumedFromHook]);

  const consumedProtein = useMemo(
    () =>
      todayPlan.meals
        .filter((m) => consumedMealIds.has(`${m.time}-${m.label}`))
        .reduce((sum, m) => sum + m.protein, 0),
    [todayPlan.meals, consumedMealIds]
  );

  const totalProtein = getDayTotalProtein(todayPlan);
  const totalCalories = getDayTotalCalories(todayPlan);

  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif capitalize">{todayFormatted}</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu plan nutricional del dia</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Calorias plan</p>
            <p className="text-2xl font-bold mt-1">{totalCalories}</p>
            <p className="text-xs text-muted-foreground">kcal estimadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Consumidas</p>
            <p className="text-2xl font-bold mt-1">{consumedMealIds.size}/{todayPlan.meals.length}</p>
            <p className="text-xs text-muted-foreground">comidas marcadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <ProteinBar current={consumedProtein} target={proteinTarget} />
          <p className="text-xs text-muted-foreground">
            Plan total del dia: {totalProtein}g — Marca las comidas consumidas para actualizar
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Comidas del dia</h2>
        {todayPlan.meals.map((meal, i) => {
          const mealKey = `${meal.time}-${meal.label}`;
          const isConsumed = consumedMealIds.has(mealKey);
          return (
            <div key={i} className="flex items-start gap-3">
              <Checkbox
                checked={isConsumed}
                onCheckedChange={() => void toggleMeal(meal)}
                className="mt-4"
              />
              <div className={`flex-1 transition-opacity ${isConsumed ? "opacity-60" : ""}`}>
                <MealCard meal={meal} />
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suplementos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedSupplements.filter(s => s.active).map((sup) => {
            const active = getActiveRegimen(sup.id, sup.name);
            const isTaken = takenSupIds.has(sup.id);
            const doseLabel = active
              ? `${active.dose_value} ${active.dose_unit}, ${active.frequency === "daily" ? "diario" : active.frequency}`
              : "";
            const timeLabel = active?.time_of_day || "";
            return (
              <div key={sup.id} className="flex items-start gap-3">
                <Checkbox
                  id={`sup-${sup.id}`}
                  checked={isTaken}
                  onCheckedChange={() => void toggleSupplementTaken(sup)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`sup-${sup.id}`}
                  className={`text-sm leading-snug cursor-pointer transition-opacity ${isTaken ? "opacity-60 line-through" : ""}`}
                >
                  <span className="font-medium">{sup.name}</span>
                  {doseLabel && (
                    <span className="text-muted-foreground"> — {doseLabel}{timeLabel ? `, ${timeLabel}` : ""}</span>
                  )}
                </label>
              </div>
            );
          })}
          {sortedSupplements.filter(s => s.active).length === 0 && (
            <p className="text-xs text-muted-foreground">Sin suplementos activos</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Objetivo de agua: 2-2.5 litros/dia. Priorizar hidratacion por la manana y post-entreno.
            Si experimentas sintomas digestivos severos, consulta a un profesional de salud.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
