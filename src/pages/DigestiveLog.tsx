import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SYMPTOM_OPTIONS } from "@/lib/digestiveUtils";
import { recipes } from "@/data/recipes";
import { Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  symptom: string;
  severity: number;
  log_time: string | null;
  associated_meal: string | null;
  notes: string | null;
  log_date: string;
}

const DigestiveLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];
  const [viewDate, setViewDate] = useState(todayStr);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New entry form
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState(3);
  const [logTime, setLogTime] = useState("");
  const [meal, setMeal] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("digestive_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", viewDate)
      .order("created_at", { ascending: false });
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  }, [user, viewDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleAdd = async () => {
    if (!user || !symptom) return;
    setSaving(true);
    const { error } = await supabase.from("digestive_logs").insert({
      user_id: user.id,
      log_date: viewDate,
      symptom,
      severity,
      log_time: logTime || null,
      associated_meal: meal || null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSymptom("");
      setSeverity(3);
      setLogTime("");
      setMeal("");
      setNotes("");
      loadLogs();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("digestive_logs").delete().eq("id", id);
    loadLogs();
  };

  const severityColor = (s: number) => {
    if (s <= 2) return "bg-green-100 text-green-800";
    if (s <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Registro Digestivo</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra tus síntomas para detectar patrones</p>
      </div>

      <div className="flex items-center gap-3">
        <Label>Fecha</Label>
        <Input
          type="date"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          className="w-auto"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Nuevo registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Síntoma</Label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={symptom === s ? "default" : "outline"}
                  onClick={() => setSymptom(s)}
                  className="text-xs"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Severidad (1-5)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={severity === n ? "default" : "outline"}
                  onClick={() => setSeverity(n)}
                  className={`w-10 ${severity === n ? "" : ""}`}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">1 = leve, 5 = severo</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Hora</Label>
              <Input type="time" value={logTime} onChange={(e) => setLogTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Comida asociada</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={meal}
                onChange={(e) => setMeal(e.target.value)}
              >
                <option value="">Ninguna</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto adicional..."
              rows={2}
            />
          </div>

          <Button onClick={handleAdd} disabled={saving || !symptom} className="w-full">
            {saving ? "Guardando..." : "Registrar síntoma"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Registros del {viewDate === todayStr ? "día" : viewDate}</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground text-sm">
              Sin registros para esta fecha 🎉
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.symptom}</span>
                    <Badge className={`text-xs ${severityColor(log.severity)}`}>
                      {log.severity}/5
                    </Badge>
                    {log.log_time && (
                      <span className="text-xs text-muted-foreground">{log.log_time}</span>
                    )}
                  </div>
                  {log.associated_meal && (
                    <p className="text-xs text-muted-foreground">📍 {log.associated_meal}</p>
                  )}
                  {log.notes && (
                    <p className="text-xs text-muted-foreground">{log.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DigestiveLog;
