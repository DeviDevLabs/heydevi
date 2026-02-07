import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";

interface Suspect {
  name: string;
  type: string;
  avgScore: number;
  occurrences: number;
  exampleDates: string[];
}

interface SafeFood {
  name: string;
  safeDays: number;
}

interface Experiment {
  name: string;
  startDate: string;
  avgBefore: number;
  avgAfter: number;
  change: number;
  daysBefore: number;
  daysAfter: number;
}

interface ScoringResult {
  topSuspects: Suspect[];
  safeFoods: SafeFood[];
  experiments: Experiment[];
  totalLogs: number;
  period: string;
}

const DigestiveStats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scoring, setScoring] = useState<ScoringResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const requestAnalysis = useCallback(async () => {
    if (!user) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("digestive-analysis", {
        body: { days: 30 },
      });
      if (error) throw error;
      if (data?.scoring) setScoring(data.scoring);
      if (data?.analysis) setAiAnalysis(data.analysis);
      if (!data?.scoring && data?.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, [user, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Estadísticas Digestivas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis de correlaciones alimentos/síntomas
        </p>
      </div>

      {!scoring && !aiAnalysis && (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Genera un reporte basado en tus registros digestivos, comidas y suplementos de los últimos 30 días.
            </p>
            <Button onClick={requestAnalysis} disabled={analyzing}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</> : "Generar reporte"}
            </Button>
          </CardContent>
        </Card>
      )}

      {scoring && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total registros</p>
                <p className="text-2xl font-bold mt-1">{scoring.totalLogs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="text-sm font-medium mt-1">{scoring.period}</p>
              </CardContent>
            </Card>
          </div>

          {scoring.topSuspects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🔴 Top sospechosos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scoring.topSuspects.map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.type === "supplement" ? "secondary" : "outline"} className="text-xs">
                          {s.type === "supplement" ? "suplemento" : "alimento"}
                        </Badge>
                        <Badge variant="destructive" className="text-xs">
                          score {s.avgScore}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.occurrences} ocurrencias · Ej: {s.exampleDates.join(", ")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {scoring.safeFoods.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🟢 Posibles seguros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scoring.safeFoods.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.safeDays} días sin síntomas</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {scoring.experiments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🧪 Experimentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scoring.experiments.map((exp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{exp.name}</span>
                      <Badge variant={exp.change > 0 ? "destructive" : "secondary"} className="text-xs">
                        {exp.change > 0 ? "+" : ""}{exp.change}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Antes: {exp.avgBefore} ({exp.daysBefore}d) → Después: {exp.avgAfter} ({exp.daysAfter}d) · Desde {exp.startDate}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {aiAnalysis && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Análisis IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
          </CardContent>
        </Card>
      )}

      {(scoring || aiAnalysis) && (
        <Button onClick={requestAnalysis} disabled={analyzing} variant="outline" className="w-full">
          {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Actualizando...</> : "Actualizar reporte"}
        </Button>
      )}

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta información es educativa y no reemplaza consejo médico. Si experimentas síntomas severos o persistentes, consulta a un profesional de salud.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigestiveStats;
