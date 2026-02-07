import { useMemo, useState, useEffect, useCallback } from "react";
import { weeklyPlan } from "@/data/mealPlan";
import { supplements } from "@/data/supplements";
import { getDayTotalProtein, getDayTotalCalories } from "@/lib/nutritionUtils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ProteinBar from "@/components/nutrition/ProteinBar";
import MealCard from "@/components/nutrition/MealCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const DEFAULT_PROTEIN_TARGET = 100;

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const dayName = DAYS[new Date().getDay()];
  const todayStr = new Date().toISOString().split("T")[0];

  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN_TARGET);
  const [consumedMealIds, setConsumedMealIds] = useState<Set<string>>(new Set());

  const todayPlan = useMemo(
    () => weeklyPlan.find((d) => d.dayName === dayName) || weeklyPlan[0],
    [dayName]
  );

  // Load user protein target
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("protein_target")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.protein_target) setProteinTarget(data.protein_target);
      });
  }, [user]);

  // Load consumed meals for today
  const loadConsumed = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("consumed_meals")
      .select("meal_label, meal_time")
      .eq("user_id", user.id)
      .eq("consumed_date", todayStr);
    if (data) {
      setConsumedMealIds(new Set(data.map((m) => `${m.meal_time}-${m.meal_label}`)));
    }
  }, [user, todayStr]);

  useEffect(() => {
    loadConsumed();
  }, [loadConsumed]);

  const toggleMealConsumed = async (meal: typeof todayPlan.meals[0]) => {
    if (!user) return;
    const mealKey = `${meal.time}-${meal.label}`;

    if (consumedMealIds.has(mealKey)) {
      // Remove
      await supabase
        .from("consumed_meals")
        .delete()
        .eq("user_id", user.id)
        .eq("consumed_date", todayStr)
        .eq("meal_label", meal.label)
        .eq("meal_time", meal.time);
      setConsumedMealIds((prev) => {
        const next = new Set(prev);
        next.delete(mealKey);
        return next;
      });
    } else {
      // Add
      const { error } = await supabase.from("consumed_meals").insert({
        user_id: user.id,
        consumed_date: todayStr,
        meal_label: meal.label,
        meal_time: meal.time,
        recipe_id: meal.recipeId || null,
        description: meal.description,
        protein: meal.protein,
        calories: meal.calories,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setConsumedMealIds((prev) => new Set(prev).add(mealKey));
    }
  };

  const consumedProtein = todayPlan.meals
    .filter((m) => consumedMealIds.has(`${m.time}-${m.label}`))
    .reduce((sum, m) => sum + m.protein, 0);

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
                onCheckedChange={() => toggleMealConsumed(meal)}
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
          {supplements.map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <Checkbox id={`sup-${s.id}`} className="mt-0.5" />
              <label htmlFor={`sup-${s.id}`} className="text-sm leading-snug cursor-pointer">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground"> — {s.dose}, {s.time}</span>
              </label>
            </div>
          ))}
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
