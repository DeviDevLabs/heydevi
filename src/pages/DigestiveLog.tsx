import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const BRISTOL_LABELS = [
  "", "1-Duro", "2-Grumoso", "3-Agrietado", "4-Suave", "5-Blando", "6-Pastoso", "7-Líquido"
];

const ScaleInput = ({
  label, value, onChange, max = 5
}: { label: string; value: number; onChange: (v: number) => void; max?: number }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <div className="flex gap-1">
      {Array.from({ length: max + 1 }, (_, i) => (
        <Button
          key={i} size="sm" variant={value === i ? "default" : "outline"}
          onClick={() => onChange(i)}
          className="h-7 w-8 text-xs p-0"
        >
          {i}
        </Button>
      ))}
    </div>
  </div>
);

const DigestiveLog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];
  const [viewDate, setViewDate] = useState(todayStr);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Main fields
  const [bristol, setBristol] = useState(4);
  const [frequency, setFrequency] = useState(1);
  const [urgency, setUrgency] = useState(0);
  const [bloating, setBloating] = useState(0);
  const [pain, setPain] = useState(0);
  const [gas, setGas] = useState(0);
  const [reflux, setReflux] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const [logTime, setLogTime] = useState("");

  // Confounders
  const [sleepHours, setSleepHours] = useState("");
  const [stress, setStress] = useState(0);
  const [alcohol, setAlcohol] = useState(false);
  const [coffee, setCoffee] = useState(false);
  const [cyclePhase, setCyclePhase] = useState("");
  const [medsNotes, setMedsNotes] = useState("");

  const loadLogs = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("digestive_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", viewDate)
      .order("created_at", { ascending: false });
    setLogs(data || []);
    setLoading(false);
  }, [user, viewDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleAdd = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("digestive_logs").insert({
      user_id: user.id,
      log_date: viewDate,
      symptom: `bristol-${bristol}`,
      severity: Math.max(bloating, pain, gas, reflux, urgency),
      log_time: logTime || null,
      bristol,
      frequency,
      urgency,
      bloating,
      pain,
      gas,
      reflux,
      energy,
      notes: notes || null,
      sleep_hours: sleepHours ? Number(sleepHours) : null,
      stress,
      alcohol,
      coffee,
      cycle_phase: cyclePhase || null,
      meds_notes: medsNotes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNotes("");
      setLogTime("");
      loadLogs();
      toast({ title: "Registrado" });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("digestive_logs").delete().eq("id", id);
    loadLogs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Registro Digestivo</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra síntomas para detectar patrones</p>
      </div>

      <div className="flex items-center gap-3">
        <Label>Fecha</Label>
        <Input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="w-auto" />
        <Input type="time" value={logTime} onChange={(e) => setLogTime(e.target.value)} className="w-auto" placeholder="Hora" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deposición y síntomas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Bristol (1-7)</Label>
            <div className="flex gap-1 flex-wrap">
              {[1,2,3,4,5,6,7].map((n) => (
                <Button key={n} size="sm" variant={bristol === n ? "default" : "outline"}
                  onClick={() => setBristol(n)} className="h-8 text-xs px-2">
                  {BRISTOL_LABELS[n]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScaleInput label="Hinchazón (0-5)" value={bloating} onChange={setBloating} />
            <ScaleInput label="Dolor (0-5)" value={pain} onChange={setPain} />
            <ScaleInput label="Gases (0-5)" value={gas} onChange={setGas} />
            <ScaleInput label="Reflujo (0-5)" value={reflux} onChange={setReflux} />
            <ScaleInput label="Urgencia (0-5)" value={urgency} onChange={setUrgency} />
            <ScaleInput label="Energía (0-5)" value={energy} onChange={setEnergy} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Frecuencia (deposiciones hoy)</Label>
            <div className="flex gap-1">
              {[0,1,2,3,4,5].map((n) => (
                <Button key={n} size="sm" variant={frequency === n ? "default" : "outline"}
                  onClick={() => setFrequency(n)} className="h-7 w-8 text-xs p-0">{n}</Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Confusores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Horas de sueño</Label>
              <Input type="number" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="7.5" />
            </div>
            <ScaleInput label="Estrés (0-5)" value={stress} onChange={setStress} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={alcohol} onCheckedChange={setAlcohol} />
              <Label className="text-xs">Alcohol</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={coffee} onCheckedChange={setCoffee} />
              <Label className="text-xs">Café</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fase ciclo (opcional)</Label>
              <select className="h-10 px-2 rounded-md border border-input bg-background text-sm w-full" value={cyclePhase} onChange={(e) => setCyclePhase(e.target.value)}>
                <option value="">—</option>
                <option value="menstrual">Menstrual</option>
                <option value="folicular">Folicular</option>
                <option value="ovulacion">Ovulación</option>
                <option value="lutea">Lútea</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medicamentos/notas</Label>
              <Input value={medsNotes} onChange={(e) => setMedsNotes(e.target.value)} placeholder="AINE, etc." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
        <Button onClick={handleAdd} disabled={saving} className="w-full">
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </div>

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
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">Bristol {log.bristol || "?"}</Badge>
                    {log.bloating > 0 && <Badge variant="outline" className="text-xs">Hinch {log.bloating}</Badge>}
                    {log.gas > 0 && <Badge variant="outline" className="text-xs">Gas {log.gas}</Badge>}
                    {log.pain > 0 && <Badge variant="outline" className="text-xs">Dolor {log.pain}</Badge>}
                    {log.reflux > 0 && <Badge variant="outline" className="text-xs">Refl {log.reflux}</Badge>}
                    {log.log_time && <span className="text-xs text-muted-foreground">{log.log_time}</span>}
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(log.id)}>
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
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
