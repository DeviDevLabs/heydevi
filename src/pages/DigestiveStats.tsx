import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface LogEntry {
  symptom: string;
  severity: number;
  associated_meal: string | null;
  log_date: string;
  log_time: string | null;
}

const DigestiveStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadAllLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("digestive_logs")
      .select("symptom, severity, associated_meal, log_date, log_time")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(200);
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAllLogs();
  }, [loadAllLogs]);

  // Compute stats
  const symptomCounts: Record<string, { count: number; totalSeverity: number }> = {};
  const mealCounts: Record<string, { count: number; totalSeverity: number }> = {};
  const weeklyData: Record<string, number> = {};

  logs.forEach((log) => {
    if (!symptomCounts[log.symptom]) symptomCounts[log.symptom] = { count: 0, totalSeverity: 0 };
    symptomCounts[log.symptom].count++;
    symptomCounts[log.symptom].totalSeverity += log.severity;

    if (log.associated_meal) {
      if (!mealCounts[log.associated_meal]) mealCounts[log.associated_meal] = { count: 0, totalSeverity: 0 };
      mealCounts[log.associated_meal].count++;
      mealCounts[log.associated_meal].totalSeverity += log.severity;
    }

    const week = log.log_date.slice(0, 7); // YYYY-MM
    weeklyData[week] = (weeklyData[week] || 0) + log.severity;
  });

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const topTriggerMeals = Object.entries(mealCounts)
    .sort((a, b) => b[1].totalSeverity / b[1].count - a[1].totalSeverity / a[1].count)
    .slice(0, 5);

  const bestMeals = Object.entries(mealCounts)
    .filter(([, v]) => v.count >= 1)
    .sort((a, b) => a[1].totalSeverity / a[1].count - b[1].totalSeverity / b[1].count)
    .slice(0, 5);

  const monthlyTrend = Object.entries(weeklyData).sort((a, b) => a[0].localeCompare(b[0]));

  const requestAiAnalysis = async () => {
    if (logs.length < 3) {
      toast({ title: "Necesitas al menos 3 registros para un análisis", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("digestive-analysis", {
        body: { logs: logs.slice(0, 50) },
      });
      if (error) throw error;
      setAiAnalysis(data?.analysis || "No se pudo generar el análisis.");
    } catch (e: any) {
      toast({ title: "Error en análisis", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm p-4">Cargando estadísticas...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Estadísticas Digestivas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Basado en {logs.length} registros
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Aún no tienes registros digestivos.</p>
            <p className="text-sm mt-1">Empieza a registrar síntomas en la sección de Registro Digestivo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Total registros</p>
                <p className="text-2xl font-bold mt-1">{logs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">Severidad promedio</p>
                <p className="text-2xl font-bold mt-1">
                  {(logs.reduce((s, l) => s + l.severity, 0) / logs.length).toFixed(1)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Síntomas más frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topSymptoms.map(([symptom, data]) => (
                <div key={symptom} className="flex items-center justify-between text-sm">
                  <span>{symptom}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{data.count}x</Badge>
                    <Badge variant="secondary">
                      avg {(data.totalSeverity / data.count).toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
              {topSymptoms.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🔴 Top gatillantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topTriggerMeals.map(([meal, data]) => (
                <div key={meal} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{meal}</span>
                  <Badge variant="destructive" className="text-xs">
                    avg {(data.totalSeverity / data.count).toFixed(1)}/5
                  </Badge>
                </div>
              ))}
              {topTriggerMeals.length === 0 && (
                <p className="text-sm text-muted-foreground">Asocia comidas a tus síntomas para ver patrones</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🟢 Comidas que mejor te caen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bestMeals.map(([meal, data]) => (
                <div key={meal} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{meal}</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    avg {(data.totalSeverity / data.count).toFixed(1)}/5
                  </Badge>
                </div>
              ))}
              {bestMeals.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>

          {monthlyTrend.length > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tendencia mensual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {monthlyTrend.map(([month, total]) => (
                  <div key={month} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{month}</span>
                    <div className="flex-1 mx-3">
                      <div
                        className="h-2 bg-primary/30 rounded-full"
                        style={{ width: `${Math.min(100, (total / Math.max(...monthlyTrend.map(([, v]) => v))) * 100)}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs">{total} pts</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Análisis con IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiAnalysis ? (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Analiza tus registros con IA para detectar correlaciones y recibir recomendaciones personalizadas.
                </p>
              )}
              <Button onClick={requestAiAnalysis} disabled={analyzing} className="w-full" variant="outline">
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : aiAnalysis ? "Actualizar análisis" : "Analizar mis registros"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esto es información educativa y no reemplaza consejo médico. Si experimentas síntomas severos o persistentes, consulta a un profesional de salud.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DigestiveStats;
