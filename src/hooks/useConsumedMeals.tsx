import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type MealLike = {
  time: string;
  label: string;
  recipeId?: string | null;
  description?: string | null;
  protein?: number | null;
  calories?: number | null;
};

export function useConsumedMeals(userId?: string | null, date?: string) {
  const { toast } = useToast();
  const [consumedMealIds, setConsumedMealIds] = useState<Set<string>>(new Set());
  const [consumedMeals, setConsumedMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsumed = useCallback(async () => {
    if (!userId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("consumed_meals")
        .select("*")
        .eq("user_id", userId)
        .eq("consumed_date", date);

      if (fetchError) {
        setError(fetchError.message);
        toast({ title: "Error cargando comidas", description: fetchError.message, variant: "destructive" });
        return;
      }

      if (data) {
        setConsumedMeals(data);
        setConsumedMealIds(new Set(data.map((m: any) => `${m.meal_time}-${m.meal_label}`)));
      }
    } catch (e: any) {
      const msg = e?.message ?? "Error desconocido";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, date, toast]);

  useEffect(() => {
    fetchConsumed();
  }, [fetchConsumed]);

  const toggleMeal = useCallback(
    async (meal: MealLike) => {
      if (!userId || !date) return;
      const mealKey = `${meal.time}-${meal.label}`;

      // Optimistic update
      setConsumedMealIds((prev) => {
        const next = new Set(prev);
        if (next.has(mealKey)) next.delete(mealKey);
        else next.add(mealKey);
        return next;
      });

      try {
        // Check if exists currently on server (best-effort) by trying delete first when we optimistically removed
        const currentlyConsumed = await (async () => {
          const { data } = await supabase
            .from("consumed_meals")
            .select("id")
            .eq("user_id", userId)
            .eq("consumed_date", date)
            .eq("meal_label", meal.label)
            .eq("meal_time", meal.time)
            .maybeSingle();
          return Boolean(data);
        })();

        if (currentlyConsumed) {
          const { error: delError } = await supabase
            .from("consumed_meals")
            .delete()
            .eq("user_id", userId)
            .eq("consumed_date", date)
            .eq("meal_label", meal.label)
            .eq("meal_time", meal.time);
          if (delError) throw delError;
        } else {
          const { error: insertError } = await supabase.from("consumed_meals").insert({
            user_id: userId,
            consumed_date: date,
            meal_label: meal.label,
            meal_time: meal.time,
            recipe_id: meal.recipeId ?? null,
            description: meal.description ?? null,
            protein: meal.protein ?? null,
            calories: meal.calories ?? null,
          });
          if (insertError) throw insertError;
        }
      } catch (e: any) {
        const msg = e?.message ?? "Error updating consumed meal";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });

        // Revert optimistic change
        setConsumedMealIds((prev) => {
          const next = new Set(prev);
          if (next.has(mealKey)) next.delete(mealKey);
          else next.add(mealKey);
          return next;
        });
      }
    },
    [userId, date, toast]
  );

  const deleteMealById = useCallback(async (mealId: string) => {
    try {
      const { error: delError } = await supabase
        .from("consumed_meals")
        .delete()
        .eq("id", mealId);
      
      if (delError) throw delError;
      
      setConsumedMeals((prev) => prev.filter(m => m.id !== mealId));
      toast({ title: "Comida eliminada" });
    } catch (e: any) {
      toast({ title: "Error al eliminar", description: e?.message, variant: "destructive" });
    }
  }, [toast]);

  return { consumedMealIds, consumedMeals, loading, error, fetchConsumed, toggleMeal, deleteMealById } as const;
}

export default useConsumedMeals;
