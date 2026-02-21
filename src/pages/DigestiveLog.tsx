import { useState, useEffect, useCallback, useReducer } from "react";
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
import { z } from "zod";

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

  const formSchema = z.object({
    bristol: z.number().int().min(1).max(7),
    frequency: z.number().int().min(0),
    urgency: z.number().min(0).max(5),
    bloating: z.number().min(0).max(5),
    pain: z.number().min(0).max(5),
    gas: z.number().min(0).max(5),
    reflux: z.number().min(0).max(5),
    energy: z.number().min(0).max(5),
    notes: z.string().optional().nullable(),
    log_time: z.string().optional().nullable(),
    sleep_hours: z.preprocess((v) => {
      if (typeof v === "string") return v === "" ? null : Number(v);
      return v;
    }, z.number().min(0).max(24).nullable().optional()),
    stress: z.number().min(0).max(5),
    alcohol: z.boolean(),
    coffee: z.boolean(),
    cycle_phase: z.string().optional().nullable(),
    meds_notes: z.string().optional().nullable(),
  });

  type FormType = z.infer<typeof formSchema>;

  const initialFormState: FormType = {
    bristol: 4,
    frequency: 1,
    urgency: 0,
    bloating: 0,
    pain: 0,
    gas: 0,
    reflux: 0,
    energy: 3,
    notes: "",
    log_time: "",
    sleep_hours: null,
    stress: 0,
    alcohol: false,
    coffee: false,
    cycle_phase: "",
    meds_notes: "",
  } as FormType;

  type FormAction =
    | { type: "field"; field: keyof FormType; value: any }
    | { type: "reset"; payload: Partial<FormType> }
    | { type: "clear" };

  function formReducer(state: FormType, action: FormAction): FormType {
    switch (action.type) {
      case "field":
        return { ...state, [action.field]: action.value } as FormType;
      case "reset":
        return { ...state, ...action.payload } as FormType;
      case "clear":
        return { ...initialFormState } as FormType;
      default:
        return state;
    }
  }

  const [form, dispatch] = useReducer(formReducer, initialFormState);

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
  const formValid = formSchema.safeParse(form).success;

  const handleAdd = async () => {
    if (!user) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      const msg = first ? `${first.path.join(".")} ${first.message}` : "Formulario inválido";
      toast({ title: "Formulario inválido", description: msg, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("digestive_logs").insert({
        user_id: user.id,
        log_date: viewDate,
        symptom: `bristol-${form.bristol}`,
        severity: Math.max(1, form.bloating, form.pain, form.gas, form.reflux, form.urgency),
        log_time: form.log_time || null,
        bristol: form.bristol,
        frequency: form.frequency,
        urgency: form.urgency,
        bloating: form.bloating,
        pain: form.pain,
        gas: form.gas,
        reflux: form.reflux,
        energy: form.energy,
        notes: form.notes || null,
        sleep_hours: form.sleep_hours === null ? null : Number(form.sleep_hours),
        stress: form.stress,
        alcohol: form.alcohol,
        coffee: form.coffee,
        cycle_phase: form.cycle_phase || null,
        meds_notes: form.meds_notes || null,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        dispatch({ type: "field", field: "notes", value: "" });
        dispatch({ type: "field", field: "log_time", value: "" });
        loadLogs();
        toast({ title: "Registrado" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.");
    if (!ok) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("digestive_logs").delete().eq("id", id);
      if (error) {
        toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      } else {
        loadLogs();
        toast({ title: "Eliminado" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
        <Input type="time" value={form.log_time ?? ""} onChange={(e) => dispatch({ type: "field", field: "log_time", value: e.target.value })} className="w-auto" placeholder="Hora" />
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
                <Button key={n} size="sm" variant={form.bristol === n ? "default" : "outline"}
                  onClick={() => dispatch({ type: "field", field: "bristol", value: n })} className="h-8 text-xs px-2">
                  {BRISTOL_LABELS[n]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ScaleInput label="Hinchazón (0-5)" value={form.bloating} onChange={(v) => dispatch({ type: "field", field: "bloating", value: v })} />
            <ScaleInput label="Dolor (0-5)" value={form.pain} onChange={(v) => dispatch({ type: "field", field: "pain", value: v })} />
            <ScaleInput label="Gases (0-5)" value={form.gas} onChange={(v) => dispatch({ type: "field", field: "gas", value: v })} />
            <ScaleInput label="Reflujo (0-5)" value={form.reflux} onChange={(v) => dispatch({ type: "field", field: "reflux", value: v })} />
            <ScaleInput label="Urgencia (0-5)" value={form.urgency} onChange={(v) => dispatch({ type: "field", field: "urgency", value: v })} />
            <ScaleInput label="Energía (0-5)" value={form.energy} onChange={(v) => dispatch({ type: "field", field: "energy", value: v })} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Frecuencia (deposiciones hoy)</Label>
            <div className="flex gap-1">
              {[0,1,2,3,4,5].map((n) => (
                <Button key={n} size="sm" variant={form.frequency === n ? "default" : "outline"}
                  onClick={() => dispatch({ type: "field", field: "frequency", value: n })} className="h-7 w-8 text-xs p-0">{n}</Button>
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
              <Input type="number" step="0.5" value={form.sleep_hours ?? ""} onChange={(e) => dispatch({ type: "field", field: "sleep_hours", value: e.target.value })} placeholder="7.5" />
            </div>
            <ScaleInput label="Estrés (0-5)" value={form.stress} onChange={(v) => dispatch({ type: "field", field: "stress", value: v })} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.alcohol} onCheckedChange={(v) => dispatch({ type: "field", field: "alcohol", value: v })} />
              <Label className="text-xs">Alcohol</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.coffee} onCheckedChange={(v) => dispatch({ type: "field", field: "coffee", value: v })} />
              <Label className="text-xs">Café</Label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fase ciclo (opcional)</Label>
              <select className="h-10 px-2 rounded-md border border-input bg-background text-sm w-full" value={form.cycle_phase} onChange={(e) => dispatch({ type: "field", field: "cycle_phase", value: e.target.value })}>
                <option value="">—</option>
                <option value="menstrual">Menstrual</option>
                <option value="folicular">Folicular</option>
                <option value="ovulacion">Ovulación</option>
                <option value="lutea">Lútea</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medicamentos/notas</Label>
              <Input value={form.meds_notes} onChange={(e) => dispatch({ type: "field", field: "meds_notes", value: e.target.value })} placeholder="AINE, etc." />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Textarea value={form.notes} onChange={(e) => dispatch({ type: "field", field: "notes", value: e.target.value })} placeholder="Notas adicionales..." rows={2} />
        <Button onClick={handleAdd} disabled={saving || !formValid} className="w-full">
          {saving ? "Guardando..." : "Registrar"}
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Registros del {viewDate === todayStr ? "día" : viewDate}</h2>
        {(() => {
          if (loading) {
            return <p className="text-muted-foreground text-sm">Cargando...</p>;
          }
          
          if (logs.length === 0) {
            return (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground text-sm">
                  Sin registros para esta fecha 🎉
                </CardContent>
              </Card>
            );
          }
          
          return logs.map((log) => (
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
          ));
        })()}
      </div>
    </div>
  );
};

export default DigestiveLog;
