import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DigestiveLog {
  log_date: string;
  log_time: string | null;
  bristol: number | null;
  bloating: number;
  pain: number;
  gas: number;
  reflux: number;
  urgency: number;
  energy: number | null;
  stress: number | null;
  alcohol: boolean;
  coffee: boolean;
  sleep_hours: number | null;
  notes: string | null;
}

interface MealLogItem {
  food_item_id: string;
  qty: number;
  food_item_name: string;
}

interface MealLog {
  logged_at: string;
  items: MealLogItem[];
}

/**
 * Compute a symptom score for a given log (0-25 scale).
 * Higher = worse.
 */
function symptomScore(log: DigestiveLog): number {
  const bristolPenalty = log.bristol
    ? Math.abs(log.bristol - 4) * 2 // 4 is ideal
    : 0;
  return (
    (log.bloating || 0) +
    (log.pain || 0) +
    (log.gas || 0) +
    (log.reflux || 0) +
    (log.urgency || 0) +
    bristolPenalty
  );
}

/**
 * Compute confounder weight: if stress high or alcohol, reduce weight of that day.
 */
function dayWeight(log: DigestiveLog): number {
  let w = 1.0;
  if ((log.stress || 0) >= 4) w *= 0.5;
  if (log.alcohol) w *= 0.5;
  return w;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { days = 30 } = await req.json().catch(() => ({ days: 30 }));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    // Fetch data in parallel
    const [
      { data: logs },
      { data: mealLogs },
      { data: experiments },
      { data: activeRegimens },
    ] = await Promise.all([
      supabase
        .from("digestive_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", sinceStr)
        .order("log_date"),
      supabase
        .from("meal_logs")
        .select("id, logged_at, meal_log_items(food_item_id, qty, food_items(name))")
        .eq("user_id", user.id)
        .gte("logged_at", since.toISOString()),
      supabase
        .from("food_experiments")
        .select("*, food_items(name)")
        .eq("user_id", user.id),
      supabase
        .from("supplement_regimens")
        .select("*, user_supplements(name, brand)")
        .eq("user_id", user.id)
        .is("end_date", null),
    ]);

    if (!logs || logs.length < 3) {
      return new Response(
        JSON.stringify({
          scoring: null,
          analysis: "Se necesitan al menos 3 registros digestivos para generar un análisis.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === LOCAL SCORING ALGORITHM ===
    // Build food-symptom associations with delay windows
    const foodScores = new Map<string, { score: number; count: number; dates: string[] }>();
    const supplementScores = new Map<string, { score: number; count: number; dates: string[] }>();
    const safeFoods = new Map<string, number>();

    // Process consumed meals from consumed_meals table
    const { data: consumedMeals } = await supabase
      .from("consumed_meals")
      .select("consumed_date, description, recipe_id")
      .eq("user_id", user.id)
      .gte("consumed_date", sinceStr);

    // For each log day, look at meals in 0-72h window before
    for (const log of logs as DigestiveLog[]) {
      const logDate = new Date(log.log_date);
      const score = symptomScore(log);
      const weight = dayWeight(log);

      // Check consumed meals in windows
      if (consumedMeals) {
        for (const meal of consumedMeals) {
          const mealDate = new Date(meal.consumed_date);
          const diffHours = (logDate.getTime() - mealDate.getTime()) / (1000 * 60 * 60);

          if (diffHours >= 0 && diffHours <= 72) {
            const foodName = meal.description || meal.recipe_id || "unknown";
            const existing = foodScores.get(foodName) || { score: 0, count: 0, dates: [] };
            existing.score += score * weight;
            existing.count += 1;
            if (existing.dates.length < 3) existing.dates.push(log.log_date);
            foodScores.set(foodName, existing);

            if (score <= 2) {
              safeFoods.set(foodName, (safeFoods.get(foodName) || 0) + 1);
            }
          }
        }
      }

      // Check active supplements
      if (activeRegimens) {
        for (const reg of activeRegimens as any[]) {
          const regStart = new Date(reg.start_date);
          if (logDate >= regStart) {
            const supName = reg.user_supplements?.name || "unknown";
            const existing = supplementScores.get(supName) || { score: 0, count: 0, dates: [] };
            existing.score += score * weight;
            existing.count += 1;
            if (existing.dates.length < 3) existing.dates.push(log.log_date);
            supplementScores.set(supName, existing);
          }
        }
      }
    }

    // Compute averages and rank
    const suspects: any[] = [];
    for (const [name, data] of foodScores) {
      if (data.count >= 2) {
        suspects.push({
          name,
          type: "food",
          avgScore: Math.round((data.score / data.count) * 10) / 10,
          occurrences: data.count,
          exampleDates: data.dates,
        });
      }
    }
    for (const [name, data] of supplementScores) {
      if (data.count >= 2) {
        suspects.push({
          name,
          type: "supplement",
          avgScore: Math.round((data.score / data.count) * 10) / 10,
          occurrences: data.count,
          exampleDates: data.dates,
        });
      }
    }
    suspects.sort((a, b) => b.avgScore - a.avgScore);

    const safeList = Array.from(safeFoods.entries())
      .filter(([name]) => !suspects.find((s) => s.name === name && s.avgScore > 3))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, safeDays: count }));

    // Experiment analysis
    const experimentResults: any[] = [];
    if (experiments) {
      for (const exp of experiments as any[]) {
        const expName = exp.food_items?.name || "unknown";
        const beforeLogs = (logs as DigestiveLog[]).filter(
          (l) => new Date(l.log_date) < new Date(exp.start_date)
        );
        const afterLogs = (logs as DigestiveLog[]).filter(
          (l) => new Date(l.log_date) >= new Date(exp.start_date)
        );
        if (beforeLogs.length > 0 && afterLogs.length > 0) {
          const avgBefore = beforeLogs.reduce((s, l) => s + symptomScore(l), 0) / beforeLogs.length;
          const avgAfter = afterLogs.reduce((s, l) => s + symptomScore(l), 0) / afterLogs.length;
          experimentResults.push({
            name: expName,
            startDate: exp.start_date,
            avgBefore: Math.round(avgBefore * 10) / 10,
            avgAfter: Math.round(avgAfter * 10) / 10,
            change: Math.round((avgAfter - avgBefore) * 10) / 10,
            daysBefore: beforeLogs.length,
            daysAfter: afterLogs.length,
          });
        }
      }
    }

    const scoring = {
      topSuspects: suspects.slice(0, 10),
      safeFoods: safeList,
      experiments: experimentResults,
      totalLogs: logs.length,
      period: `${sinceStr} a ${new Date().toISOString().split("T")[0]}`,
    };

    // === AI ANALYSIS ===
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiAnalysis = null;

    if (LOVABLE_API_KEY && logs.length >= 5) {
      const logsText = (logs as any[])
        .map(
          (l) =>
            `${l.log_date} ${l.log_time || ""}: Bristol=${l.bristol || "?"}, Hinch=${l.bloating}, Gas=${l.gas}, Dolor=${l.pain}, Reflujo=${l.reflux}, Estrés=${l.stress || "?"}, Sueño=${l.sleep_hours || "?"}h`
        )
        .join("\n");

      const scoringContext = `Top sospechosos: ${suspects.slice(0, 5).map((s: any) => `${s.name}(score:${s.avgScore})`).join(", ")}. Seguros: ${safeList.slice(0, 5).map((s) => s.name).join(", ")}`;

      try {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `Analiza registros digestivos. Incluye: patrones, top gatillantes, comidas seguras, recomendaciones prácticas, tendencia. En español, conciso, con emojis. Termina con disclaimer educativo.`,
                },
                {
                  role: "user",
                  content: `Registros:\n${logsText}\n\nAnálisis scoring:\n${scoringContext}`,
                },
              ],
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          aiAnalysis = data.choices?.[0]?.message?.content || null;
        }
      } catch (e) {
        console.error("AI analysis error:", e);
      }
    }

    return new Response(
      JSON.stringify({ scoring, analysis: aiAnalysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("digestive-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
